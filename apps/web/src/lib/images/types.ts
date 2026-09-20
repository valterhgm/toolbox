export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: "unsupported-type" | "too-large" };
