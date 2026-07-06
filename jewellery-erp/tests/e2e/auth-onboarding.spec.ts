import { test, expect } from "@playwright/test";

test.describe("Authentication and Onboarding E2E Flow", () => {
  const randomEmail = `test-user-${Date.now()}@example.com`;

  test("should allow a new user to sign up, onboard their business, and view dashboard", async ({ page }) => {
    // 1. Go to signup page
    await page.goto("/sign-up");
    await expect(page.locator("h3:has-text('Create Account')")).toBeVisible();

    // 2. Fill out signup form
    await page.fill("#name", "E2E Test Owner");
    await page.fill("#email", randomEmail);
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");

    // 3. Should redirect to select-tenant/onboarding
    await page.waitForURL("**/select-tenant");
    await expect(page.locator("h3:has-text('Welcome to Jewellery ERP')")).toBeVisible();

    // 4. Onboard a new business
    await page.fill("#ownerName", "E2E Test Owner");
    await page.fill("#businessName", "E2E Test Jewellery Store");
    await page.click("button[type='submit']");

    // 5. Should land on dashboard
    await page.waitForURL("**/dashboard");
    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();
    await expect(page.locator("span:has-text('E2E Test Jewellery Store')")).toBeVisible();
  });
});
