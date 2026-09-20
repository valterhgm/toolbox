package toolbox.api.events

import cats.effect.IO
import io.circe.Json
import munit.CatsEffectSuite
import toolbox.api.events.testkit.InMemoryEventRepository

import java.time.Instant

class EventServiceSuite extends CatsEffectSuite {

  private def validRequest(tool: String = "image-compressor") =
    EventRequest(tool, "tool_viewed", Json.obj())

  test("record stores a valid event with a generated id and a recent timestamp") {
    for
      repo   <- InMemoryEventRepository.empty[IO]
      service = new DefaultEventService[IO](repo)
      before <- IO(Instant.now())
      result <- service.record(validRequest())
      stored <- repo.all
    yield
      assertEquals(result, Right(()))
      assertEquals(stored.size, 1)
      val event = stored.head
      assertEquals(event.tool, "image-compressor")
      assertEquals(event.event, "tool_viewed")
      assert(
        !event.timestamp.isBefore(before),
        s"expected timestamp ${event.timestamp} to be at or after $before",
      )
  }

  test("record rejects an empty tool without touching the repository") {
    for
      repo    <- InMemoryEventRepository.empty[IO]
      service = new DefaultEventService[IO](repo)
      result  <- service.record(validRequest(tool = ""))
      stored  <- repo.all
    yield
      assertEquals(result, Left(ValidationError.EmptyField("tool")))
      assertEquals(stored, Nil)
  }

  test("record rejects an empty event name") {
    for
      repo    <- InMemoryEventRepository.empty[IO]
      service = new DefaultEventService[IO](repo)
      result  <- service.record(EventRequest("image-compressor", "", Json.obj()))
    yield assertEquals(result, Left(ValidationError.EmptyField("event")))
  }

  test("record rejects a tool name over 64 characters") {
    for
      repo    <- InMemoryEventRepository.empty[IO]
      service = new DefaultEventService[IO](repo)
      result  <- service.record(validRequest(tool = "x" * 65))
    yield assertEquals(result, Left(ValidationError.FieldTooLong("tool", 64)))
  }

  test("stats summarizes whatever is in the repository") {
    for
      repo    <- InMemoryEventRepository.empty[IO]
      service = new DefaultEventService[IO](repo)
      _       <- service.record(validRequest())
      _       <- service.record(validRequest())
      stats   <- service.stats
    yield assertEquals(stats, List(EventCount("image-compressor", "tool_viewed", 2)))
  }
}
