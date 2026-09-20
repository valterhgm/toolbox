import { describe, expect, it } from "vitest";
import { formatBytes } from "./formatBytes";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats plain bytes below 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes with one decimal place", () => {
    expect(formatBytes(2_048)).toBe("2.0 KB");
  });

  it("formats megabytes with one decimal place", () => {
    expect(formatBytes(8_650_000)).toBe("8.2 MB");
  });
});
