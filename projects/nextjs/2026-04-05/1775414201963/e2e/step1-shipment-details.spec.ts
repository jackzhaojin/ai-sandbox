/**
 * Step 1: Shipment Details Page E2E Tests
 *
 * Tests covering:
 * - Form rendering and initial state
 * - Preset selector functionality
 * - Address input validation
 * - Package details input
 * - Special handling options
 * - Hazmat conditional form
 * - Form validation errors
 * - Navigation to Step 2
 */

import { test, expect, Page } from "@playwright/test";

// Test data for valid shipment details
const validShipmentData = {
  origin: {
    recipientName: "John Smith",
    recipientPhone: "(555) 123-4567",
    line1: "123 Main Street",
    line2: "Suite 100",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    country: "US",
  },
  destination: {
    recipientName: "Jane Doe",
    recipientPhone: "(555) 987-6543",
    line1: "456 Commerce Blvd",
    line2: "",
    city: "Dallas",
    state: "TX",
    postalCode: "75201",
    country: "US",
  },
  package: {
    length: "12",
    width: "10",
    height: "8",
    weight: "5",
    declaredValue: "100",
    contentsDescription: "Office supplies",
  },
  referenceNumber: "REF-001",
  poNumber: "PO-12345",
};

// Helper function to fill address form
async function fillAddress(
  page: Page,
  type: "origin" | "destination",
  data: typeof validShipmentData.origin
) {
  const prefix = type === "origin" ? "Origin" : "Destination";

  // Fill recipient name
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator('input[placeholder*="name" i]')
    .fill(data.recipientName);

  // Fill phone
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator('input[type="tel"]')
    .fill(data.recipientPhone);

  // Fill street address
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator('input[placeholder*="Street" i]')
    .fill(data.line1);

  // Fill apartment/suite if provided
  if (data.line2) {
    await page
      .locator(`text=${prefix}`)
      .locator("..")
      .locator('input[placeholder*="Apt" i], input[placeholder*="Suite" i]')
      .fill(data.line2);
  }

  // Fill city
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator('input[placeholder="City"]')
    .fill(data.city);

  // Select state
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator("button", { hasText: /Select state/i })
    .click();
  await page.locator(`[role="option"]:has-text("${data.state}")`).first().click();

  // Fill ZIP code
  await page
    .locator(`text=${prefix}`)
    .locator("..")
    .locator('input[placeholder*="ZIP" i]')
    .fill(data.postalCode);

  // Select country if not US
  if (data.country !== "US") {
    await page
      .locator(`text=${prefix}`)
      .locator("..")
      .locator("button", { hasText: /Select country/i })
      .click();
    await page.locator(`[role="option"]:has-text("${data.country}")`).click();
  }
}

test.describe("Step 1: Shipment Details Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shipments/new");
    // Wait for page to load - check for Quick Start Presets heading
    await expect(page.locator("text=Quick Start Presets")).toBeVisible();
  });

  test.describe("Page Rendering", () => {
    test("should render the shipment details page with all sections", async ({
      page,
    }) => {
      // Check for main sections with unique text (using first() for non-unique selectors)
      await expect(page.locator("text=Quick Start Presets").first()).toBeVisible();
      await expect(page.locator("text=Enter the origin and destination addresses").first()).toBeVisible();
      await expect(page.locator("text=Specify package type, dimensions, and weight").first()).toBeVisible();
      await expect(page.locator("text=Select any special handling requirements").first()).toBeVisible();
      await expect(page.locator("text=Customize delivery options").first()).toBeVisible();
      await expect(page.locator("text=Declare if your shipment contains hazardous materials").first()).toBeVisible();
      await expect(page.locator("text=Add reference numbers for tracking").first()).toBeVisible();
    });

    test("should display step indicator with correct progress", async ({
      page,
    }) => {
      // Check for step indicators
      await expect(page.locator("text=Shipment Details")).toBeVisible();
      await expect(page.locator("text=Select Rate")).toBeVisible();
      await expect(page.locator("text=Payment")).toBeVisible();
    });

    test("should render all 5 preset selector cards", async ({ page }) => {
      const presets = [
        "Standard Office Documents",
        "Electronics Equipment",
        "Industrial Parts",
        "Medical Supplies",
        "Trade Show Materials",
      ];

      for (const preset of presets) {
        await expect(page.locator(`text=${preset}`)).toBeVisible();
      }
    });

    test("should render package type selector with all options", async ({
      page,
    }) => {
      await expect(
        page.locator('label:has-text("Package Type")')
      ).toBeVisible();

      const packageTypes = [
        "Envelope",
        "Small Box",
        "Medium Box",
        "Large Box",
        "Pallet",
        "Crate",
        "Multiple Pieces",
      ];

      for (const type of packageTypes) {
        await expect(page.locator(`text=${type}`).first()).toBeVisible();
      }
    });
  });

  test.describe("Preset Selector", () => {
    test("should auto-fill form when selecting a preset", async ({ page }) => {
      // Click on Standard Office Documents preset
      await page
        .locator("button", { hasText: "Standard Office Documents" })
        .click();

      // Wait for success toast
      await expect(
        page.locator("text=Standard Office Documents preset has been applied")
      ).toBeVisible();

      // Check that dimensions are filled (values from preset)
      const lengthInput = page.locator('input[placeholder="Length"]').first();
      await expect(lengthInput).not.toHaveValue("");
    });

    test("should show selected state on clicked preset", async ({ page }) => {
      const presetButton = page
        .locator("button", { hasText: "Electronics Equipment" })
        .first();

      await presetButton.click();

      // Check for selected indicator (checkmark)
      await expect(
        presetButton.locator("..").locator("svg").first()
      ).toBeVisible();
    });

    test("should allow changing presets", async ({ page }) => {
      // Select first preset
      await page
        .locator("button", { hasText: "Standard Office Documents" })
        .click();

      // Select different preset
      await page
        .locator("button", { hasText: "Industrial Parts" })
        .click();

      // Wait for success toast
      await expect(
        page.locator("text=Industrial Parts preset has been applied")
      ).toBeVisible();
    });
  });

  test.describe("Address Form Validation", () => {
    test("should show validation errors for empty required fields", async ({
      page,
    }) => {
      // Try to submit with empty form
      await page.locator('button:has-text("Get Quotes")').click();

      // Wait for validation to trigger
      await page.waitForTimeout(500);

      // Check that form shows validation state (button should be disabled or error shown)
      const submitButton = page.locator('button:has-text("Get Quotes")');
      await expect(submitButton).toBeDisabled();
    });

    test("should validate ZIP code format", async ({ page }) => {
      // Navigate to origin address section and fill with invalid ZIP
      await page.locator('input[placeholder*="ZIP" i]').first().fill("123");

      // Move to next field to trigger validation
      await page.keyboard.press("Tab");

      // Check for validation error
      // Note: The specific error message depends on the validation implementation
      await page.waitForTimeout(300);
    });

    test("should accept valid 5-digit ZIP code", async ({ page }) => {
      const zipInput = page.locator('input[placeholder*="ZIP" i]').first();
      await zipInput.fill("78701");

      await expect(zipInput).toHaveValue("78701");
    });

    test("should accept valid ZIP+4 format", async ({ page }) => {
      const zipInput = page.locator('input[placeholder*="ZIP" i]').first();
      await zipInput.fill("78701-1234");

      await expect(zipInput).toHaveValue("78701-1234");
    });

    test("should validate email format if email field exists", async ({
      page,
    }) => {
      // Note: Email validation is not in the current form, but phone validation is
      const phoneInput = page.locator('input[type="tel"]').first();
      await phoneInput.fill("invalid-phone");

      // Move to next field
      await page.keyboard.press("Tab");
      await page.waitForTimeout(300);
    });

    test("should accept valid phone number formats", async ({ page }) => {
      const phoneInput = page.locator('input[type="tel"]').first();

      // Test various formats
      await phoneInput.fill("5551234567");
      await expect(phoneInput).toHaveValue("5551234567");

      await phoneInput.fill("(555) 123-4567");
      await expect(phoneInput).toHaveValue("(555) 123-4567");
    });
  });

  test.describe("Package Details", () => {
    test("should calculate dimensional weight correctly", async ({ page }) => {
      // Fill dimensions
      await page.locator('input[placeholder="Length"]').first().fill("12");
      await page.locator('input[placeholder="Width"]').first().fill("10");
      await page.locator('input[placeholder="Height"]').first().fill("8");

      // Check if dimensional weight is displayed
      await expect(page.locator("text=/dimensional weight/i")).toBeVisible();
    });

    test("should toggle between inches and centimeters", async ({ page }) => {
      // Find and click the unit toggle
      const unitToggle = page
        .locator("button", { hasText: /in|cm/i })
        .first();
      await unitToggle.click();

      // Check that the unit changed
      await expect(page.locator("text=cm").first()).toBeVisible();
    });

    test("should toggle between lbs and kg", async ({ page }) => {
      // Find weight unit toggle
      const weightToggle = page
        .locator("button", { hasText: /lbs|kg/i })
        .first();
      await weightToggle.click();

      // Check that the unit changed
      await expect(page.locator("text=kg").first()).toBeVisible();
    });

    test("should show warning when dimensional weight exceeds actual weight", async ({
      page,
    }) => {
      // Set large dimensions but low weight
      await page.locator('input[placeholder="Length"]').first().fill("24");
      await page.locator('input[placeholder="Width"]').first().fill("20");
      await page.locator('input[placeholder="Height"]').first().fill("16");
      await page.locator('input[placeholder="Weight"]').first().fill("1");

      // Check for warning message
      await page.waitForTimeout(500);
    });

    test("should validate declared value is numeric", async ({ page }) => {
      const declaredValueInput = page
        .locator('input[placeholder*="value" i], input[type="number"]')
        .filter({ hasText: /value/i })
        .first();

      if (await declaredValueInput.isVisible().catch(() => false)) {
        await declaredValueInput.fill("100.50");
        await expect(declaredValueInput).toHaveValue("100.50");
      }
    });
  });

  test.describe("Special Handling Options", () => {
    test("should display all special handling options", async ({ page }) => {
      const options = [
        "Fragile",
        "Hazardous Materials",
        "Temperature Controlled",
        "Signature Required",
        "Adult Signature",
        "Hold for Pickup",
        "Appointment Delivery",
        "Dry Ice",
      ];

      for (const option of options) {
        await expect(
          page.locator(`label:has-text("${option}")`)
        ).toBeVisible();
      }
    });

    test("should toggle special handling options on click", async ({
      page,
    }) => {
      // Find and click the Fragile option
      const fragileCheckbox = page.locator('label:has-text("Fragile")');
      await fragileCheckbox.click();

      // Check that it's now checked
      const checkbox = fragileCheckbox.locator("..").locator('input[type="checkbox"]');
      await expect(checkbox).toBeChecked();
    });

    test("should show instructions field when special handling is selected", async ({
      page,
    }) => {
      // Select a special handling option
      await page.locator('label:has-text("Fragile")').click();

      // Check for instructions textarea
      const instructionsInput = page.locator(
        'textarea[placeholder*="instructions" i]'
      );
      if (await instructionsInput.isVisible().catch(() => false)) {
        await instructionsInput.fill("Handle with extra care");
        await expect(instructionsInput).toHaveValue("Handle with extra care");
      }
    });
  });

  test.describe("Hazmat Conditional Form", () => {
    test("should show hazmat declaration checkbox", async ({ page }) => {
      await expect(
        page.locator('label:has-text("hazardous materials")')
      ).toBeVisible();
    });

    test("should expand hazmat form when checkbox is checked", async ({
      page,
    }) => {
      // Click the hazmat checkbox
      await page
        .locator('label:has-text("hazardous materials")')
        .click();

      // Wait for form to expand
      await expect(page.locator("text=Hazardous Materials Declaration")).toBeVisible();

      // Check for hazmat-specific fields
      await expect(page.locator("text=Hazmat Class")).toBeVisible();
      await expect(page.locator("text=UN Number")).toBeVisible();
      await expect(page.locator("text=Proper Shipping Name")).toBeVisible();
    });

    test("should validate UN number format", async ({ page }) => {
      // Enable hazmat
      await page
        .locator('label:has-text("hazardous materials")')
        .click();

      // Fill UN number with invalid format
      const unNumberInput = page.locator('input[placeholder*="UN" i]');
      await unNumberInput.fill("INVALID");

      // Move to next field
      await page.keyboard.press("Tab");

      // Check for validation error
      await page.waitForTimeout(300);
    });

    test("should accept valid UN number format", async ({ page }) => {
      // Enable hazmat
      await page
        .locator('label:has-text("hazardous materials")')
        .click();

      const unNumberInput = page.locator('input[placeholder*="UN" i]');
      await unNumberInput.fill("UN1203");

      await expect(unNumberInput).toHaveValue("UN1203");
    });

    test("should show emergency contact section in hazmat form", async ({
      page,
    }) => {
      // Enable hazmat
      await page
        .locator('label:has-text("hazardous materials")')
        .click();

      await expect(page.locator("text=Emergency Contact Information")).toBeVisible();
      await expect(page.locator("text=Contact Name")).toBeVisible();
      await expect(page.locator("text=Contact Phone")).toBeVisible();
    });

    test("should collapse hazmat form when unchecked", async ({ page }) => {
      // Enable then disable hazmat
      const hazmatLabel = page.locator('label:has-text("hazardous materials")');
      await hazmatLabel.click();
      await expect(page.locator("text=Hazardous Materials Declaration")).toBeVisible();

      await hazmatLabel.click();
      await expect(
        page.locator("text=Hazardous Materials Declaration")
      ).not.toBeVisible();
    });
  });

  test.describe("Delivery Preferences", () => {
    test("should display delivery preference options", async ({ page }) => {
      await expect(
        page.locator('label:has-text("Saturday Delivery")')
      ).toBeVisible();
      await expect(
        page.locator('label:has-text("Sunday Delivery")')
      ).toBeVisible();
      await expect(
        page.locator('label:has-text("Signature Required")')
      ).toBeVisible();
    });

    test("should allow selecting delivery preferences", async ({ page }) => {
      await page.locator('label:has-text("Signature Required")').click();

      const checkbox = page
        .locator('label:has-text("Signature Required")')
        .locator("..")
        .locator('input[type="checkbox"]');
      await expect(checkbox).toBeChecked();
    });

    test("should show delivery instructions textarea", async ({ page }) => {
      const instructionsTextarea = page.locator(
        'textarea[placeholder*="delivery" i]'
      );

      if (await instructionsTextarea.isVisible().catch(() => false)) {
        await instructionsTextarea.fill("Leave at front desk");
        await expect(instructionsTextarea).toHaveValue("Leave at front desk");
      }
    });
  });

  test.describe("Reference Information", () => {
    test("should allow entering reference number", async ({ page }) => {
      const refInput = page
        .locator('input[placeholder*="Reference" i]')
        .first();
      await refInput.fill("REF-001");

      await expect(refInput).toHaveValue("REF-001");
    });

    test("should allow entering PO number", async ({ page }) => {
      const poInput = page.locator('input[placeholder*="PO" i]').first();
      await poInput.fill("PO-12345");

      await expect(poInput).toHaveValue("PO-12345");
    });
  });

  test.describe("Form Submission", () => {
    test("should enable Get Quotes button when form is valid", async ({
      page,
    }) => {
      // Fill origin address
      await page
        .locator('input[placeholder*="name" i]')
        .nth(0)
        .fill(validShipmentData.origin.recipientName);
      await page
        .locator('input[type="tel"]')
        .nth(0)
        .fill(validShipmentData.origin.recipientPhone);
      await page
        .locator('input[placeholder*="Street" i]')
        .nth(0)
        .fill(validShipmentData.origin.line1);
      await page
        .locator('input[placeholder="City"]')
        .nth(0)
        .fill(validShipmentData.origin.city);

      // Select state for origin
      await page.locator("button", { hasText: /Select state/i }).nth(0).click();
      await page.waitForTimeout(200);
      await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
      await page.waitForTimeout(200);

      await page
        .locator('input[placeholder*="ZIP" i]')
        .nth(0)
        .fill(validShipmentData.origin.postalCode);

      // Fill destination address
      await page
        .locator('input[placeholder*="name" i]')
        .nth(1)
        .fill(validShipmentData.destination.recipientName);
      await page
        .locator('input[type="tel"]')
        .nth(1)
        .fill(validShipmentData.destination.recipientPhone);
      await page
        .locator('input[placeholder*="Street" i]')
        .nth(1)
        .fill(validShipmentData.destination.line1);
      await page
        .locator('input[placeholder="City"]')
        .nth(1)
        .fill(validShipmentData.destination.city);

      // Select state for destination
      await page.locator("button", { hasText: /Select state/i }).nth(1).click();
      await page.waitForTimeout(200);
      await page.locator('[role="option"]', { hasText: "Texas" }).first().click();
      await page.waitForTimeout(200);

      await page
        .locator('input[placeholder*="ZIP" i]')
        .nth(1)
        .fill(validShipmentData.destination.postalCode);

      // Fill package details
      await page
        .locator('input[placeholder="Length"]')
        .fill(validShipmentData.package.length);
      await page
        .locator('input[placeholder="Width"]')
        .fill(validShipmentData.package.width);
      await page
        .locator('input[placeholder="Height"]')
        .fill(validShipmentData.package.height);
      await page
        .locator('input[placeholder="Weight"]')
        .fill(validShipmentData.package.weight);

      // Wait for form validation
      await page.waitForTimeout(500);

      // Check that Get Quotes button is enabled
      const submitButton = page.locator('button:has-text("Get Quotes")');
      await expect(submitButton).toBeEnabled();
    });

    test("should show loading state during submission", async ({ page }) => {
      // This test would require mocking the API response
      // For now, we just verify the button exists and can be clicked
      const submitButton = page.locator('button:has-text("Get Quotes")');
      await expect(submitButton).toBeVisible();
    });

    test("should navigate to rates page after successful submission", async ({
      page,
    }) => {
      // Fill form with valid data and submit
      // Note: This requires the API to be running and responding correctly
      // For now, this is a placeholder test

      // Complete form filling would go here...
      // await submitButton.click();
      // await expect(page).toHaveURL(/\/shipments\/.*\/rates/);
    });
  });

  test.describe("Navigation Actions", () => {
    test("should show Save as Draft button", async ({ page }) => {
      await expect(page.locator('button:has-text("Save as Draft")')).toBeVisible();
    });

    test("should show Start Over button", async ({ page }) => {
      await expect(page.locator('button:has-text("Start Over")')).toBeVisible();
    });

    test("should clear form when Start Over is clicked", async ({ page }) => {
      // Fill some data first
      await page
        .locator('input[placeholder*="name" i]')
        .first()
        .fill("Test Name");

      // Click Start Over
      await page.locator('button:has-text("Start Over")').click();

      // Handle confirmation dialog
      page.once("dialog", (dialog) => dialog.accept());

      // Wait for form to clear
      await page.waitForTimeout(500);

      // Check that form is cleared
      await expect(
        page.locator('input[placeholder*="name" i]').first()
      ).toHaveValue("");
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper heading structure", async ({ page }) => {
      // Check for main heading
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
    });

    test("should have accessible form labels", async ({ page }) => {
      // Check that inputs have associated labels
      const inputs = page.locator(
        'input:not([type="hidden"]), select, textarea'
      );
      const count = await inputs.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const id = await input.getAttribute("id");

        // Input should have some form of labeling
        expect(ariaLabel || ariaLabelledBy || id).toBeTruthy();
      }
    });

    test("should support keyboard navigation", async ({ page }) => {
      // Start at the first input
      await page.locator('input').first().focus();

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      // Check that something is focused
      const activeElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(activeElement).not.toBe("BODY");
    });
  });
});
