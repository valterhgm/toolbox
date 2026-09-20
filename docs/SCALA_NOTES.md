# Scala for a Rails Developer — running notes

A glossary that grows as we build. Each entry maps a Scala/functional concept
to something you already know from Rails/Ruby, then says why Scala does it
differently.

---

## `IO[A]` — an effect is a value, not an execution

In Ruby, calling a method that does I/O just... does it, immediately. In
Scala with Cats Effect, `IO[A]` is a **description** of a computation that
will eventually produce an `A` — nothing happens until something "runs" it
(that's what `IOApp` does at the very edge of your program, in `Main.scala`).

Think of it like an unstarted `Promise`, except it doesn't start on creation —
only when run. This lets you build up complex programs by combining `IO`
values with `map`/`flatMap` without anything executing prematurely, and makes
testing much easier (you can inspect/compose the *description* without side
effects happening).

## `for`-comprehensions are `flatMap` chains, not loops

```scala
for {
  response <- app.run(request)
  body     <- response.as[Json]
} yield { ... }
```

This looks like Ruby's `each`/`for` but isn't iteration — it's sugar for:

```scala
app.run(request).flatMap(response => response.as[Json].map(body => { ... }))
```

Works for any type with `map`/`flatMap` (`IO`, `Option`, `List`, `Either`...).
Rails analogue: closest thing is chaining `.then()` in JS promises, generalized
to work on any "container" type, not just promises.

## `F[_]: Sync` — programming against an unknown effect type

```scala
def routes[F[_]: Sync]: HttpRoutes[F] = ...
```

`F[_]` is a **type parameter that itself takes a type parameter** (a "higher-kinded
type") — it means "some effect type, to be decided by the caller." `: Sync` is
a **context bound**: it requires that whatever `F` turns out to be, there must be
a `Sync[F]` instance available (i.e., `F` supports synchronous effect suspension).
In our code the caller picks `F = IO`. This is how http4s routes stay testable
and effect-agnostic — closest Rails analogue is duck-typing/dependency injection,
but enforced at compile time by the type system instead of by convention.

## Pattern matching as routing: `case GET -> Root / "health"`

```scala
HttpRoutes.of[F] { case GET -> Root / "health" => Ok(...) }
```

`->` and `/` here are **extractors** — pattern-matching syntax that decomposes
an incoming `Request` into its method and path segments, similar in spirit to
Rails' `get "/health", to: "health#show"` but expressed as a pattern match
rather than a routing DSL/table. Unmatched requests fall through (handled by
`.orNotFound` turning "no match" into a real 404 response).

## sbt's two-level versioning (why `project/build.properties` matters)

The globally installed `sbt` command is just a tiny **launcher**. The actual
sbt build engine version used for a given project is pinned in
`project/build.properties` (`sbt.version=1.10.1`) and downloaded automatically
the first time you build. This means every project can pin its own sbt (and,
via `build.sbt`'s `scalaVersion`, its own Scala) version independently of
what's globally installed — similar in spirit to a Gemfile.lock, but for the
build tool and compiler themselves, not just libraries.

## TDD cycle we followed for `HealthRoutes`

1. **Red**: wrote `HealthRoutesSuite.scala` referencing `HealthRoutes`, which
   didn't exist — `sbt test` failed to *compile*, which counts as red.
2. **Green**: wrote the minimal `HealthRoutes.routes[F]` to make the test pass.
3. **(Refactor skipped — nothing to clean up yet at this size.)**

We'll repeat this cycle for every new piece of backend logic, per
[`PLAN.md`](./PLAN.md).

---

## `enum` — Scala 3's sum types (no more sealed-trait boilerplate)

```scala
enum ValidationError:
  case EmptyField(field: String)
  case FieldTooLong(field: String, max: Int)
```

In Scala 2 this was `sealed trait ValidationError` plus a separate
`final case class` per variant. Scala 3's `enum` is the same idea (a closed
set of alternatives, exhaustively `match`-able) with far less ceremony —
closest Rails/Ruby comparison is nothing, really; Ruby doesn't have a
built-in closed-set-of-shapes construct like this, you'd normally reach for
a symbol plus a case statement and hope you covered every case. Here the
compiler warns you if a `match` misses one.

## Trait-per-layer dependency injection ("just pass the interface in")

```scala
trait EventRepository[F[_]]:
  def insert(event: Event): F[Unit]
  def all: F[List[Event]]

final class DefaultEventService[F[_]: Sync](repository: EventRepository[F])
    extends EventService[F]
```

No DI framework, no annotations — `DefaultEventService` just takes an
`EventRepository[F]` as a constructor parameter. In tests we pass an
in-memory fake instead of the real Mongo-backed one; in `Main.scala` we pass
the real one. This is the entire pattern: program against the trait, inject
whichever implementation fits the context. (Closest Rails analogue: plain
Ruby dependency injection via constructor args, without ActiveSupport
magic — just less common as a default habit in Rails apps than it is here.)

## `Ref[F, A]` — a thread-safe mutable cell, for when you actually need one

```scala
Ref.of[F, List[Event]](Nil).map(new InMemoryEventRepository(_))
// ...
def insert(event: Event): F[Unit] = state.update(_ :+ event)
```

Scala favors immutable values, but sometimes you genuinely need mutable
state (like our in-memory test fake holding a growing list). A raw `var`
isn't safe if multiple fibers touch it concurrently. `Ref` is cats-effect's
answer: an atomic, thread-safe mutable reference, whose *reads and writes
are themselves effects* (`state.get: F[List[Event]]`,
`state.update(f): F[Unit]`) rather than plain synchronous mutation — so it
composes with everything else built from `IO`.

## `Concurrent[F]` vs `Sync[F]` — not every effect constraint is the same size

We initially wrote `EventRoutes.routes[F[_]: Sync]`, and it failed to
compile: decoding an HTTP request body needs `Concurrent[F]`, not just
`Sync[F]`. Cats Effect has a hierarchy of "how much can this F actually do"
typeclasses — `Sync` (can suspend synchronous side effects),
`Concurrent` (can also run things concurrently, needed here because
consuming an HTTP body is built on fs2's streaming machinery), up through
`Async` and `Temporal`. The rule of thumb: ask for the *smallest* constraint
that compiles — if the compiler says a method needs more, that's real
information about what the method actually does under the hood, not just a
box to check.

## `Resource[F, A]` and `ResourceFunFixture` — guaranteed cleanup, even in tests

```scala
private def collectionResource: Resource[IO, MongoCollection[IO, Event]] =
  for
    client <- MongoClient.fromConnectionString[IO](uri)
    db     <- Resource.eval(client.getDatabase("toolbox_test"))
    coll   <- Resource.eval(db.getCollectionWithCodec[Event]("events"))
  yield coll

private val fixture = ResourceFunFixture(collectionResource)
fixture.test("...") { coll => ... }
```

`Resource[F, A]` pairs "how to acquire an `A`" with "how to release it,
*guaranteed*, even if something fails in between" (closest Rails analogue:
a block form like `File.open(path) { |f| ... }` that always closes the
file — except `Resource` values compose with `flatMap`/`for`, so you can
chain several acquire/release pairs, as above with client → database →
collection, and the whole chain unwinds correctly in reverse order).
`ResourceFunFixture` (from munit-cats-effect) turns a `Resource` into a
per-test fixture, so each test gets a fresh, guaranteed-cleaned-up resource
without hand-writing setup/teardown methods.

## A real gotcha: BSON dates only have millisecond precision

`Instant.now()` on the JVM carries microsecond/nanosecond precision, but
MongoDB's BSON `Date` type only stores milliseconds. Insert an event, read
it back, and a *naive* equality check can fail purely on sub-millisecond
noise Mongo silently dropped — nothing wrong with the code, just a real
precision mismatch between two systems. Fix: `Instant.now().truncatedTo(ChronoUnit.MILLIS)`
before comparing (or before storing, if you want the truncation to be the
source of truth). Worth remembering for *any* database that doesn't store
timestamps at full JVM precision — this class of bug shows up again outside Mongo too.
