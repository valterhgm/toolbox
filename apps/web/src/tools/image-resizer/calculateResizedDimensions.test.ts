import { describe, expect, it } from "vitest";
import { calculateResizedDimensions } from "./calculateResizedDimensions";

describe("calculateResizedDimensions", () => {
  it("scales height to match a target width, keeping aspect ratio", () => {
    const result = calculateResizedDimensions({
      originalWidth: 1600,
      originalHeight: 1200,
      targetWidth: 800,
      maintainAspectRatio: true,
    });
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it("scales width to match a target height, keeping aspect ratio", () => {
    const result = calculateResizedDimensions({
      originalWidth: 1600,
      originalHeight: 1200,
      targetHeight: 300,
      maintainAspectRatio: true,
    });
    expect(result).toEqual({ width: 400, height: 300 });
  });

  it("stretches to both dimensions exactly when aspect ratio is not locked", () => {
    const result = calculateResizedDimensions({
      originalWidth: 1600,
      originalHeight: 1200,
      targetWidth: 800,
      targetHeight: 800,
      maintainAspectRatio: false,
    });
    expect(result).toEqual({ width: 800, height: 800 });
  });

  it("returns the original dimensions when nothing is specified", () => {
    const result = calculateResizedDimensions({
      originalWidth: 1600,
      originalHeight: 1200,
      maintainAspectRatio: true,
    });
    expect(result).toEqual({ width: 1600, height: 1200 });
  });

  it("prioritizes width over height when both are given with aspect ratio locked", () => {
    const result = calculateResizedDimensions({
      originalWidth: 1600,
      originalHeight: 1200,
      targetWidth: 400,
      targetHeight: 999,
      maintainAspectRatio: true,
    });
    expect(result).toEqual({ width: 400, height: 300 });
  });
});
