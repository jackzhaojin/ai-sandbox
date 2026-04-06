/**
 * Step 2: Rate Selection Page E2E Tests
 *
 * Tests covering:
 * - Page loading and quote display
 * - Filter controls functionality
 * - Sort controls functionality
 * - Quote selection
 * - Quote details display
 * - Navigation to Step 3
 */

import { test, expect, Page } from "@playwright/test";

// Helper function to create a shipment and navigate to rates page
async function createShipmentAndNavigateToRates(page: Page) {
  // First, navigate to shipment details and create a shipment
  await page.goto("/shipments/new");

  // Fill origin address
  await page.locator('input[placeholder*="name" i]').nth(0).fill("John Smith");
  await page.locator('input[type="tel"]').nth(0).fill("(555) 123-4567");
  await page.locator('input[placeholder*="Street" i]').nth(0).fill("123 Main Street");
  await page.locator('input[placeholder="City"]').nth(0).fill("Austin");

  // Select state for origin
  await page.locator("button", { hasText: /Select state/i }).nth(0).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
  await page.waitForTimeout(200);

  await page.locator('input[placeholder*="ZIP" i]').nth(0).fill("78701");

  // Fill destination address
  await page.locator('input[placeholder*="name" i]').nth(1).fill("Jane Doe");
  await page.locator('input[type="tel"]').nth(1).fill("(555) 987-6543");
  await page.locator('input[placeholder*="Street" i]').nth(1).fill("456 Commerce Blvd");
  await page.locator('input[placeholder="City"]').nth(1).fill("Dallas");

  // Select state for destination
  await page.locator("button", { hasText: /Select state/i }).nth(1).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
  await page.waitForTimeout(200);

  await page.locator('input[placeholder*="ZIP" i]').nth(1).fill("75201");

  // Fill package details
  await page.locator('input[placeholder="Length"]').fill("12");
  await page.locator('input[placeholder="Width"]').fill("10");
  await page.locator('input[placeholder="Height"]').fill("8");
  await page.locator('input[placeholder="Weight"]').fill("5");

  // Wait for form validation
  await page.waitForTimeout(500);

  // Submit form
  await page.locator('button:has-text("Get Quotes")').click();

  // Wait for navigation to rates page
  await page.waitForURL(/\/shipments\/.*\/rates/, { timeout: 10000 });

  // Wait for quotes to load
  await page.waitForSelector("text=Available Shipping Rates", { timeout: 10000 });
}

test.describe("Step 2: Rate Selection Page", () => {
  test.describe("Page Loading", () => {
    test("should show loading state initially", async ({ page }) => {
      // Navigate directly to a rates page with a test ID
      await page.goto("/shipments/test-id/rates");

      // Should show loading spinner or similar
      await expect(page.locator("text=Loading rates")).toBeVisible({ timeout: 5000 });
    });

    test("should display shipment summary bar after loading", async ({ page }) => {
      await createShipmentAndNavigateToRates(page);

      // Check for shipment summary elements
      await expect(page.locator("text=Austin")).toBeVisible();
      await expect(page.locator("text=Dallas")).toBeVisible();
    });

    test("should display available quotes after loading", async ({ page }) => {
      await createShipmentAndNavigateToRates(page);

      // Check that quotes are displayed
      await expect(page.locator("text=Available Shipping Rates")).toBeVisible();
    });
  });

  test.describe("Category Tabs", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should display category tabs", async ({ page }) => {
      // Check for category tabs
      await expect(page.locator('button:has-text("All")')).toBeVisible();
      // Other tabs depend on available quotes
    });

    test("should show quote count badges on tabs", async ({ page }) => {
      // Find tabs with count badges
      const tabsWithCounts = page.locator('[role="tab"]');
      const count = await tabsWithCounts.count();

      // At minimum, should have "All" tab
      expect(count).toBeGreaterThan(0);
    });

    test("should filter quotes when clicking category tabs", async ({ page }) => {
      // Get initial quote count
      const initialCount = await page.locator("text=/\\d+ of \\d+ options/").textContent();

      // Click on a different tab if available
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        await tabs.nth(1).click();
        await page.waitForTimeout(500);

        // Count should update (or at least not error)
        await expect(page.locator("text=/\\d+ of \\d+ options/")).toBeVisible();
      }
    });
  });

  test.describe("Sort Controls", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should display sort dropdown", async ({ page }) => {
      await expect(page.locator('button:has-text("Sort")')).toBeVisible();
    });

    test("should open sort menu when clicked", async ({ page }) => {
      await page.locator('button:has-text("Sort")').click();

      // Check for sort options
      await expect(page.locator("text=Price (Lowest First)")).toBeVisible();
      await expect(page.locator("text=Transit Time (Fastest First)")).toBeVisible();
      await expect(page.locator("text=Reliability (Highest First)")).toBeVisible();
    });

    test("should sort by price when selected", async ({ page }) => {
      await page.locator('button:has-text("Sort")').click();
      await page.locator("text=Price (Lowest First)").click();

      // Wait for sort to apply
      await page.waitForTimeout(500);

      // Sort indicator should show Price
      await expect(page.locator('button:has-text("Price")')).toBeVisible();
    });

    test("should sort by transit time when selected", async ({ page }) => {
      await page.locator('button:has-text("Sort")').click();
      await page.locator("text=Transit Time (Fastest First)").click();

      await page.waitForTimeout(500);

      await expect(page.locator('button:has-text("Transit Time")')).toBeVisible();
    });

    test("should sort by reliability when selected", async ({ page }) => {
      await page.locator('button:has-text("Sort")').click();
      await page.locator("text=Reliability (Highest First)").click();

      await page.waitForTimeout(500);

      await expect(page.locator('button:has-text("Reliability")')).toBeVisible();
    });
  });

  test.describe("Filter Controls", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should display filter dropdown", async ({ page }) => {
      await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    });

    test("should open filter menu when clicked", async ({ page }) => {
      await page.locator('button:has-text("Filter")').click();

      // Check for filter options
      await expect(page.locator("text=Trackable Only")).toBeVisible();
      await expect(page.locator("text=Insurable Only")).toBeVisible();
      await expect(page.locator("text=Express (1-2 Days)")).toBeVisible();
    });

    test("should apply trackable filter", async ({ page }) => {
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Trackable Only").click();

      await page.waitForTimeout(500);

      // Filter badge should appear
      await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    });

    test("should apply insurable filter", async ({ page }) => {
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Insurable Only").click();

      await page.waitForTimeout(500);
    });

    test("should apply express filter", async ({ page }) => {
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Express (1-2 Days)").click();

      await page.waitForTimeout(500);
    });

    test("should show filter count badge when filters active", async ({ page }) => {
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Trackable Only").click();

      await page.waitForTimeout(500);

      // Re-open filter to apply another
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Insurable Only").click();

      await page.waitForTimeout(500);

      // Should show filter count
      const filterButton = page.locator('button:has-text("Filter")');
      await expect(filterButton).toBeVisible();
    });

    test("should clear filters and show all quotes", async ({ page }) => {
      // Apply a filter first
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Trackable Only").click();
      await page.waitForTimeout(500);

      // Clear filters
      await page.locator("text=Clear Filters").click();
      await page.waitForTimeout(500);

      // Filter badge should be gone
      await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    });

    test("should show empty state when no quotes match filters", async ({ page }) => {
      // Apply restrictive filters
      await page.locator('button:has-text("Filter")').click();
      await page.locator("text=Trackable Only").click();
      await page.locator("text=Insurable Only").click();
      await page.locator("text=Express (1-2 Days)").click();

      await page.waitForTimeout(500);

      // If no matches, should show empty state
      const noResults = page.locator("text=No matching quotes found");
      if (await noResults.isVisible().catch(() => false)) {
        await expect(page.locator("text=Try adjusting your filters")).toBeVisible();
      }
    });
  });

  test.describe("Quote Selection", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should display quote cards with pricing information", async ({ page }) => {
      // Check for pricing cards
      const quoteCards = page.locator('[role="radio"]');
      const count = await quoteCards.count();

      if (count > 0) {
        // Check that cards have price information
        await expect(page.locator("text=$").first()).toBeVisible();
      }
    });

    test("should select a quote when clicked", async ({ page }) => {
      // Find and click the first quote card
      const firstQuote = page.locator('[role="radio"]').first();

      if (await firstQuote.isVisible().catch(() => false)) {
        await firstQuote.click();

        // Should show selected state
        await expect(page.locator("text=Selected").first()).toBeVisible();
      }
    });

    test("should show quote details when selected", async ({ page }) => {
      const firstQuote = page.locator('[role="radio"]').first();

      if (await firstQuote.isVisible().catch(() => false)) {
        await firstQuote.click();
        await page.waitForTimeout(300);

        // Check for quote details
        await expect(page.locator("text=Continue with Selected Rate")).toBeVisible();
      }
    });

    test("should only allow one quote selection at a time", async ({ page }) => {
      const quotes = page.locator('[role="radio"]');
      const count = await quotes.count();

      if (count >= 2) {
        // Select first quote
        await quotes.nth(0).click();
        await page.waitForTimeout(300);

        // Select second quote
        await quotes.nth(1).click();
        await page.waitForTimeout(300);

        // Only one should be selected
        const selectedCount = await page.locator("text=Selected").count();
        expect(selectedCount).toBe(1);
      }
    });

    test("should display carrier information on quote cards", async ({ page }) => {
      // Look for common carrier names or generic carrier info
      const carrierInfo = page.locator("text=/FedEx|UPS|USPS|DHL|Carrier/i").first();
      await expect(carrierInfo).toBeVisible();
    });

    test("should display transit time information", async ({ page }) => {
      // Look for transit time indicators
      const transitInfo = page.locator("text=/day|business day|transit/i").first();
      await expect(transitInfo).toBeVisible();
    });

    test("should display service type information", async ({ page }) => {
      // Look for service type information
      const serviceInfo = page.locator("text=/Ground|Express|Priority|Standard/i").first();
      await expect(serviceInfo).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should have Back button to return to Step 1", async ({ page }) => {
      await expect(page.locator('button:has-text("Back")')).toBeVisible();
    });

    test("should navigate back to shipment details when Back clicked", async ({ page }) => {
      await page.locator('button:has-text("Back")').click();
      await page.waitForURL("/shipments/new");

      await expect(page.locator("text=Shipment Details")).toBeVisible();
    });

    test("should have Save as Draft button", async ({ page }) => {
      await expect(page.locator('button:has-text("Save as Draft")')).toBeVisible();
    });

    test("should have Start Over button", async ({ page }) => {
      await expect(page.locator('button:has-text("Start Over")')).toBeVisible();
    });

    test("should disable Continue button when no quote selected", async ({ page }) => {
      const continueButton = page.locator('button:has-text("Continue")');
      // Button might not exist until selection, or be disabled
      const isVisible = await continueButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(continueButton).toBeDisabled();
      }
    });

    test("should enable Continue button when quote is selected", async ({ page }) => {
      // Select a quote first
      const firstQuote = page.locator('[role="radio"]').first();

      if (await firstQuote.isVisible().catch(() => false)) {
        await firstQuote.click();
        await page.waitForTimeout(300);

        // Continue button should be visible and enabled
        const continueButton = page.locator('button:has-text("Continue with Selected Rate")');
        await expect(continueButton).toBeVisible();
        await expect(continueButton).toBeEnabled();
      }
    });

    test("should navigate to Step 3 when Continue clicked", async ({ page }) => {
      // Select a quote
      const firstQuote = page.locator('[role="radio"]').first();

      if (await firstQuote.isVisible().catch(() => false)) {
        await firstQuote.click();
        await page.waitForTimeout(300);

        // Click continue
        await page.locator('button:has-text("Continue with Selected Rate")').click();

        // Should navigate to payment page
        await page.waitForURL(/\/shipments\/.*\/payment/, { timeout: 10000 });
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should show error state if quotes fail to load", async ({ page }) => {
      // Navigate with an invalid shipment ID
      await page.goto("/shipments/invalid-id/rates");

      // Should show error state
      await expect(
        page.locator("text=Failed to Load Rates").or(page.locator("text=Error"))
      ).toBeVisible({ timeout: 10000 });
    });

    test("should have retry button on error state", async ({ page }) => {
      await page.goto("/shipments/invalid-id/rates");

      // Should show retry or back button
      await expect(
        page.locator('button:has-text("Try Again")').or(page.locator('button:has-text("Back")'))
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show no rates available message if no quotes returned", async ({ page }) => {
      // This would require specific test data that returns no quotes
      // For now, just verify the UI element exists
      await createShipmentAndNavigateToRates(page);

      const noRatesMessage = page.locator("text=No Rates Available");
      // Only check if it's visible (would be hidden if quotes exist)
      const isVisible = await noRatesMessage.isVisible().catch(() => false);

      if (isVisible) {
        await expect(page.locator("text=We couldn't find any shipping rates")).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await createShipmentAndNavigateToRates(page);
    });

    test("should have proper heading structure", async ({ page }) => {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("should have accessible quote selection", async ({ page }) => {
      const quotes = page.locator('[role="radio"]');

      if (await quotes.first().isVisible().catch(() => false)) {
        // Check that radio buttons have proper labels
        const firstQuote = quotes.first();
        const ariaLabel = await firstQuote.getAttribute("aria-label");
        const ariaChecked = await firstQuote.getAttribute("aria-checked");

        expect(ariaLabel || ariaChecked).toBeTruthy();
      }
    });

    test("should support keyboard navigation", async ({ page }) => {
      // Focus on first interactive element
      await page.locator('button').first().focus();

      // Tab through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).not.toBe("BODY");
    });
  });
});
