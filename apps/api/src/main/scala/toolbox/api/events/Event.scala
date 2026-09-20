package toolbox.api.events

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder, Json}
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider

import java.time.Instant

final case class Event(
    _id: ObjectId,
    tool: String,
    event: String,
    timestamp: Instant,
    metadata: Json
)

object Event:
  given Encoder[Event] = deriveEncoder
  given Decoder[Event] = deriveDecoder
  given MongoCodecProvider[Event] = deriveCirceCodecProvider
