import type { ValidationResult } from "./types";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function validateImageFile(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return { valid: false, reason: "unsupported-type" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: "too-large" };
  }
  return { valid: true };
}
