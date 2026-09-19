package toolbox.api

import cats.effect.Sync
import cats.syntax.all._
import io.circe.Json
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.Http4sDsl

object HealthRoutes {

  def routes[F[_]: Sync]: HttpRoutes[F] = {
    val dsl = new Http4sDsl[F] {}
    import dsl._

    HttpRoutes.of[F] { case GET -> Root / "health" =>
      Ok(Json.obj("status" -> Json.fromString("ok")))
    }
  }
}
