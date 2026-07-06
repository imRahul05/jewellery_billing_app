import { test, expect } from "@playwright/test";

test.describe("Inventory Adjustments and Stock Lifecycles E2E", () => {
  const randomEmail = `inventory-owner-${Date.now()}@example.com`;

  test("should handle item tag generation, stock adjustment and location transfer", async ({ page }) => {
    // 1. Sign Up & Onboard
    await page.goto("/sign-up");
    await page.fill("#name", "Inventory Master");
    await page.fill("#email", randomEmail);
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");

    await page.waitForURL("**/select-tenant");
    await page.fill("#ownerName", "Inventory Master");
    await page.fill("#businessName", "Vikas Jewellery Hub");
    await page.click("button[type='submit']");

    await page.waitForURL("**/dashboard");

    // 2. Add Category & Product SKU
    await page.goto("/inventory");
    await page.click("button:has-text('Add Category')");
    await page.fill("input#name", "Silver Rings");
    await page.selectOption("select#metalType", "silver");
    await page.click("button:has-text('Create Category')");

    await page.click("button:has-text('Add Product')");
    await page.fill("input#sku", "SR-925-001");
    await page.fill("input#name", "92.5 Sterling Silver Ring");
    await page.selectOption("select#metalType", "silver");
    await page.fill("input#defaultPurity", "0.925");
    await page.fill("input#defaultKarat", "925");
    await page.click("button:has-text('Register SKU')");

    // 3. Create Item
    await page.click("button:has-text('Add Item')");
    await page.selectOption("select#productId", { label: "92.5 Sterling Silver Ring (SR-925-001)" });
    await page.fill("input#tagNumber", "TAG-SR-001");
    await page.fill("input#grossWeight", "5.200");
    await page.fill("input#netWeight", "5.000");
    await page.fill("input#stoneWeight", "0.200");
    await page.fill("input#purityFineness", "0.925");
    await page.fill("input#costPrice", "350");
    await page.click("button:has-text('Add Stock Item')");

    // 4. Click on the newly created item link (in the inventory list)
    await page.click("a:has-text('TAG-SR-001')");

    // Should land on item detail page
    await page.waitForURL("**/inventory/items/*");
    await expect(page.locator("h1:has-text('Stock Item Details')")).toBeVisible();
    await expect(page.locator("div:has-text('TAG-SR-001')")).toBeVisible();

    // 5. Apply Stock Adjustment Out
    await page.click("button:has-text('Adjust Stock')");
    await page.selectOption("select#type", "adjustment_out");
    await page.fill("input#weight", "1.000");
    await page.fill("input#quantity", "0");
    await page.fill("input#reason", "Damaged edge refitting");
    await page.click("button:has-text('Apply Adjustment')");

    // Verify movement history log is updated
    await expect(page.locator("table")).toContainText("adjustment_out");
    await expect(page.locator("table")).toContainText("1.000");
  });
});
