import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Image Compressor", () => {
  test("compresses a JPEG and offers a genuinely smaller download", async ({
    page,
  }) => {
    await page.goto("/tools/image-compressor");

    const originalPath = path.join(FIXTURES, "sample.jpg");
    const originalSize = fs.statSync(originalPath).size;

    await page.locator('input[type="file"]').setInputFiles(originalPath);

    const downloadLink = page.getByRole("link", { name: "Download" });
    await expect(downloadLink).toBeVisible({ timeout: 15_000 });

    const href = await downloadLink.getAttribute("href");
    expect(href).toMatch(/^blob:/);

    // Fetch the blob: URL in-page to measure the real compressed byte size,
    // rather than trusting the formatted "X.X MB" text on screen.
    const compressedSize = await page.evaluate(async (url) => {
      const res = await fetch(url as string);
      const blob = await res.blob();
      return blob.size;
    }, href);

    expect(compressedSize).toBeGreaterThan(0);
    expect(compressedSize).toBeLessThan(originalSize);
  });

  test("converts a HEIC photo before compressing it", async ({ page }) => {
    await page.goto("/tools/image-compressor");

    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(FIXTURES, "sample.heic"));

    // Cold WASM load + decode can take a few seconds.
    const downloadLink = page.getByRole("link", { name: "Download" });
    await expect(downloadLink).toBeVisible({ timeout: 30_000 });

    const href = await downloadLink.getAttribute("href");
    expect(href).toMatch(/^blob:/);
  });

  test("shows an error for a corrupt file instead of hanging", async ({
    page,
  }) => {
    await page.goto("/tools/image-compressor");

    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(FIXTURES, "corrupt.jpg"));

    await expect(page.locator(".text-red-600")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name: "Download" })).toHaveCount(0);
  });

  test("has no horizontal overflow on a phone-width viewport", async ({
    page,
  }) => {
    await page.goto("/tools/image-compressor");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
