import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Duplicate Finder", () => {
  test("groups the same photo (JPEG + HEIC) as duplicates, excluding an unrelated photo", async ({
    page,
  }) => {
    await page.goto("/tools/duplicate-finder");

    await page.locator('input[type="file"]').setInputFiles([
      path.join(FIXTURES, "sample.jpg"),
      path.join(FIXTURES, "sample.heic"), // same source photo as sample.jpg
      path.join(FIXTURES, "different.jpg"), // an unrelated photo
    ]);

    await expect(page.getByText(/Found \d+ group/)).toBeVisible({ timeout: 30_000 });

    // Exactly one group, containing both the JPEG and HEIC versions of the
    // same photo - the unrelated photo should not be pulled in.
    await expect(page.getByText("2 similar photos")).toBeVisible();
    const images = page.locator("img");
    await expect(images).toHaveCount(2);
  });

  test("reports no duplicates when every photo is different", async ({ page }) => {
    await page.goto("/tools/duplicate-finder");

    await page.locator('input[type="file"]').setInputFiles([
      path.join(FIXTURES, "sample.jpg"),
      path.join(FIXTURES, "different.jpg"),
    ]);

    await expect(page.getByText(/No duplicates found/)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("requires at least 2 photos", async ({ page }) => {
    await page.goto("/tools/duplicate-finder");

    await page
      .locator('input[type="file"]')
      .setInputFiles([path.join(FIXTURES, "sample.jpg")]);

    await expect(page.getByText(/at least 2 photos/)).toBeVisible();
  });
});
