import { test, expect } from "@playwright/test";

test.describe("Lecturer Dashboard Flow", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/lecturer");
    await expect(page).toHaveURL(/.*login/);
  });

  test("sub-pages redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/lecturer/courses");
    await expect(page).toHaveURL(/.*login/);

    await page.goto("/lecturer/students");
    await expect(page).toHaveURL(/.*login/);

    await page.goto("/lecturer/assignments");
    await expect(page).toHaveURL(/.*login/);
  });
});
