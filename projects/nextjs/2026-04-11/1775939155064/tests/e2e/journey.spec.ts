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
  
  // Step 2: Verify layout components and form configuration API (Gate 2)
  if (opts.through >= 2) {
    // Verify header components are present
    await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible()
    
    // Verify step indicator shows all steps
    await expect(page.getByText('Details').first()).toBeVisible()
    await expect(page.getByText('Rates').first()).toBeVisible()
    await expect(page.getByText('Payment').first()).toBeVisible()
    await expect(page.getByText('Pickup').first()).toBeVisible()
    await expect(page.getByText('Review').first()).toBeVisible()
    await expect(page.getByText('Confirm').first()).toBeVisible()
    
    // Verify footer is present
    await expect(page.getByRole('heading', { name: /Company/i })).toBeVisible()
    
    // Verify form configuration API is accessible
    const response = await page.request.get('/api/form-config')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.packageTypes).toBeDefined()
    expect(data.packageTypes.length).toBeGreaterThan(0)
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
  await expect(page.getByText(/Enter the shipment details below/i)).toBeVisible()
  
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
  
  // Verify Contents Description section exists
  await expect(page.getByRole('heading', { name: /Contents Description/i })).toBeVisible()
  await expect(page.getByLabel(/What's inside/i)).toBeVisible()
  
  // Verify action buttons exist
  await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
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
  
  // Fill in contents description
  await page.getByLabel(/What's inside/i).fill('Office supplies and documents')
  
  // Verify values are set (form state is working)
  await expect(page.getByLabel(/Company\/Recipient Name/i).first()).toHaveValue('Acme Corp')
  await expect(page.getByLabel(/City/i).nth(1)).toHaveValue('Los Angeles')
  await expect(page.getByLabel(/Weight \(lbs\)/i)).toHaveValue('5.5')
  await expect(page.getByLabel(/What's inside/i)).toHaveValue('Office supplies and documents')
})

/**
 * Gate 2: Verify layout components and step indicator render correctly.
 * This test validates:
 * - Header with back button and save draft is visible
 * - Step indicator shows all 6 steps (Details, Rates, Payment, Pickup, Review, Confirm)
 * - Footer with navigation links is visible
 * - Navigation buttons are present
 */
test('Gate 2: Layout components and step indicator', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  // Verify Header components
  await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Help$/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /B2B Shipping/i }).first()).toBeVisible()
  
  // Verify Step Indicator shows all 6 steps (use first() since both desktop and mobile render them)
  await expect(page.getByText('Details').first()).toBeVisible()
  await expect(page.getByText('Rates').first()).toBeVisible()
  await expect(page.getByText('Payment').first()).toBeVisible()
  await expect(page.getByText('Pickup').first()).toBeVisible()
  await expect(page.getByText('Review').first()).toBeVisible()
  await expect(page.getByText('Confirm').first()).toBeVisible()
  
  // Verify step numbers are visible (1-6)
  await expect(page.getByText('1').first()).toBeVisible()
  await expect(page.getByText('2').first()).toBeVisible()
  await expect(page.getByText('3').first()).toBeVisible()
  await expect(page.getByText('4').first()).toBeVisible()
  await expect(page.getByText('5').first()).toBeVisible()
  await expect(page.getByText('6').first()).toBeVisible()
  
  // Verify Footer is present with navigation sections
  await expect(page.getByRole('heading', { name: /Company/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Support/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Legal/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Resources/i })).toBeVisible()
  
  // Verify footer links
  await expect(page.getByRole('link', { name: /Help Center/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /API Documentation/i })).toBeVisible()
})

/**
 * Gate 2: Verify form configuration API returns valid data.
 * This test validates:
 * - /api/form-config endpoint returns 200 status
 * - Response contains expected configuration sections
 * - Package types, special handling, delivery preferences are present
 */
test('Gate 2: Form configuration API returns valid data', async ({ page }) => {
  // Make a direct API call to the form config endpoint
  const response = await page.request.get('/api/form-config')
  
  // Verify successful response
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')
  
  // Parse response body
  const data = await response.json()
  
  // Verify required sections exist
  expect(data.packageTypes).toBeDefined()
  expect(data.packageTypes.length).toBeGreaterThan(0)
  expect(data.specialHandling).toBeDefined()
  expect(data.specialHandling.length).toBeGreaterThan(0)
  expect(data.deliveryPreferences).toBeDefined()
  expect(data.deliveryPreferences.length).toBeGreaterThan(0)
  expect(data.contentsCategories).toBeDefined()
  expect(data.contentsCategories.length).toBeGreaterThan(0)
  expect(data.countries).toBeDefined()
  expect(data.countries.length).toBeGreaterThan(0)
  expect(data.validationRules).toBeDefined()
  expect(data.validationRules.length).toBeGreaterThan(0)
  expect(data.metadata).toBeDefined()
  
  // Verify specific package types
  const packageTypeIds = data.packageTypes.map((pt: { id: string }) => pt.id)
  expect(packageTypeIds).toContain('envelope')
  expect(packageTypeIds).toContain('small-box')
  expect(packageTypeIds).toContain('medium-box')
  expect(packageTypeIds).toContain('large-box')
  expect(packageTypeIds).toContain('custom')
  
  // Verify countries include US, CA, MX
  const countryCodes = data.countries.map((c: { code: string }) => c.code)
  expect(countryCodes).toContain('US')
  expect(countryCodes).toContain('CA')
  expect(countryCodes).toContain('MX')
  
  // Verify metadata
  expect(data.metadata.version).toBeDefined()
  expect(data.metadata.supportedCountries).toContain('US')
})
