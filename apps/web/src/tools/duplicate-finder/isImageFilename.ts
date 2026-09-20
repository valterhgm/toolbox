const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i;

/** Used when scanning a real folder (via the File System Access API),
 * where every kind of file shows up, not just ones a user hand-picked
 * from a photo library. */
export function isImageFilename(name: string): boolean {
  return IMAGE_EXTENSIONS.test(name);
}
