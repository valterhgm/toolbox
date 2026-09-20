package toolbox.api

import cats.effect.{IO, IOApp}
import cats.syntax.all._
import com.comcast.ip4s._
import mongo4cats.circe._
import mongo4cats.client.MongoClient
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.Router
import org.http4s.server.middleware.{CORS, Throttle}
import toolbox.api.events.{DefaultEventService, Event, EventRoutes, MongoEventRepository}

import scala.concurrent.duration._

object Main extends IOApp.Simple:

  private val mongoUri =
    sys.env.getOrElse("MONGO_URI", "mongodb://localhost:27017")

  private val serverPort =
    sys.env.get("PORT").flatMap(_.toIntOption).flatMap(Port.fromInt).getOrElse(port"8080")

  val run: IO[Unit] =
    MongoClient.fromConnectionString[IO](mongoUri).use { client =>
      for
        db         <- client.getDatabase("toolbox")
        collection <- db.getCollectionWithCodec[Event]("events")
        repository = new MongoEventRepository[IO](collection)
        service    = new DefaultEventService[IO](repository)
        // 30 requests/minute is generous for real usage but blocks a client
        // hammering the endpoint - see docs/adr/0004-analytics-events.md.
        eventRoutes <- Throttle.httpRoutes[IO](amount = 30, per = 1.minute)(
          EventRoutes.routes[IO](service)
        )
        httpApp = Router(
          "/api/v1" -> (HealthRoutes.routes[IO] <+> eventRoutes)
        ).orNotFound
        _ <- EmberServerBuilder
          .default[IO]
          .withHost(host"0.0.0.0")
          .withPort(serverPort)
          .withHttpApp(CORS.policy.withAllowOriginAll(httpApp))
          .build
          .useForever
      yield ()
    }
