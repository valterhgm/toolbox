import { describe, expect, it } from "vitest";
import { validateImageFile } from "./validateImageFile";

function fakeFile(type: string, sizeInBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeInBytes)], { type });
  return new File([blob], "photo", { type });
}

describe("validateImageFile", () => {
  it("accepts a normal JPEG under the size limit", () => {
    const file = fakeFile("image/jpeg", 1_000_000);
    expect(validateImageFile(file)).toEqual({ valid: true });
  });

  it("accepts PNG and WebP too", () => {
    expect(validateImageFile(fakeFile("image/png", 1_000)).valid).toBe(true);
    expect(validateImageFile(fakeFile("image/webp", 1_000)).valid).toBe(true);
  });

  it("rejects non-image files", () => {
    const file = fakeFile("application/pdf", 1_000);
    expect(validateImageFile(file)).toEqual({
      valid: false,
      reason: "unsupported-type",
    });
  });

  it("rejects files over 25 MB", () => {
    const file = fakeFile("image/jpeg", 26 * 1024 * 1024);
    expect(validateImageFile(file)).toEqual({
      valid: false,
      reason: "too-large",
    });
  });
});
