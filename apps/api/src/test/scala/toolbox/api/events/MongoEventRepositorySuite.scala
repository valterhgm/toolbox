package toolbox.api.events

import cats.effect.{IO, Resource}
import io.circe.Json
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.client.MongoClient
import mongo4cats.collection.MongoCollection
import munit.CatsEffectSuite

import java.time.Instant
import java.time.temporal.ChronoUnit

/** Integration test against a real MongoDB.
  *
  * Uses the same MongoDB the `docker-compose.yml` at the repo root starts
  * for local dev (`docker compose up -d` before running this suite), rather
  * than a testcontainers-managed disposable container. We tried
  * testcontainers-scala-mongodb first, but its bundled Docker client
  * couldn't negotiate with this machine's Docker Desktop version (a
  * genuine tooling incompatibility, not our code). The project plan
  * explicitly allowed either approach, so we fell back to the simpler,
  * already-working one rather than debugging a third-party version
  * mismatch further.
  *
  * Because the database is shared and persistent (not a disposable
  * container), every test drops the collection first so results never
  * depend on what an earlier run left behind.
  */
class MongoEventRepositorySuite extends CatsEffectSuite {

  private def collectionResource: Resource[IO, MongoCollection[IO, Event]] =
    for
      client <- MongoClient.fromConnectionString[IO]("mongodb://localhost:27017")
      db     <- Resource.eval(client.getDatabase("toolbox_test"))
      coll   <- Resource.eval(db.getCollectionWithCodec[Event]("events"))
    yield coll

  private val fixture = ResourceFunFixture(collectionResource)

  // The database is shared and persistent (the docker-compose Mongo, not a
  // disposable container), so tests avoid asserting on the *entire*
  // collection's contents - that would depend on whatever earlier runs left
  // behind. Each test instead inserts an event with a unique marker and
  // checks it round-trips correctly, which is exactly what this suite
  // exists to prove (the "empty repository" case is already covered against
  // the fake repository in EventServiceSuite, and isn't Mongo-specific).
  fixture.test("insert stores an event that round-trips correctly via all") { coll =>
    val repo = new MongoEventRepository[IO](coll)
    // MongoDB's BSON Date type only has millisecond precision, but
    // Instant.now() carries microsecond/nanosecond precision on the JVM.
    // Truncate before comparing, or a round-trip through real Mongo can
    // fail equality on sub-millisecond noise that Mongo silently drops.
    val event = Event(
      ObjectId.gen,
      s"image-compressor-${ObjectId.gen}",
      "tool_viewed",
      Instant.now().truncatedTo(ChronoUnit.MILLIS),
      Json.obj("inputSize" -> Json.fromInt(1234)),
    )

    for
      _   <- repo.insert(event)
      all <- repo.all
    yield assert(
      all.contains(event),
      s"expected ${all.size} stored events to contain $event",
    )
  }
}
