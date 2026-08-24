import { test, expect } from "@playwright/test";

test.describe("Dashboard Access", () => {
  test("redirects unauthenticated users from student dashboard to login", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/.*login/);
  });

  test("redirects unauthenticated users from admin dashboard to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/.*login/);
  });

  test("redirects unauthenticated users from lecturer dashboard to login", async ({ page }) => {
    await page.goto("/lecturer");
    await expect(page).toHaveURL(/.*login/);
  });
});
