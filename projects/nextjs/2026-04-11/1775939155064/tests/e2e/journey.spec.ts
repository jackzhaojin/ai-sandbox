import { test, expect, Page } from '@playwright/test'

/**
 * Helper to complete prior steps in the journey.
 * Each step that adds a gate extends this helper with its own segment.
 * Start at the flow's natural entry and walk through `opts.through`.
 */
export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Step 1: Start from home page and navigate to new shipment form
  if (opts.through >= 1) {
    await page.goto('/')
    await expect(page).toHaveTitle(/B2B Postal Checkout/)
    
    // Click "Create New Shipment" button
    await page.getByRole('link', { name: /Create New Shipment/i }).click()
    
    // Verify we're on the shipment creation page
    await expect(page).toHaveURL(/\/shipments\/new/)
  }
}

/**
 * Gate 1: Verify the entry point and initial shipment form loads correctly.
 * This test validates:
 * - Home page loads with correct title and CTA
 * - Navigation to /shipments/new works
 * - Shipment form displays all required fields (origin, destination, package config)
 */
test('Gate 1: Home page to shipment form journey', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  // Verify the shipment form page loaded
  await expect(page.getByRole('heading', { name: /Create New Shipment/i })).toBeVisible()
  await expect(page.getByText(/Step 1 of 5: Enter shipment details/i)).toBeVisible()
  
  // Verify Origin Address section exists with all fields
  await expect(page.getByRole('heading', { name: /Origin Address/i })).toBeVisible()
  await expect(page.getByLabel(/Company\/Recipient Name/i).first()).toBeVisible()
  await expect(page.getByLabel(/Street Address/i).first()).toBeVisible()
  await expect(page.getByLabel(/City/i).first()).toBeVisible()
  await expect(page.getByLabel(/State/i).first()).toBeVisible()
  await expect(page.getByLabel(/ZIP/i).first()).toBeVisible()
  
  // Verify Destination Address section exists with all fields
  await expect(page.getByRole('heading', { name: /Destination Address/i })).toBeVisible()
  await expect(page.getByLabel(/Company\/Recipient Name/i).nth(1)).toBeVisible()
  await expect(page.getByLabel(/Street Address/i).nth(1)).toBeVisible()
  await expect(page.getByLabel(/City/i).nth(1)).toBeVisible()
  await expect(page.getByLabel(/State/i).nth(1)).toBeVisible()
  await expect(page.getByLabel(/ZIP/i).nth(1)).toBeVisible()
  
  // Verify Package Configuration section exists with all fields
  await expect(page.getByRole('heading', { name: /Package Configuration/i })).toBeVisible()
  await expect(page.getByLabel(/Weight \(lbs\)/i)).toBeVisible()
  await expect(page.getByLabel(/Length \(in\)/i)).toBeVisible()
  await expect(page.getByLabel(/Width \(in\)/i)).toBeVisible()
  await expect(page.getByLabel(/Height \(in\)/i)).toBeVisible()
  
  // Verify action buttons exist
  await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continue to Rates/i })).toBeVisible()
})

/**
 * Gate 1: Verify form accepts input (smoke test for form functionality).
 * This ensures the form is not just displayed but also interactive.
 */
test('Gate 1: Shipment form accepts user input', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  // Fill in origin address
  await page.getByLabel(/Company\/Recipient Name/i).first().fill('Acme Corp')
  await page.getByLabel(/Street Address/i).first().fill('123 Main St')
  await page.getByLabel(/City/i).first().fill('New York')
  await page.getByLabel(/State/i).first().fill('NY')
  await page.getByLabel(/ZIP/i).first().fill('10001')
  
  // Fill in destination address
  await page.getByLabel(/Company\/Recipient Name/i).nth(1).fill('Widget Inc')
  await page.getByLabel(/Street Address/i).nth(1).fill('456 Oak Ave')
  await page.getByLabel(/City/i).nth(1).fill('Los Angeles')
  await page.getByLabel(/State/i).nth(1).fill('CA')
  await page.getByLabel(/ZIP/i).nth(1).fill('90001')
  
  // Fill in package configuration
  await page.getByLabel(/Weight \(lbs\)/i).fill('5.5')
  await page.getByLabel(/Length \(in\)/i).fill('12')
  await page.getByLabel(/Width \(in\)/i).fill('10')
  await page.getByLabel(/Height \(in\)/i).fill('8')
  
  // Verify values are set (form state is working)
  await expect(page.getByLabel(/Company\/Recipient Name/i).first()).toHaveValue('Acme Corp')
  await expect(page.getByLabel(/City/i).nth(1)).toHaveValue('Los Angeles')
  await expect(page.getByLabel(/Weight \(lbs\)/i)).toHaveValue('5.5')
})
