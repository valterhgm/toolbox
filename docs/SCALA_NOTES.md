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
