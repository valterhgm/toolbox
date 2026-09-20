package toolbox.api.events

trait EventService[F[_]]:
  def record(request: EventRequest): F[Either[ValidationError, Unit]]
  def stats: F[List[EventCount]]
