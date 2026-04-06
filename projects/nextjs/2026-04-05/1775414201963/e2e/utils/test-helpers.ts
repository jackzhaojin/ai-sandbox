/**
 * Test Helpers for B2B Postal Checkout E2E Tests
 *
 * Shared utilities for creating test data, navigating the checkout flow,
 * and performing common assertions.
 */

import { Page, expect } from "@playwright/test";

// ============================================
// TEST DATA GENERATORS
// ============================================

export interface AddressData {
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PackageData {
  length: string;
  width: string;
  height: string;
  weight: string;
  declaredValue?: string;
  contentsDescription?: string;
}

export const generateTestAddress = (prefix: string = "Test"): AddressData => ({
  recipientName: `${prefix} User`,
  recipientPhone: "(555) 123-4567",
  line1: `${Math.floor(Math.random() * 9000) + 1000} ${prefix} Street`,
  line2: "Suite 100",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  country: "US",
});

export const generateTestPackage = (): PackageData => ({
  length: "12",
  width: "10",
  height: "8",
  weight: "5",
  declaredValue: "100",
  contentsDescription: "Office supplies",
});

// ============================================
// FORM HELPERS
// ============================================

/**
 * Fill an address section (origin or destination)
 */
export async function fillAddressSection(
  page: Page,
  type: "origin" | "destination",
  data: AddressData
): Promise<void> {
  const index = type === "origin" ? 0 : 1;

  // Recipient name
  await page.locator('input[placeholder*="name" i]').nth(index).fill(data.recipientName);

  // Phone
  await page.locator('input[type="tel"]').nth(index).fill(data.recipientPhone);

  // Street address
  await page.locator('input[placeholder*="Street" i]').nth(index).fill(data.line1);

  // Apartment/Suite (optional)
  if (data.line2) {
    const aptInputs = page.locator('input[placeholder*="Apt" i], input[placeholder*="Suite" i]');
    if ((await aptInputs.count()) > index) {
      await aptInputs.nth(index).fill(data.line2);
    }
  }

  // City
  await page.locator('input[placeholder="City"]').nth(index).fill(data.city);

  // State - open dropdown and select
  const stateButtons = page.locator("button", { hasText: /Select state/i });
  if ((await stateButtons.count()) > index) {
    await stateButtons.nth(index).click();
    await page.waitForTimeout(200);

    // Find the state option
    const stateOption = page.locator(`[role="option"]`, { hasText: new RegExp(data.state, "i") }).first();
    if (await stateOption.isVisible().catch(() => false)) {
      await stateOption.click();
    } else {
      // Try clicking by state code
      await page.locator(`[role="option"][data-value="${data.state}"]`).click();
    }
    await page.waitForTimeout(200);
  }

  // ZIP code
  await page.locator('input[placeholder*="ZIP" i]').nth(index).fill(data.postalCode);
}

/**
 * Fill package details section
 */
export async function fillPackageDetails(page: Page, data: PackageData): Promise<void> {
  await page.locator('input[placeholder="Length"]').fill(data.length);
  await page.locator('input[placeholder="Width"]').fill(data.width);
  await page.locator('input[placeholder="Height"]').fill(data.height);
  await page.locator('input[placeholder="Weight"]').fill(data.weight);

  if (data.declaredValue) {
    const valueInput = page.locator('input[placeholder*="value" i]').first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill(data.declaredValue);
    }
  }
}

/**
 * Complete Step 1 (Shipment Details) and navigate to Step 2
 */
export async function completeStep1(
  page: Page,
  originData?: Partial<AddressData>,
  destData?: Partial<AddressData>,
  packageData?: Partial<PackageData>
): Promise<string> {
  await page.goto("/shipments/new");

  const origin = { ...generateTestAddress("Origin"), ...originData };
  const dest = { ...generateTestAddress("Destination"), ...destData };
  const pkg = { ...generateTestPackage(), ...packageData };

  // Fill origin address
  await fillAddressSection(page, "origin", origin);

  // Fill destination address
  await fillAddressSection(page, "destination", dest);

  // Fill package details
  await fillPackageDetails(page, pkg);

  // Wait for validation
  await page.waitForTimeout(500);

  // Submit form
  await page.locator('button:has-text("Get Quotes")').click();

  // Wait for navigation to rates page
  await page.waitForURL(/\/shipments\/.*\/rates/, { timeout: 10000 });

  // Extract shipment ID from URL
  const url = page.url();
  const match = url.match(/\/shipments\/([^\/]+)\/rates/);
  return match?.[1] ?? "";
}

/**
 * Complete Step 2 (Rate Selection) and navigate to Step 3
 */
export async function completeStep2(page: Page, shipmentId?: string): Promise<void> {
  if (shipmentId) {
    await page.goto(`/shipments/${shipmentId}/rates`);
  }

  // Wait for quotes to load
  await page.waitForSelector("text=Available Shipping Rates", { timeout: 10000 });

  // Select first available quote
  const firstQuote = page.locator('[role="radio"]').first();

  if (await firstQuote.isVisible().catch(() => false)) {
    await firstQuote.click();
    await page.waitForTimeout(300);

    // Click continue
    await page.locator('button:has-text("Continue with Selected Rate")').click();

    // Wait for navigation to payment page
    await page.waitForURL(/\/shipments\/.*\/payment/, { timeout: 10000 });
  } else {
    throw new Error("No quotes available to select");
  }
}

/**
 * Complete full checkout flow through Step 3
 */
export async function completeStep3(
  page: Page,
  paymentMethod: "po" | "bol" | "third_party" | "net_terms" | "corporate" = "po"
): Promise<void> {
  // Select payment method
  const methodMap: Record<string, string> = {
    po: "Purchase Order",
    bol: "Bill of Lading",
    third_party: "Third-Party Billing",
    net_terms: "Net Terms",
    corporate: "Corporate Account",
  };

  await page.locator("text=" + methodMap[paymentMethod]).first().click();
  await page.waitForTimeout(300);

  // Fill payment method specific form
  switch (paymentMethod) {
    case "po":
      await fillPurchaseOrderForm(page);
      break;
    case "bol":
      await fillBillOfLadingForm(page);
      break;
    case "third_party":
      await fillThirdPartyForm(page);
      break;
    case "net_terms":
      await fillNetTermsForm(page);
      break;
    case "corporate":
      await fillCorporateForm(page);
      break;
  }

  await page.waitForTimeout(500);

  // Continue to Step 4
  const continueButton = page.locator('button:has-text("Continue")');
  if (await continueButton.isEnabled().catch(() => false)) {
    await continueButton.click();
    await page.waitForURL(/\/shipments\/.*\/pickup/, { timeout: 10000 });
  }
}

// ============================================
// PAYMENT FORM HELPERS
// ============================================

async function fillPurchaseOrderForm(page: Page): Promise<void> {
  await page.locator('input[placeholder*="PO" i]').fill("PO-2024-001");
  await page.locator('input[placeholder*="Amount" i]').fill("500");

  // Set future date
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 1);
  const dateStr = futureDate.toISOString().split("T")[0];
  await page.locator('input[type="date"]').fill(dateStr);

  await page.locator('input[placeholder*="Contact" i]').fill("John Manager");
  await page.locator('input[placeholder*="Department" i]').fill("Procurement");
}

async function fillBillOfLadingForm(page: Page): Promise<void> {
  await page.locator('input[placeholder*="BOL" i]').fill("BOL-2024-123456");

  // Select freight terms
  await page.locator("button", { hasText: /Freight Terms/i }).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Prepaid" }).click();
}

async function fillThirdPartyForm(page: Page): Promise<void> {
  await page.locator('input[placeholder*="Company" i]').fill("Third Party Logistics Inc");
  await page.locator('input[placeholder*="Account" i]').fill("ACC-987654");
  await page.locator('input[placeholder*="Contact" i]').fill("Sarah Contact");
  await page.locator('input[type="tel"]').fill("(555) 111-2222");
}

async function fillNetTermsForm(page: Page): Promise<void> {
  // Select payment period
  await page.locator("button", { hasText: /Payment Period|Net/i }).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]', { hasText: "Net 30" }).click();

  // Select annual revenue
  await page.locator("button", { hasText: /Annual Revenue/i }).click();
  await page.waitForTimeout(200);
  await page.locator('[role="option"]').first().click();

  // Fill at least 3 trade references
  const refs = [
    { name: "Vendor One", contact: "Bob", phone: "(555) 333-4444", email: "bob@test.com", acc: "V1-123" },
    { name: "Vendor Two", contact: "Alice", phone: "(555) 555-6666", email: "alice@test.com", acc: "V2-456" },
    { name: "Vendor Three", contact: "Charlie", phone: "(555) 777-8888", email: "charlie@test.com", acc: "V3-789" },
  ];

  for (let i = 0; i < refs.length; i++) {
    await page.locator('input[placeholder*="Company" i]').nth(i).fill(refs[i].name);
    await page.locator('input[placeholder*="Contact" i]').nth(i).fill(refs[i].contact);
    await page.locator('input[type="tel"]').nth(i).fill(refs[i].phone);
    await page.locator('input[type="email"]').nth(i).fill(refs[i].email);
    await page.locator('input[placeholder*="Account" i]').nth(i).fill(refs[i].acc);
  }
}

async function fillCorporateForm(page: Page): Promise<void> {
  await page.locator('input[placeholder*="Corporate" i]').fill("CORP-123456789");
  await page.locator('input[placeholder*="Cost Center" i]').fill("CC-100");
  await page.locator('input[placeholder*="Project" i]').fill("PROJ-2024-Q2");
  await page.locator('input[placeholder*="Authorized" i]').fill("Director Name");
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Verify that the current page is the shipment details page (Step 1)
 */
export async function expectToBeOnShipmentDetailsPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/shipments\/new/);
  await expect(page.locator("text=Shipment Details")).toBeVisible();
}

/**
 * Verify that the current page is the rates page (Step 2)
 */
export async function expectToBeOnRatesPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/shipments\/.*\/rates/);
  await expect(page.locator("text=Available Shipping Rates")).toBeVisible();
}

/**
 * Verify that the current page is the payment page (Step 3)
 */
export async function expectToBeOnPaymentPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/shipments\/.*\/payment/);
  await expect(page.locator("text=Payment").first()).toBeVisible();
}

/**
 * Verify form validation error is displayed
 */
export async function expectValidationError(
  page: Page,
  errorText?: string
): Promise<void> {
  if (errorText) {
    await expect(page.locator(`text=${errorText}`)).toBeVisible();
  } else {
    // Check for any error message
    const errorElements = page.locator("[role='alert'], .text-error, .text-red");
    await expect(errorElements.first()).toBeVisible();
  }
}

// ============================================
// WAIT HELPERS
// ============================================

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingToComplete(page: Page): Promise<void> {
  // Wait for loading spinner to disappear
  const spinner = page.locator("[data-testid='loading-spinner'], .animate-spin");
  try {
    await spinner.waitFor({ state: "hidden", timeout: 10000 });
  } catch {
    // Spinner might not exist
  }
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout = 5000
): Promise<void> {
  const toastSelector = message
    ? `text=${message}`
    : "[role='status'], [data-testid='toast']";
  await page.waitForSelector(toastSelector, { timeout });
}
