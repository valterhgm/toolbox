package toolbox.api.events

object EventStats:

  def summarize(events: List[Event]): List[EventCount] =
    events
      .groupBy(e => (e.tool, e.event))
      .map { case ((tool, event), grouped) =>
        EventCount(tool, event, grouped.size.toLong)
      }
      .toList
