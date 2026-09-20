package toolbox.api.events.testkit

import cats.effect.{Ref, Sync}
import cats.syntax.all._
import toolbox.api.events.{Event, EventRepository}

/** Test double: holds events in a `Ref` (an atomic, thread-safe mutable
  * cell) instead of a real database. Used to test `EventService` without
  * needing Mongo running.
  */
final class InMemoryEventRepository[F[_]: Sync](state: Ref[F, List[Event]])
    extends EventRepository[F]:

  def insert(event: Event): F[Unit] =
    state.update(_ :+ event)

  def all: F[List[Event]] =
    state.get

object InMemoryEventRepository:
  def empty[F[_]: Sync]: F[InMemoryEventRepository[F]] =
    Ref.of[F, List[Event]](Nil).map(new InMemoryEventRepository(_))
