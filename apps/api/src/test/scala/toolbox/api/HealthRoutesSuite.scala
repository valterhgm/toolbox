package toolbox.api

import cats.effect.IO
import munit.CatsEffectSuite
import org.http4s._
import org.http4s.implicits._
import org.http4s.circe.CirceEntityCodec._
import io.circe.Json

class HealthRoutesSuite extends CatsEffectSuite {

  private val app = HealthRoutes.routes[IO].orNotFound

  test("GET /health returns 200 with a JSON status of ok") {
    val request = Request[IO](Method.GET, uri"/health")

    for {
      response <- app.run(request)
      body     <- response.as[Json]
    } yield {
      assertEquals(response.status, Status.Ok)
      assertEquals(body, Json.obj("status" -> Json.fromString("ok")))
    }
  }
}
