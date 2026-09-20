import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Duplicate Finder", () => {
  test("shows a folder-scan option only where the browser actually supports it", async ({
    page,
  }) => {
    await page.goto("/tools/duplicate-finder");

    const supportsFolderScan = await page.evaluate(
      () => typeof (window as unknown as Record<string, unknown>).showDirectoryPicker === "function",
    );
    const folderButton = page.getByRole("button", { name: /Choose a Folder to Scan/ });

    if (supportsFolderScan) {
      await expect(folderButton).toBeVisible();
    } else {
      await expect(folderButton).toHaveCount(0);
    }
  });

  test("groups the same photo (JPEG + HEIC) as duplicates, shows savings, excludes an unrelated photo", async ({
    page,
  }) => {
    await page.goto("/tools/duplicate-finder");

    await page.locator('input[type="file"]').setInputFiles([
      path.join(FIXTURES, "sample.jpg"),
      path.join(FIXTURES, "sample.heic"), // same source photo as sample.jpg
      path.join(FIXTURES, "different.jpg"), // an unrelated photo
    ]);

    await expect(page.getByText(/Found \d+ group/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/You could save/)).toBeVisible();

    // Exactly one group, containing both the JPEG and HEIC versions of the
    // same photo - the unrelated photo should not be pulled in.
    await expect(page.getByText("2 similar photos", { exact: false })).toBeVisible();
    await expect(page.getByText("Keep")).toBeVisible();
    await expect(page.getByText("Extra copy")).toBeVisible();
    await expect(page.locator("img")).toHaveCount(2);
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

    // "Scan again" resets back to the selection screen. The file input
    // itself is deliberately hidden (the label around it is the visible,
    // clickable/droppable surface), so check the intro copy is back instead.
    await page.getByRole("button", { name: "Scan again" }).click();
    await expect(page.getByText(/check the photos you choose for duplicates/)).toBeVisible();
  });

  test("requires at least 2 photos", async ({ page }) => {
    await page.goto("/tools/duplicate-finder");

    await page
      .locator('input[type="file"]')
      .setInputFiles([path.join(FIXTURES, "sample.jpg")]);

    await expect(page.getByText(/at least 2 photos/)).toBeVisible();
  });
});
