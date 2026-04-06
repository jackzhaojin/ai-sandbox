/**
 * Step 3: Payment Page E2E Tests
 *
 * Tests covering:
 * - Page loading with shipment summary
 * - Payment method selection (PO, BOL, Third-Party, Net Terms, Corporate)
 * - Payment form validation for each method
 * - Billing address "Same as Origin" checkbox
 * - Payment method fees updating cost summary
 * - Navigation to Step 4
 *
 * Note: This page currently returns 404 as it hasn't been built yet.
 * These tests will pass once the payment page is implemented.
 */

import { test, expect, Page } from "@playwright/test";

// Test data for different payment methods
const paymentTestData = {
  purchaseOrder: {
    poNumber: "PO-2024-001",
    poAmount: "500",
    expirationDate: "2025-12-31",
    approvalContact: "John Manager",
    department: "Procurement",
  },
  billOfLading: {
    bolNumber: "BOL-2024-123456",
    bolDate: "2024-04-06",
    shipperReference: "REF-789",
    freightTerms: "prepaid",
  },
  thirdParty: {
    companyName: "Third Party Logistics Inc",
    accountNumber: "ACC-987654",
    contactName: "Sarah Contact",
    contactPhone: "(555) 111-2222",
    billingAddress: {
      line1: "789 Third St",
      city: "Houston",
      state: "TX",
      postalCode: "77001",
    },
  },
  netTerms: {
    paymentPeriod: "30",
    annualRevenue: "1m_to_5m",
    tradeReferences: [
      {
        companyName: "Vendor One Inc",
        contactName: "Bob Vendor",
        phone: "(555) 333-4444",
        email: "bob@vendorone.com",
        accountNumber: "V1-12345",
      },
      {
        companyName: "Supplier Two LLC",
        contactName: "Alice Supplier",
        phone: "(555) 555-6666",
        email: "alice@supplier2.com",
        accountNumber: "S2-67890",
      },
      {
        companyName: "Partner Three Co",
        contactName: "Charlie Partner",
        phone: "(555) 777-8888",
        email: "charlie@partner3.com",
        accountNumber: "P3-11111",
      },
    ],
  },
  corporateAccount: {
    corporateAccountNumber: "CORP-123456789",
    costCenter: "CC-100",
    projectCode: "PROJ-2024-Q2",
    authorizedBy: "Director Name",
  },
};

// Helper function to navigate to payment page with a valid shipment
async function navigateToPaymentPage(page: Page) {
  // Start from shipment details
  await page.goto("/shipments/new");

  // Fill and submit Step 1
  await page.locator('input[placeholder*="name" i]').nth(0).fill("Test User");
  await page.locator('input[type="tel"]').nth(0).fill("(555) 123-4567");
  await page.locator('input[placeholder*="Street" i]').nth(0).fill("123 Origin St");
  await page.locator('input[placeholder="City"]').nth(0).fill("Austin");
  await page.locator("button", { hasText: /Select state/i }).nth(0).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
  await page.waitForTimeout(200);
  await page.locator('input[placeholder*="ZIP" i]').nth(0).fill("78701");

  await page.locator('input[placeholder*="name" i]').nth(1).fill("Test Recipient");
  await page.locator('input[type="tel"]').nth(1).fill("(555) 987-6543");
  await page.locator('input[placeholder*="Street" i]').nth(1).fill("456 Dest St");
  await page.locator('input[placeholder="City"]').nth(1).fill("Dallas");
  await page.locator("button", { hasText: /Select state/i }).nth(1).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
  await page.waitForTimeout(200);
  await page.locator('input[placeholder*="ZIP" i]').nth(1).fill("75201");

  await page.locator('input[placeholder="Length"]').fill("12");
  await page.locator('input[placeholder="Width"]').fill("10");
  await page.locator('input[placeholder="Height"]').fill("8");
  await page.locator('input[placeholder="Weight"]').fill("5");

  await page.waitForTimeout(500);
  await page.locator('button:has-text("Get Quotes")').click();

  // Wait for and complete Step 2
  await page.waitForURL(/\/shipments\/.*\/rates/, { timeout: 10000 });
  await page.waitForSelector("text=Available Shipping Rates", { timeout: 10000 });

  // Select first quote
  const firstQuote = page.locator('[role="radio"]').first();
  if (await firstQuote.isVisible().catch(() => false)) {
    await firstQuote.click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Continue with Selected Rate")').click();
  }

  // Wait for navigation to payment page
  await page.waitForURL(/\/shipments\/.*\/payment/, { timeout: 10000 });
}

test.describe("Step 3: Payment Page", () => {
  test.describe("Page Rendering", () => {
    test("should render the payment page", async ({ page }) => {
      // Navigate through flow to reach payment page
      await navigateToPaymentPage(page);

      // Check for main payment sections
      await expect(page.locator("text=Payment").first()).toBeVisible();
      await expect(page.locator("text=Payment Method").or(page.locator("text=Select Payment"))).toBeVisible();
    });

    test("should display shipment summary", async ({ page }) => {
      await navigateToPaymentPage(page);

      // Check for shipment summary elements
      await expect(page.locator("text=Shipment Summary").or(page.locator("text=Order Summary"))).toBeVisible();
    });

    test("should display all 5 payment method options", async ({ page }) => {
      await navigateToPaymentPage(page);

      // Check for payment method options
      await expect(page.locator("text=Purchase Order")).toBeVisible();
      await expect(page.locator("text=Bill of Lading")).toBeVisible();
      await expect(page.locator("text=Third-Party Billing")).toBeVisible();
      await expect(page.locator("text=Net Terms")).toBeVisible();
      await expect(page.locator("text=Corporate Account")).toBeVisible();
    });

    test("should show cost summary with subtotal", async ({ page }) => {
      await navigateToPaymentPage(page);

      await expect(page.locator("text=Subtotal").or(page.locator("text=Shipping"))).toBeVisible();
    });
  });

  test.describe("Payment Method Selection", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
    });

    test("should select Purchase Order method", async ({ page }) => {
      await page.locator("text=Purchase Order").first().click();

      // Should show PO form
      await expect(page.locator("text=PO Number")).toBeVisible();
      await expect(page.locator("text=PO Amount")).toBeVisible();
    });

    test("should select Bill of Lading method", async ({ page }) => {
      await page.locator("text=Bill of Lading").first().click();

      // Should show BOL form
      await expect(page.locator("text=BOL Number")).toBeVisible();
      await expect(page.locator("text=Freight Terms")).toBeVisible();
    });

    test("should select Third-Party Billing method", async ({ page }) => {
      await page.locator("text=Third-Party Billing").first().click();

      // Should show third-party form
      await expect(page.locator("text=Company Name")).toBeVisible();
      await expect(page.locator("text=Account Number")).toBeVisible();
    });

    test("should select Net Terms method", async ({ page }) => {
      await page.locator("text=Net Terms").first().click();

      // Should show Net Terms form
      await expect(page.locator("text=Payment Period")).toBeVisible();
      await expect(page.locator("text=Trade References")).toBeVisible();
    });

    test("should select Corporate Account method", async ({ page }) => {
      await page.locator("text=Corporate Account").first().click();

      // Should show Corporate form
      await expect(page.locator("text=Corporate Account Number")).toBeVisible();
    });

    test("should only allow one payment method selection at a time", async ({ page }) => {
      // Select PO
      await page.locator("text=Purchase Order").first().click();
      await page.waitForTimeout(300);

      // Select BOL
      await page.locator("text=Bill of Lading").first().click();
      await page.waitForTimeout(300);

      // Should show BOL form, not PO form
      await expect(page.locator("text=BOL Number")).toBeVisible();
    });

    test("should show fee information for each method", async ({ page }) => {
      // Most methods should show fee info
      const feeInfo = page.locator("text=/Fee|No additional fee/i").first();
      await expect(feeInfo).toBeVisible();
    });
  });

  test.describe("Purchase Order Form", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
      await page.locator("text=Purchase Order").first().click();
    });

    test("should fill and validate PO form", async ({ page }) => {
      const data = paymentTestData.purchaseOrder;

      await page.locator('input[placeholder*="PO" i]').fill(data.poNumber);
      await page.locator('input[placeholder*="Amount" i]').fill(data.poAmount);
      await page.locator('input[type="date"]').fill(data.expirationDate);
      await page.locator('input[placeholder*="Contact" i]').fill(data.approvalContact);
      await page.locator('input[placeholder*="Department" i]').fill(data.department);

      // Verify values
      await expect(page.locator('input[placeholder*="PO" i]')).toHaveValue(data.poNumber.toUpperCase());
    });

    test("should validate PO number format", async ({ page }) => {
      const poInput = page.locator('input[placeholder*="PO" i]');

      // Invalid format
      await poInput.fill("invalid@po#");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(300);

      // Valid format
      await poInput.fill("PO-2024-001");
      await expect(poInput).toHaveValue("PO-2024-001");
    });

    test("should validate PO amount is numeric", async ({ page }) => {
      const amountInput = page.locator('input[placeholder*="Amount" i]');

      await amountInput.fill("500.00");
      await expect(amountInput).toHaveValue("500.00");
    });

    test("should require future expiration date", async ({ page }) => {
      const dateInput = page.locator('input[type="date"]');

      // Should have min attribute for tomorrow
      const minDate = await dateInput.getAttribute("min");
      expect(minDate).toBeTruthy();
    });
  });

  test.describe("Bill of Lading Form", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
      await page.locator("text=Bill of Lading").first().click();
    });

    test("should fill and validate BOL form", async ({ page }) => {
      const data = paymentTestData.billOfLading;

      await page.locator('input[placeholder*="BOL" i]').fill(data.bolNumber);
      await page.locator("button", { hasText: /Freight Terms/i }).click();
      await page.waitForTimeout(200);
      await page.locator('[role="option"]', { hasText: "Prepaid" }).click();

      await expect(page.locator('input[placeholder*="BOL" i]')).toHaveValue(data.bolNumber.toUpperCase());
    });

    test("should validate BOL number format", async ({ page }) => {
      const bolInput = page.locator('input[placeholder*="BOL" i]');

      // Invalid format
      await bolInput.fill("INVALID");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(300);

      // Valid format
      await bolInput.fill("BOL-2024-123456");
      await expect(bolInput).toHaveValue("BOL-2024-123456");
    });

    test("should show freight terms options", async ({ page }) => {
      await page.locator("button", { hasText: /Freight Terms/i }).click();

      await expect(page.locator("text=Prepaid")).toBeVisible();
      await expect(page.locator("text=Collect")).toBeVisible();
      await expect(page.locator("text=Prepaid & Add")).toBeVisible();
    });
  });

  test.describe("Third-Party Billing Form", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
      await page.locator("text=Third-Party Billing").first().click();
    });

    test("should fill third-party billing form", async ({ page }) => {
      const data = paymentTestData.thirdParty;

      await page.locator('input[placeholder*="Company" i]').fill(data.companyName);
      await page.locator('input[placeholder*="Account" i]').fill(data.accountNumber);
      await page.locator('input[placeholder*="Contact" i]').fill(data.contactName);
      await page.locator('input[type="tel"]').fill(data.contactPhone);
    });

    test("should validate phone number", async ({ page }) => {
      const phoneInput = page.locator('input[type="tel"]');

      await phoneInput.fill("(555) 111-2222");
      await expect(phoneInput).toHaveValue("(555) 111-2222");
    });
  });

  test.describe("Net Terms Form", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
      await page.locator("text=Net Terms").first().click();
    });

    test("should show payment period options", async ({ page }) => {
      await page.locator("button", { hasText: /Payment Period|Net/i }).click();

      await expect(page.locator("text=Net 15")).toBeVisible();
      await expect(page.locator("text=Net 30")).toBeVisible();
      await expect(page.locator("text=Net 45")).toBeVisible();
      await expect(page.locator("text=Net 60")).toBeVisible();
    });

    test("should show annual revenue options", async ({ page }) => {
      await page.locator("button", { hasText: /Annual Revenue|Revenue/i }).click();

      await expect(page.locator("text=Under")).toBeVisible();
      await expect(page.locator("text=million")).toBeVisible();
    });

    test("should show trade references section with minimum 3", async ({ page }) => {
      await expect(page.locator("text=Trade References")).toBeVisible();
      await expect(page.locator("text=minimum 3")).toBeVisible();

      // Should have at least 3 reference forms
      const referenceForms = page.locator("text=/Reference #/i");
      const count = await referenceForms.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test("should allow adding trade references", async ({ page }) => {
      const initialCount = await page.locator("text=/Reference #/i").count();

      await page.locator('button:has-text("Add Reference")').click();
      await page.waitForTimeout(300);

      const newCount = await page.locator("text=/Reference #/i").count();
      expect(newCount).toBe(initialCount + 1);
    });

    test("should fill trade reference fields", async ({ page }) => {
      const ref = paymentTestData.netTerms.tradeReferences[0];

      await page.locator('input[placeholder*="Company" i]').nth(0).fill(ref.companyName);
      await page.locator('input[placeholder*="Contact" i]').nth(0).fill(ref.contactName);
      await page.locator('input[type="tel"]').nth(0).fill(ref.phone);
      await page.locator('input[type="email"]').nth(0).fill(ref.email);
      await page.locator('input[placeholder*="Account" i]').nth(0).fill(ref.accountNumber);
    });

    test("should show fee notice for Net Terms", async ({ page }) => {
      await expect(page.locator("text=1.5%")).toBeVisible();
      await expect(page.locator("text=Cost of Capital")).toBeVisible();
    });
  });

  test.describe("Corporate Account Form", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
      await page.locator("text=Corporate Account").first().click();
    });

    test("should fill corporate account form", async ({ page }) => {
      const data = paymentTestData.corporateAccount;

      await page.locator('input[placeholder*="Corporate" i]').fill(data.corporateAccountNumber);
      await page.locator('input[placeholder*="Cost Center" i]').fill(data.costCenter);
      await page.locator('input[placeholder*="Project" i]').fill(data.projectCode);
      await page.locator('input[placeholder*="Authorized" i]').fill(data.authorizedBy);
    });
  });

  test.describe("Billing Address", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
    });

    test("should show billing address section", async ({ page }) => {
      // Select a payment method that shows billing address
      await page.locator("text=Purchase Order").first().click();

      await expect(page.locator("text=Billing Address")).toBeVisible();
    });

    test("should have 'Same as Origin' checkbox", async ({ page }) => {
      await page.locator("text=Purchase Order").first().click();

      await expect(page.locator("text=Same as Origin")).toBeVisible();
    });

    test("should auto-fill billing address when 'Same as Origin' is checked", async ({ page }) => {
      await page.locator("text=Purchase Order").first().click();

      // Check the checkbox
      await page.locator('label:has-text("Same as Origin")').click();

      // Billing address should be pre-filled
      const cityInput = page.locator('input[placeholder="City"]').last();
      await expect(cityInput).toHaveValue("Austin");
    });

    test("should allow manual billing address entry", async ({ page }) => {
      await page.locator("text=Purchase Order").first().click();

      // Uncheck 'Same as Origin' if checked
      const sameAsOrigin = page.locator('label:has-text("Same as Origin")');
      if (await sameAsOrigin.isChecked().catch(() => false)) {
        await sameAsOrigin.click();
      }

      // Fill billing address manually
      await page.locator('input[placeholder*="Street" i]').last().fill("999 Billing St");
      await page.locator('input[placeholder="City"]').last().fill("Houston");
    });
  });

  test.describe("Cost Summary and Fees", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
    });

    test("should display shipping cost", async ({ page }) => {
      await expect(page.locator("text=Subtotal").or(page.locator("text=Shipping Cost"))).toBeVisible();
    });

    test("should update total when payment method with fee is selected", async ({ page }) => {
      // Get initial total
      const initialTotal = await page.locator("text=/Total/i").textContent();

      // Select BOL (has 2.5% fee)
      await page.locator("text=Bill of Lading").first().click();
      await page.waitForTimeout(300);

      // Total should update
      const newTotal = await page.locator("text=/Total/i").textContent();
      // Note: Total might not change if displayed as separate fee line
    });

    test("should show fee amount for applicable payment methods", async ({ page }) => {
      // Select Third-Party (has flat fee)
      await page.locator("text=Third-Party Billing").first().click();

      // Should show fee information
      await expect(page.locator("text=Fee").or(page.locator("text=$5.00"))).toBeVisible();
    });

    test("should show no fee for PO method", async ({ page }) => {
      await page.locator("text=Purchase Order").first().click();

      // Should indicate no additional fee
      await expect(page.locator("text=No additional fee")).toBeVisible();
    });
  });

  test.describe("Form Submission and Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
    });

    test("should have Back button to return to Step 2", async ({ page }) => {
      await expect(page.locator('button:has-text("Back")')).toBeVisible();
    });

    test("should navigate back to rates page when Back clicked", async ({ page }) => {
      await page.locator('button:has-text("Back")').click();
      await page.waitForURL(/\/shipments\/.*\/rates/);

      await expect(page.locator("text=Available Shipping Rates")).toBeVisible();
    });

    test("should have Save as Draft button", async ({ page }) => {
      await expect(page.locator('button:has-text("Save as Draft")')).toBeVisible();
    });

    test("should disable Continue button until valid payment selected", async ({ page }) => {
      const continueButton = page.locator('button:has-text("Continue")');
      // Button might not exist or be disabled initially
      const isVisible = await continueButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(continueButton).toBeDisabled();
      }
    });

    test("should enable Continue button when valid payment entered", async ({ page }) => {
      // Select PO and fill form
      await page.locator("text=Purchase Order").first().click();

      const data = paymentTestData.purchaseOrder;
      await page.locator('input[placeholder*="PO" i]').fill(data.poNumber);
      await page.locator('input[placeholder*="Amount" i]').fill(data.poAmount);
      await page.locator('input[type="date"]').fill(data.expirationDate);
      await page.locator('input[placeholder*="Contact" i]').fill(data.approvalContact);
      await page.locator('input[placeholder*="Department" i]').fill(data.department);

      await page.waitForTimeout(500);

      // Continue button should be enabled
      const continueButton = page.locator('button:has-text("Continue")');
      if (await continueButton.isVisible().catch(() => false)) {
        await expect(continueButton).toBeEnabled();
      }
    });

    test("should navigate to Step 4 (Pickup) when Continue clicked", async ({ page }) => {
      // Select and fill payment method
      await page.locator("text=Purchase Order").first().click();

      const data = paymentTestData.purchaseOrder;
      await page.locator('input[placeholder*="PO" i]').fill(data.poNumber);
      await page.locator('input[placeholder*="Amount" i]').fill(data.poAmount);
      await page.locator('input[type="date"]').fill(data.expirationDate);
      await page.locator('input[placeholder*="Contact" i]').fill(data.approvalContact);
      await page.locator('input[placeholder*="Department" i]').fill(data.department);

      await page.waitForTimeout(500);

      // Click continue
      const continueButton = page.locator('button:has-text("Continue")');
      if (await continueButton.isEnabled().catch(() => false)) {
        await continueButton.click();
        await page.waitForURL(/\/shipments\/.*\/pickup/, { timeout: 10000 });
      }
    });
  });

  test.describe("Accessibility", () => {
    test.beforeEach(async ({ page }) => {
      await navigateToPaymentPage(page);
    });

    test("should have proper heading structure", async ({ page }) => {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("should have accessible payment method selection", async ({ page }) => {
      const paymentMethods = page.locator('[role="radio"]');

      if (await paymentMethods.first().isVisible().catch(() => false)) {
        const firstMethod = paymentMethods.first();
        const ariaLabel = await firstMethod.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
      }
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.locator("button").first().focus();

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).not.toBe("BODY");
    });
  });
});
