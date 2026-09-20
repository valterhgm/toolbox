package toolbox.api.events

import io.circe.{Decoder, Json}
import io.circe.generic.semiauto.deriveDecoder

/** What the frontend actually sends us. Deliberately has no `_id` or
  * `timestamp` field — those are never trusted from the client; the service
  * layer generates them itself.
  */
final case class EventRequest(tool: String, event: String, metadata: Json)

object EventRequest:
  given Decoder[EventRequest] = deriveDecoder
