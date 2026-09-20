package toolbox.api.events

import cats.effect.Concurrent
import cats.syntax.all._
import io.circe.Json
import io.circe.syntax._
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.Http4sDsl

object EventRoutes:

  def routes[F[_]: Concurrent](service: EventService[F]): HttpRoutes[F] =
    val dsl = new Http4sDsl[F] {}
    import dsl._

    HttpRoutes.of[F] {
      case req @ POST -> Root / "events" =>
        // Handled explicitly (rather than relying on http4s's default 422 for
        // a decode failure) so every problem with a request - unparseable
        // JSON or a failed validation rule - comes back as a plain 400.
        req.attemptAs[EventRequest].value.flatMap {
          case Left(_) =>
            BadRequest(Json.obj("error" -> Json.fromString("invalid request body")))
          case Right(eventRequest) =>
            service.record(eventRequest).flatMap {
              case Right(_) =>
                Created(Json.obj("status" -> Json.fromString("recorded")))
              case Left(error) =>
                BadRequest(Json.obj("error" -> Json.fromString(error.message)))
            }
        }

      case GET -> Root / "admin" / "stats" =>
        service.stats.flatMap(stats => Ok(stats.asJson))
    }
