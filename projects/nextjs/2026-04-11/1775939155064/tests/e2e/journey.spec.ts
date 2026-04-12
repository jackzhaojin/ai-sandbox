import { test, expect, Page } from '@playwright/test'

/**
 * Helper to complete prior steps in the journey.
 */
export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Step 1: Start from home page and navigate to new shipment form
  if (opts.through >= 1) {
    await page.goto('/')
    await expect(page).toHaveTitle(/B2B Postal Checkout/)
    await page.getByRole('link', { name: /Create New Shipment/i }).click()
    await expect(page).toHaveURL(/\/shipments\/new/)
  }
  
  // Step 2: Verify layout components and form configuration API (Gate 2)
  if (opts.through >= 2) {
    await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible()
    await expect(page.getByText('Details').first()).toBeVisible()
    await expect(page.getByText('Rates').first()).toBeVisible()
    await expect(page.getByText('Payment').first()).toBeVisible()
    await expect(page.getByText('Pickup').first()).toBeVisible()
    await expect(page.getByText('Review').first()).toBeVisible()
    await expect(page.getByText('Confirm').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Company/i })).toBeVisible()
    
    const response = await page.request.get('/api/form-config')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.packageTypes).toBeDefined()
    expect(data.packageTypes.length).toBeGreaterThan(0)
  }

  // Step 3: Fill out the complete Step 1 form (Gate 3)
  if (opts.through >= 3) {
    // Origin address
    await page.getByLabel(/Street Address/i).first().fill('123 Main St')
    await page.getByLabel(/City/i).first().fill('New York')
    await page.getByLabel(/ZIP Code/i).first().fill('10001')
    await page.getByLabel(/Contact Name/i).first().fill('John Smith')
    await page.getByLabel(/Company Name/i).first().fill('Acme Corp')
    await page.getByLabel(/Phone Number/i).first().fill('555-123-4567')
    await page.getByLabel(/Email Address/i).first().fill('john@acme.com')
    // Select origin state (required by API)
    await page.getByRole('button', { name: /State\/Province/i }).first().click()
    await page.getByRole('button', { name: 'New York', exact: true }).click()
    
    // Destination address  
    await page.getByLabel(/Street Address/i).nth(1).fill('456 Oak Ave')
    await page.getByLabel(/City/i).nth(1).fill('Los Angeles')
    await page.getByLabel(/ZIP Code/i).nth(1).fill('90001')
    await page.getByLabel(/Contact Name/i).nth(1).fill('Jane Doe')
    await page.getByLabel(/Company Name/i).nth(1).fill('Widget Inc')
    await page.getByLabel(/Phone Number/i).nth(1).fill('555-987-6543')
    await page.getByLabel(/Email Address/i).nth(1).fill('jane@widget.com')
    // Select destination state (required by API)
    await page.getByRole('button', { name: /State\/Province/i }).nth(1).click()
    await page.getByRole('button', { name: 'California', exact: true }).click()

    // Package Configuration
    await page.getByRole('button', { name: /Small Box/i }).click()
    await page.getByLabel(/Length/i).fill('12')
    await page.getByLabel(/Width/i).fill('10')
    await page.getByLabel(/Height/i).fill('8')
    await page.getByLabel(/Actual Weight/i).fill('5.5')
    await page.getByLabel(/Declared Value/i).fill('100')
    await page.getByLabel(/Contents Description/i).fill('Office supplies')

    // Special Handling & Delivery - click on the option text
    await page.getByText(/Fragile/i).first().click()
    await page.getByText(/Signature Required/i).first().click()
  }
}

test('Gate 1: Home page to shipment form journey', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  await expect(page.getByRole('heading', { name: /Create New Shipment/i })).toBeVisible()
  await expect(page.getByText(/Enter the shipment details below/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Origin Address/i })).toBeVisible()
  await expect(page.getByLabel(/Street Address/i).first()).toBeVisible()
  await expect(page.getByLabel(/City/i).first()).toBeVisible()
  await expect(page.getByLabel(/ZIP Code/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Destination Address/i })).toBeVisible()
  await expect(page.getByLabel(/Street Address/i).nth(1)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Package Configuration/i })).toBeVisible()
  await expect(page.getByLabel(/Actual Weight/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continue to Rates/i })).toBeVisible()
})

test('Gate 1: Shipment form accepts user input', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  await page.getByLabel(/Street Address/i).first().fill('123 Main St')
  await page.getByLabel(/City/i).first().fill('New York')
  await page.getByLabel(/ZIP Code/i).first().fill('10001')
  await page.getByLabel(/Street Address/i).nth(1).fill('456 Oak Ave')
  await page.getByLabel(/City/i).nth(1).fill('Los Angeles')
  await page.getByLabel(/ZIP Code/i).nth(1).fill('90001')
  await page.getByLabel(/Actual Weight/i).fill('5.5')
  await page.getByLabel(/Contents Description/i).fill('Office supplies and documents')
  
  await expect(page.getByLabel(/Street Address/i).first()).toHaveValue('123 Main St')
  await expect(page.getByLabel(/City/i).nth(1)).toHaveValue('Los Angeles')
  await expect(page.getByLabel(/Actual Weight/i)).toHaveValue('5.5')
  await expect(page.getByLabel(/Contents Description/i)).toHaveValue('Office supplies and documents')
})

test('Gate 2: Layout components and step indicator', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  await expect(page.getByRole('link', { name: /Go back/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Help$/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /B2B Shipping/i }).first()).toBeVisible()
  await expect(page.getByText('Details').first()).toBeVisible()
  await expect(page.getByText('Rates').first()).toBeVisible()
  await expect(page.getByText('Payment').first()).toBeVisible()
  await expect(page.getByText('Pickup').first()).toBeVisible()
  await expect(page.getByText('Review').first()).toBeVisible()
  await expect(page.getByText('Confirm').first()).toBeVisible()
  await expect(page.getByText('1').first()).toBeVisible()
  await expect(page.getByText('2').first()).toBeVisible()
  await expect(page.getByText('3').first()).toBeVisible()
  await expect(page.getByText('4').first()).toBeVisible()
  await expect(page.getByText('5').first()).toBeVisible()
  await expect(page.getByText('6').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Company/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Support/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Legal/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Resources/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Help Center/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /API Documentation/i })).toBeVisible()
})

test('Gate 2: Form configuration API returns valid data', async ({ page }) => {
  const response = await page.request.get('/api/form-config')
  
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')
  
  const data = await response.json()
  
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
  
  const packageTypeIds = data.packageTypes.map((pt: { id: string }) => pt.id)
  expect(packageTypeIds).toContain('envelope')
  expect(packageTypeIds).toContain('small-box')
  expect(packageTypeIds).toContain('medium-box')
  expect(packageTypeIds).toContain('large-box')
  expect(packageTypeIds).toContain('custom')
  
  const countryCodes = data.countries.map((c: { code: string }) => c.code)
  expect(countryCodes).toContain('US')
  expect(countryCodes).toContain('CA')
  expect(countryCodes).toContain('MX')
  
  expect(data.metadata.version).toBeDefined()
  expect(data.metadata.supportedCountries).toContain('US')
})

test('Gate 3: Package Configuration section renders correctly', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  await expect(page.getByRole('heading', { name: /Package Configuration/i })).toBeVisible()
  await expect(page.getByLabel(/Actual Weight/i)).toBeVisible()
  await expect(page.getByLabel(/Length \(in\)/i)).toBeVisible()
  await expect(page.getByLabel(/Width \(in\)/i)).toBeVisible()
  await expect(page.getByLabel(/Height \(in\)/i)).toBeVisible()
  await expect(page.getByLabel(/Declared Value/i)).toBeVisible()
  
  await page.getByRole('button', { name: /Small Box/i }).click()
  await page.getByLabel(/Length \(in\)/i).fill('12')
  await page.getByLabel(/Width \(in\)/i).fill('10')
  await page.getByLabel(/Height \(in\)/i).fill('8')
  await page.getByLabel(/Actual Weight/i).fill('5.5')
  await page.getByLabel(/Declared Value/i).fill('100')
  
  await expect(page.getByLabel(/Actual Weight/i)).toHaveValue('5.5')
  await expect(page.getByLabel(/Length \(in\)/i)).toHaveValue('12')
  await expect(page.getByLabel(/Declared Value/i)).toHaveValue('100')
})

test('Gate 3: Special Handling and Delivery Preferences section renders', async ({ page }) => {
  await completePriorSteps(page, { through: 1 })
  
  await expect(page.getByRole('heading', { name: /Special Handling & Delivery/i })).toBeVisible()
  await expect(page.getByText(/Special Handling Options/i).first()).toBeVisible()
  await expect(page.getByText(/Delivery Preferences/i).first()).toBeVisible()
  await expect(page.getByText(/Summary/i).first()).toBeVisible()
  
  // Verify special handling options exist by text
  await expect(page.getByText(/Fragile/i).first()).toBeVisible()
  await expect(page.getByText(/\+\$4\.99/i)).toBeVisible()
  await expect(page.getByText(/Temperature Controlled/i).first()).toBeVisible()
  
  // Verify delivery preferences options exist by text
  await expect(page.getByText(/Signature Required/i).first()).toBeVisible()
  await expect(page.getByText(/\+\$3\.99/i)).toBeVisible()
  await expect(page.getByText(/Saturday Delivery/i).first()).toBeVisible()
})

test('Gate 3: Complete Step 1 form submission creates shipment', async ({ page }) => {
  await completePriorSteps(page, { through: 3 })
  
  await page.waitForTimeout(500)
  
  await page.getByRole('button', { name: /Continue to Rates/i }).click()
  
  await expect(page).toHaveURL(/\/shipments\/[^/]+\/rates/, { timeout: 10000 })
  
  const url = page.url()
  expect(url).toMatch(/\/shipments\/[a-zA-Z0-9-]+\/rates/)
})
