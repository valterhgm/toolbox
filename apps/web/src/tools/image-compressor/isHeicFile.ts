const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

export function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.has(file.type)) return true;
  return file.type === "" && HEIC_EXTENSIONS.test(file.name);
}
