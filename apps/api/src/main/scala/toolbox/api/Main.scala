package toolbox.api

import cats.effect.{IO, IOApp}
import com.comcast.ip4s._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.Router
import org.http4s.server.middleware.CORS

object Main extends IOApp.Simple {

  private val httpApp = Router(
    "/api/v1" -> HealthRoutes.routes[IO]
  ).orNotFound

  val run: IO[Unit] =
    EmberServerBuilder
      .default[IO]
      .withHost(host"0.0.0.0")
      .withPort(port"8080")
      .withHttpApp(CORS.policy.withAllowOriginAll(httpApp))
      .build
      .useForever
}
