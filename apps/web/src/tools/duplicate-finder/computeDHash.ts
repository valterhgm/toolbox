/**
 * Difference hash (dHash): a simple, well-known perceptual image hash.
 * Shrink the image to a tiny fixed grid, compare each pixel to its right
 * neighbor, and record a 1 or 0 bit per comparison. Two images that look
 * alike produce hashes that differ in only a few bits, even if they were
 * saved at different sizes/qualities - unlike a cryptographic hash (MD5,
 * SHA), which changes completely for a single different byte and is
 * useless for "are these the same *photo*" (as opposed to "the same exact
 * file").
 */
export const HASH_WIDTH = 9; // one extra column so there are 8 comparisons per row
export const HASH_HEIGHT = 8; // 8 rows x 8 comparisons = 64 bits

export function computeDHash(
  grayscalePixels: number[],
  width: number,
  height: number,
): bigint {
  let hash = 0n;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width - 1; col++) {
      const left = grayscalePixels[row * width + col];
      const right = grayscalePixels[row * width + col + 1];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}
