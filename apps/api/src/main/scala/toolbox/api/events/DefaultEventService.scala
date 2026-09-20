package toolbox.api.events

import cats.effect.Sync
import cats.syntax.all._
import mongo4cats.bson.ObjectId

import java.time.Instant

final class DefaultEventService[F[_]: Sync](repository: EventRepository[F])
    extends EventService[F]:

  private val MaxFieldLength = 64

  private def validate(request: EventRequest): Either[ValidationError, EventRequest] =
    def checkNonEmpty(field: String, value: String) =
      Either.cond(value.nonEmpty, (), ValidationError.EmptyField(field))

    def checkLength(field: String, value: String) =
      Either.cond(
        value.length <= MaxFieldLength,
        (),
        ValidationError.FieldTooLong(field, MaxFieldLength),
      )

    for
      _ <- checkNonEmpty("tool", request.tool)
      _ <- checkNonEmpty("event", request.event)
      _ <- checkLength("tool", request.tool)
      _ <- checkLength("event", request.event)
    yield request

  def record(request: EventRequest): F[Either[ValidationError, Unit]] =
    validate(request) match
      case Left(error) => Sync[F].pure(Left(error))
      case Right(valid) =>
        for
          id        <- Sync[F].delay(ObjectId.gen)
          timestamp <- Sync[F].delay(Instant.now())
          event = Event(id, valid.tool, valid.event, timestamp, valid.metadata)
          _ <- repository.insert(event)
        yield Right(())

  def stats: F[List[EventCount]] =
    repository.all.map(EventStats.summarize)
