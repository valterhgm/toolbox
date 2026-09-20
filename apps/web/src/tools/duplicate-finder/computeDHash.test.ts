import { describe, expect, it } from "vitest";
import { computeDHash, HASH_WIDTH, HASH_HEIGHT } from "./computeDHash";

// dHash compares each pixel to its right neighbor across a fixed 9x8
// grayscale grid (9 columns so there are 8 horizontal comparisons per row,
// 8 rows -> 64 bits total). Building the pixel grid ourselves means we
// know exactly what hash to expect, without ever decoding a real image.
function grid(rowFn: (row: number) => number[]): number[] {
  const pixels: number[] = [];
  for (let row = 0; row < HASH_HEIGHT; row++) pixels.push(...rowFn(row));
  return pixels;
}

describe("computeDHash", () => {
  it("produces all-zero bits when every row strictly increases left to right", () => {
    const pixels = grid(() => [0, 10, 20, 30, 40, 50, 60, 70, 80]);
    expect(computeDHash(pixels, HASH_WIDTH, HASH_HEIGHT)).toBe(0n);
  });

  it("produces all-one bits when every row strictly decreases left to right", () => {
    const pixels = grid(() => [80, 70, 60, 50, 40, 30, 20, 10, 0]);
    // 64 bits, all 1 = 2^64 - 1
    expect(computeDHash(pixels, HASH_WIDTH, HASH_HEIGHT)).toBe(2n ** 64n - 1n);
  });

  it("is deterministic for the same input", () => {
    const pixels = grid((row) => [row, 5, 3, 9, 1, 8, 2, 7, 4]);
    const first = computeDHash(pixels, HASH_WIDTH, HASH_HEIGHT);
    const second = computeDHash(pixels, HASH_WIDTH, HASH_HEIGHT);
    expect(first).toBe(second);
  });

  it("produces different hashes for visibly different images", () => {
    const increasing = grid(() => [0, 10, 20, 30, 40, 50, 60, 70, 80]);
    const decreasing = grid(() => [80, 70, 60, 50, 40, 30, 20, 10, 0]);
    expect(computeDHash(increasing, HASH_WIDTH, HASH_HEIGHT)).not.toBe(
      computeDHash(decreasing, HASH_WIDTH, HASH_HEIGHT),
    );
  });
});
