package toolbox.api.events

import io.circe.Json
import mongo4cats.bson.ObjectId
import munit.FunSuite

import java.time.Instant

class EventStatsSuite extends FunSuite {

  private def event(tool: String, eventName: String): Event =
    Event(ObjectId.gen, tool, eventName, Instant.now(), Json.obj())

  test("summarize returns an empty list for no events") {
    assertEquals(EventStats.summarize(Nil), Nil)
  }

  test("summarize counts events grouped by tool and event name") {
    val events = List(
      event("image-compressor", "tool_viewed"),
      event("image-compressor", "tool_viewed"),
      event("image-compressor", "compression_completed"),
      event("image-resizer", "tool_viewed")
    )

    val result = EventStats.summarize(events).toSet

    assertEquals(
      result,
      Set(
        EventCount("image-compressor", "tool_viewed", 2),
        EventCount("image-compressor", "compression_completed", 1),
        EventCount("image-resizer", "tool_viewed", 1)
      )
    )
  }
}
