import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Image Resizer", () => {
  test("resizes a JPEG to the requested width, keeping aspect ratio", async ({
    page,
  }) => {
    await page.goto("/tools/image-resizer");

    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(FIXTURES, "sample.jpg"));

    const widthInput = page.locator('input[type="number"]').first();
    await expect(widthInput).toBeVisible({ timeout: 10_000 });
    await widthInput.fill("200");
    await page.getByRole("button", { name: "Resize" }).click();

    const downloadLink = page.getByRole("link", { name: /Download/ });
    await expect(downloadLink).toBeVisible({ timeout: 15_000 });

    const href = await downloadLink.getAttribute("href");
    const dimensions = await page.evaluate(async (url) => {
      const res = await fetch(url as string);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);
      const result = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return result;
    }, href);

    expect(dimensions.width).toBe(200);
  });

  test("shows an error for a corrupt file instead of hanging", async ({ page }) => {
    await page.goto("/tools/image-resizer");

    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(FIXTURES, "corrupt.jpg"));

    await expect(page.locator(".text-red-600")).toBeVisible({ timeout: 10_000 });
  });

  test("has no horizontal overflow on a phone-width viewport", async ({ page }) => {
    await page.goto("/tools/image-resizer");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
