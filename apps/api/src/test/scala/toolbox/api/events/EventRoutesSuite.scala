package toolbox.api.events

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import munit.CatsEffectSuite
import org.http4s._
import org.http4s.circe.CirceEntityCodec._
import org.http4s.implicits._
import toolbox.api.events.testkit.StubEventService

class EventRoutesSuite extends CatsEffectSuite {

  private def postEvents(service: StubEventService, body: Json) =
    EventRoutes
      .routes[IO](service)
      .orNotFound
      .run(
        Request[IO](Method.POST, uri"/events").withEntity(body)
      )

  test("POST /events with a valid body returns 201") {
    val service = new StubEventService(recordResponse = Right(()))
    val body = Json.obj(
      "tool"     -> Json.fromString("image-compressor"),
      "event"    -> Json.fromString("tool_viewed"),
      "metadata" -> Json.obj(),
    )

    postEvents(service, body).map { response =>
      assertEquals(response.status, Status.Created)
    }
  }

  test("POST /events surfaces a validation error as 400") {
    val service = new StubEventService(
      recordResponse = Left(ValidationError.EmptyField("tool"))
    )
    val body = Json.obj(
      "tool"     -> Json.fromString(""),
      "event"    -> Json.fromString("tool_viewed"),
      "metadata" -> Json.obj(),
    )

    for
      response <- postEvents(service, body)
      json     <- response.as[Json]
    yield
      assertEquals(response.status, Status.BadRequest)
      assertEquals(json.hcursor.get[String]("error"), Right("tool must not be empty"))
  }

  test("POST /events with an unparseable body returns 400, not 500") {
    val service = new StubEventService(recordResponse = Right(()))

    postEvents(service, Json.fromString("not an event")).map { response =>
      assertEquals(response.status, Status.BadRequest)
    }
  }

  test("GET /admin/stats returns the service's stats as JSON") {
    val service = new StubEventService(
      recordResponse = Right(()),
      statsResponse = List(EventCount("image-compressor", "tool_viewed", 3)),
    )

    for
      response <- EventRoutes
        .routes[IO](service)
        .orNotFound
        .run(Request[IO](Method.GET, uri"/admin/stats"))
      json <- response.as[Json]
    yield
      assertEquals(response.status, Status.Ok)
      assertEquals(
        json,
        List(EventCount("image-compressor", "tool_viewed", 3)).asJson,
      )
  }
}
