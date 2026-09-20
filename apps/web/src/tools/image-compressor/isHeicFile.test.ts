import { describe, expect, it } from "vitest";
import { isHeicFile } from "./isHeicFile";

function fakeFile(name: string, type: string): File {
  return new File([new Uint8Array(10)], name, { type });
}

describe("isHeicFile", () => {
  it("recognizes a correctly-typed HEIC file", () => {
    expect(isHeicFile(fakeFile("photo.heic", "image/heic"))).toBe(true);
  });

  it("recognizes a correctly-typed HEIF file", () => {
    expect(isHeicFile(fakeFile("photo.heif", "image/heif"))).toBe(true);
  });

  it("falls back to the file extension when the browser reports no type", () => {
    // Common in practice: many browsers/OSes report an empty MIME type for HEIC.
    expect(isHeicFile(fakeFile("IMG_1234.HEIC", ""))).toBe(true);
  });

  it("does not misidentify a regular JPEG", () => {
    expect(isHeicFile(fakeFile("photo.jpg", "image/jpeg"))).toBe(false);
  });

  it("does not misidentify a PNG with no type", () => {
    expect(isHeicFile(fakeFile("photo.png", ""))).toBe(false);
  });
});
