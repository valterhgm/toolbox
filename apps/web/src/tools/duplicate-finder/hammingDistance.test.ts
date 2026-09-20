import { describe, expect, it } from "vitest";
import { hammingDistance } from "./hammingDistance";

describe("hammingDistance", () => {
  it("is zero for identical hashes", () => {
    expect(hammingDistance(0n, 0n)).toBe(0);
    expect(hammingDistance(0b1011n, 0b1011n)).toBe(0);
  });

  it("counts the number of differing bits", () => {
    expect(hammingDistance(0b1111n, 0b0000n)).toBe(4);
    expect(hammingDistance(0b1010n, 0b0101n)).toBe(4);
    expect(hammingDistance(0b1000n, 0b0000n)).toBe(1);
  });

  it("is 64 for two fully-inverted 64-bit hashes", () => {
    const allZero = 0n;
    const allOne = 2n ** 64n - 1n;
    expect(hammingDistance(allZero, allOne)).toBe(64);
  });

  it("is symmetric", () => {
    const a = 0b110101n;
    const b = 0b010011n;
    expect(hammingDistance(a, b)).toBe(hammingDistance(b, a));
  });
});
