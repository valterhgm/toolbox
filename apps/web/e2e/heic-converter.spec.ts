import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("HEIC Converter", () => {
  test("converts a HEIC photo to a downloadable JPG", async ({ page }) => {
    await page.goto("/tools/heic-converter");

    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(FIXTURES, "sample.heic"));

    const downloadLink = page.getByRole("link", { name: /Download JPG/ });
    await expect(downloadLink).toBeVisible({ timeout: 30_000 });

    const href = await downloadLink.getAttribute("href");
    const type = await page.evaluate(async (url) => {
      const res = await fetch(url as string);
      return (await res.blob()).type;
    }, href);

    expect(type).toBe("image/jpeg");
  });

  test("has no horizontal overflow on a phone-width viewport", async ({ page }) => {
    await page.goto("/tools/heic-converter");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
