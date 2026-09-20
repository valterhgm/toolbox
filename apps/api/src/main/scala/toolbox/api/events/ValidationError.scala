package toolbox.api.events

enum ValidationError:
  case EmptyField(field: String)
  case FieldTooLong(field: String, max: Int)

  def message: String = this match
    case EmptyField(field)        => s"$field must not be empty"
    case FieldTooLong(field, max) => s"$field must be at most $max characters"
