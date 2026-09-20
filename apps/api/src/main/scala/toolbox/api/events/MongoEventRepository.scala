package toolbox.api.events

import cats.effect.Sync
import cats.syntax.all._
import mongo4cats.collection.MongoCollection

final class MongoEventRepository[F[_]: Sync](collection: MongoCollection[F, Event])
    extends EventRepository[F]:

  def insert(event: Event): F[Unit] =
    collection.insertOne(event).void

  def all: F[List[Event]] =
    collection.find.all.map(_.toList)
