import { describe, expect, it } from "vitest";
import { isImageFilename } from "./isImageFilename";

describe("isImageFilename", () => {
  it("accepts common image extensions, case-insensitively", () => {
    expect(isImageFilename("photo.jpg")).toBe(true);
    expect(isImageFilename("photo.JPEG")).toBe(true);
    expect(isImageFilename("photo.png")).toBe(true);
    expect(isImageFilename("photo.WebP")).toBe(true);
    expect(isImageFilename("IMG_1234.HEIC")).toBe(true);
  });

  it("rejects non-image files, as found when scanning a real folder", () => {
    expect(isImageFilename("resume.pdf")).toBe(false);
    expect(isImageFilename(".DS_Store")).toBe(false);
    expect(isImageFilename("notes.txt")).toBe(false);
    expect(isImageFilename("archive.zip")).toBe(false);
  });
});
