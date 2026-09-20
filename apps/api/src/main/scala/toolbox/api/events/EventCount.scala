package toolbox.api.events

import io.circe.Encoder
import io.circe.generic.semiauto.deriveEncoder

final case class EventCount(tool: String, event: String, count: Long)

object EventCount:
  given Encoder[EventCount] = deriveEncoder
