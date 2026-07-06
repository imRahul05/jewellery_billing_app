import { test, expect } from "@playwright/test";

test.describe("Full Invoicing Billing Journey E2E", () => {
  const randomEmail = `billing-owner-${Date.now()}@example.com`;

  test("should handle client signup, catalog setup, inventory tagging, and billing issuance", async ({ page }) => {
    // 1. Sign Up & Onboard
    await page.goto("/sign-up");
    await page.fill("#name", "Billing Master Owner");
    await page.fill("#email", randomEmail);
    await page.fill("#password", "Password123!");
    await page.click("button[type='submit']");

    await page.waitForURL("**/select-tenant");
    await page.fill("#ownerName", "Billing Master Owner");
    await page.fill("#businessName", "Laxmi Gold Shop E2E");
    await page.click("button[type='submit']");

    await page.waitForURL("**/dashboard");
    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();

    // 2. Go to Customer Directory and Register a Customer
    await page.goto("/customers");
    await expect(page.locator("h1:has-text('Customer Directory')")).toBeVisible();

    await page.click("button:has-text('Add Customer')");
    await page.fill("input#name", "Rajesh Kumar");
    await page.fill("input#phone", "9898989898");
    await page.fill("input#email", "rajesh@example.com");
    await page.fill("input#openingBalance", "1500.00");
    await page.click("button:has-text('Register Client')");

    // Verify customer is in the list
    await expect(page.locator("table")).toContainText("Rajesh Kumar");

    // 3. Go to Inventory and set up Category, SKU and Stock Item
    await page.goto("/inventory");
    await expect(page.locator("h1:has-text('Inventory Centre')")).toBeVisible();

    // Create Category
    await page.click("button:has-text('Add Category')");
    await page.fill("input#name", "Gold Chains");
    await page.selectOption("select#metalType", "gold");
    await page.click("button:has-text('Create Category')");

    // Create Product SKU Design
    await page.click("button:has-text('Add Product')");
    await page.fill("input#sku", "GC-22K-001");
    await page.fill("input#name", "22K Solid Gold Chain");
    await page.selectOption("select#metalType", "gold");
    await page.fill("input#defaultPurity", "0.916");
    await page.fill("input#defaultKarat", "22");
    await page.click("button:has-text('Register SKU')");

    // Create Stock Item
    await page.click("button:has-text('Add Item')");
    await page.selectOption("select#productId", { label: "22K Solid Gold Chain (GC-22K-001)" });
    await page.fill("input#tagNumber", "TAG-GC-001");
    await page.fill("input#grossWeight", "10.500");
    await page.fill("input#netWeight", "10.000");
    await page.fill("input#stoneWeight", "0.500");
    await page.fill("input#purityFineness", "0.916");
    await page.fill("input#costPrice", "55000");
    await page.click("button:has-text('Add Stock Item')");

    // 4. Create Daily Metal Rate (needed for billing rate lookup)
    await page.goto("/settings/metal-rates");
    await expect(page.locator("h1:has-text('Metal Rates')")).toBeVisible();
    await page.fill("input#goldRate", "6500");
    await page.fill("input#silverRate", "85");
    await page.click("button:has-text('Save Daily Rates')");

    // 5. Build Invoice
    await page.goto("/invoices/new");
    await expect(page.locator("h1:has-text('Create Invoice')")).toBeVisible();

    // Select customer Rajesh Kumar
    await page.selectOption("select#customer", { label: "Rajesh Kumar (9898989898)" });
    await page.click("button:has-text('Next')");

    // Add Line Item (Step 2)
    await page.click("button:has-text('Add Line Item')");
    // Pick the item from inventory
    await page.selectOption("select#selectedItem", { label: "TAG-GC-001 (22K Solid Gold Chain - 10.5g)" });
    await page.fill("input#makingVal", "500"); // 500 making charges
    await page.selectOption("select#makingType", "PER_GRAM");
    await page.click("button:has-text('Add to Invoice')");

    // Verify item is added to the table
    await expect(page.locator("table")).toContainText("TAG-GC-001");

    await page.click("button:has-text('Next')");

    // Step 3 Review & Finalize
    await page.click("button:has-text('Finalize & Issue')");

    // Should redirect to Invoice details
    await page.waitForURL("**/invoices/*");
    await expect(page.locator("h1:has-text('Invoice Details')")).toBeVisible();
    await expect(page.locator("span:has-text('Rajesh Kumar')")).toBeVisible();
  });
});
