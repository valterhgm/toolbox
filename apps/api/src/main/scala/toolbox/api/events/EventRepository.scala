package toolbox.api.events

trait EventRepository[F[_]]:
  def insert(event: Event): F[Unit]
  def all: F[List[Event]]
