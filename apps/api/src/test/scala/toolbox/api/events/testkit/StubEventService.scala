package toolbox.api.events.testkit

import cats.effect.IO
import toolbox.api.events.{EventCount, EventRequest, EventService, ValidationError}

/** Test double for the routes layer: returns whatever canned response it
  * was built with, so route tests only exercise HTTP concerns (status
  * codes, JSON shape) and never touch real validation or storage logic.
  */
final class StubEventService(
    recordResponse: Either[ValidationError, Unit],
    statsResponse: List[EventCount] = Nil,
) extends EventService[IO]:

  def record(request: EventRequest): IO[Either[ValidationError, Unit]] =
    IO.pure(recordResponse)

  def stats: IO[List[EventCount]] =
    IO.pure(statsResponse)
