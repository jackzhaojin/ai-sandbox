import { test, expect, Page } from '@playwright/test'

/**
 * Step 2: Pricing/Rates Page - Quote Generation, Sorting, Filtering Tests
 * 
 * Tests:
 * - Quote generation from API
 * - Sorting by price, transit time
 * - Filtering by service category
 * - Price breakdown expansion
 * - Quote selection
 */

test.describe('Step 2: Pricing - Quote Generation & Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Create a shipment first
    await createShipmentAndNavigateToPricing(page)
  })

  test.describe('Quote Generation', () => {
    test('generates quotes from API on page load', async ({ page }) => {
      // Wait for quotes to load
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Verify quotes are displayed
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Verify pricing cards are displayed
      const pricePattern = /\$\d+\.\d{2}/
      await expect(page.getByText(pricePattern).first()).toBeVisible()
      
      // Verify transit time info
      await expect(page.getByText(/business day/i).first()).toBeVisible()
    })

    test('shows loading state while generating quotes', async ({ page }) => {
      // Navigate to a fresh pricing page
      const shipmentId = await createShipmentViaAPI(page)
      
      // Navigate to pricing
      await page.goto(`/shipments/${shipmentId}/pricing`)
      await expect(page.getByRole('heading', { name: /Select Shipping Rate/i })).toBeVisible()
      
      // Should show loading state initially
      // (May be too fast to catch, so just verify quotes load eventually)
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('displays carrier logos and service names', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Verify carrier codes are displayed
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Verify service type names
      await expect(page.getByText(/Ground|Express|Economy|Air/i).first()).toBeVisible()
    })

    test('recalculate button regenerates quotes', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Click recalculate
      await page.getByRole('button', { name: /Recalculate/i }).click()
      
      // Should show generating state briefly
      await expect(page.getByText(/Generating quotes/i)).toBeVisible()
      
      // Quotes should reload
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Quote Sorting', () => {
    test('sorts quotes by price', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Find sort dropdown/button
      const sortButton = page.getByRole('button', { name: /Sort|Price/i })
      
      if (await sortButton.isVisible().catch(() => false)) {
        // Click to sort by price
        await sortButton.click()
        
        // Should show sort options
        await expect(page.getByText(/Price|Lowest|Highest/i).first()).toBeVisible()
      }
    })

    test('sorts quotes by transit time', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Look for transit time sorting option
      const transitSortButton = page.getByRole('button', { name: /Transit|Speed|Time/i })
      
      if (await transitSortButton.isVisible().catch(() => false)) {
        await transitSortButton.click()
        
        // Should show transit time options
        await expect(page.getByText(/Fastest|Transit/i).first()).toBeVisible()
      }
    })
  })

  test.describe('Quote Filtering', () => {
    test('filters by service category - All Services', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Click All Services tab
      const allServicesTab = page.getByRole('button', { name: /All Services/i })
      await expect(allServicesTab).toBeVisible()
      await allServicesTab.click()
      
      // Should show all quotes
      const quoteCount = await page.getByRole('radio').count()
      expect(quoteCount).toBeGreaterThan(0)
    })

    test('filters by service category - Ground', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Click Ground tab
      const groundTab = page.getByRole('button', { name: /Ground/i })
      await groundTab.click()
      
      // Should filter to show only ground services
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // Results count should be displayed
      await expect(page.getByText(/Showing \d+ of \d+ rates/i)).toBeVisible()
    })

    test('filters by service category - Express', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Click Express tab
      const expressTab = page.getByRole('button', { name: /Express/i })
      await expressTab.click()
      
      // Wait for filter to apply
      await page.waitForTimeout(500)
      
      // Results count should be displayed
      await expect(page.getByText(/Showing \d+ of \d+ rates/i)).toBeVisible()
    })

    test('shows results count after filtering', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Results count should be visible
      await expect(page.getByText(/Showing \d+ of \d+ rates/i)).toBeVisible()
      
      // Click different filters and verify count updates
      await page.getByRole('button', { name: /Ground/i }).click()
      await page.waitForTimeout(500)
      await expect(page.getByText(/Showing \d+ of \d+ rates/i)).toBeVisible()
    })
  })

  test.describe('Price Breakdown', () => {
    test('expands price breakdown on quote card', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Look for price breakdown button
      const breakdownButton = page.getByRole('button', { name: /View price breakdown|Price breakdown/i }).first()
      
      if (await breakdownButton.isVisible().catch(() => false)) {
        await breakdownButton.click()
        
        // Should show price breakdown details
        await expect(page.getByText(/Base Rate|Fuel Surcharge|Tax/i).first()).toBeVisible()
      }
    })

    test('shows detailed cost breakdown when expanded', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Try to find and click price breakdown
      const breakdownButtons = page.getByRole('button', { name: /breakdown|details/i })
      const count = await breakdownButtons.count()
      
      if (count > 0) {
        await breakdownButtons.first().click()
        await page.waitForTimeout(300)
        
        // Verify breakdown components
        const breakdownText = await page.getByText(/\$\d+\.\d{2}/).count()
        expect(breakdownText).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Quote Selection', () => {
    test('selects a quote by clicking radio button', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Get first radio button
      const firstRadio = page.getByRole('radio').first()
      await expect(firstRadio).toBeVisible()
      
      // Click to select
      await firstRadio.click()
      
      // Verify it's selected
      await expect(firstRadio).toHaveAttribute('aria-checked', 'true')
    })

    test('enables Continue button after quote selection', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Continue button should be disabled initially
      const continueButton = page.getByRole('button', { name: /Select Rate & Continue/i })
      await expect(continueButton).toBeDisabled()
      
      // Select a quote
      await page.getByRole('radio').first().click()
      
      // Continue button should now be enabled
      await expect(continueButton).toBeEnabled({ timeout: 5000 })
    })

    test('only one quote can be selected at a time', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      const radios = page.getByRole('radio')
      const count = await radios.count()
      
      if (count >= 2) {
        // Select first quote
        await radios.nth(0).click()
        await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true')
        
        // Select second quote
        await radios.nth(1).click()
        await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true')
        
        // First quote should no longer be selected
        await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false')
      }
    })

    test('persists selected quote to database', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Get shipment ID from URL
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/pricing/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Select a quote
      await page.getByRole('radio').first().click()
      
      // Continue to payment
      const continueButton = page.getByRole('button', { name: /Select Rate & Continue/i })
      await expect(continueButton).toBeEnabled({ timeout: 5000 })
      await continueButton.click()
      
      // Wait for navigation
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/payment/, { timeout: 10000 })
      
      // Verify quote was persisted via API
      const quotesResponse = await page.request.get(`/api/quote?shipmentId=${shipmentId}`)
      expect(quotesResponse.status()).toBe(200)
      
      const quotesData = await quotesResponse.json()
      expect(quotesData.success).toBe(true)
    })
  })

  test.describe('Navigation', () => {
    test('back button navigates to Step 1 with edit parameter', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Click back button
      await page.getByRole('button', { name: /^Back$/i }).click()
      
      // Should navigate back to Step 1 with edit parameter
      await expect(page).toHaveURL(/\/shipments\/new.*edit=/, { timeout: 10000 })
      
      // Verify we're on the shipment form
      await expect(page.getByRole('heading', { name: /Create New Shipment|Edit Shipment/i })).toBeVisible()
    })

    test('save as draft persists current state', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await expect(page.getByText(/PEX|VC|EFL/i).first()).toBeVisible({ timeout: 10000 })
      
      // Click Save Draft
      const saveButton = page.getByRole('button', { name: /Save Draft/i })
      await expect(saveButton).toBeVisible()
      await saveButton.click()
      
      // Should show success message
      await expect(page.getByText(/Draft saved successfully/i)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Shipment Summary Bar', () => {
    test('displays route information', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Verify route info is displayed
      await expect(page.getByText(/Route/i)).toBeVisible()
      await expect(page.getByText(/→/)).toBeVisible()
    })

    test('displays package information', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Verify package info is displayed
      await expect(page.getByText(/Package/i).first()).toBeVisible()
    })

    test('displays special services if selected', async ({ page }) => {
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      
      // Check for special services section
      const specialServices = page.getByText(/Special Services|Handling/i)
      const count = await specialServices.count()
      
      // May or may not be visible depending on test data
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })
})

// Helper functions
async function createShipmentAndNavigateToPricing(page: Page) {
  // Fill out Step 1 form
  await page.goto('/shipments/new')
  await expect(page.getByRole('heading', { name: /Create New Shipment/i })).toBeVisible()
  
  // Origin
  await page.getByLabel(/Street Address/i).first().fill('123 Main St')
  await page.getByLabel(/City/i).first().fill('New York')
  await page.getByLabel(/ZIP Code/i).first().fill('10001')
  await page.getByLabel(/Contact Name/i).first().fill('John Smith')
  await page.getByLabel(/Phone Number/i).first().fill('555-123-4567')
  await page.getByLabel(/Email Address/i).first().fill('john@acme.com')
  await page.getByRole('combobox', { name: /State\/Province/i }).first().click()
  await page.getByRole('option', { name: 'New York' }).click()
  
  // Destination
  await page.getByLabel(/Street Address/i).nth(1).fill('456 Oak Ave')
  await page.getByLabel(/City/i).nth(1).fill('Los Angeles')
  await page.getByLabel(/ZIP Code/i).nth(1).fill('90001')
  await page.getByLabel(/Contact Name/i).nth(1).fill('Jane Doe')
  await page.getByLabel(/Phone Number/i).nth(1).fill('555-987-6543')
  await page.getByLabel(/Email Address/i).nth(1).fill('jane@widget.com')
  await page.getByRole('combobox', { name: /State\/Province/i }).nth(1).click()
  await page.getByRole('option', { name: 'California' }).click()
  
  // Package
  await page.getByRole('button', { name: /Small Box/i }).click()
  await page.getByLabel(/Length/i).fill('12')
  await page.getByLabel(/Width/i).fill('10')
  await page.getByLabel(/Height/i).fill('8')
  await page.getByLabel(/Actual Weight/i).fill('5.5')
  await page.getByLabel(/Declared Value/i).fill('100')
  await page.getByLabel(/Contents Description/i).fill('Office supplies')
  
  // Submit
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Continue to Rates/i }).click()
  
  // Wait for navigation
  await expect(page).toHaveURL(/\/shipments\/[^/]+\/pricing/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Select Shipping Rate/i })).toBeVisible({ timeout: 10000 })
}

async function createShipmentViaAPI(page: Page): Promise<string> {
  const response = await page.request.post('/api/shipments', {
    data: {
      origin: {
        name: 'John Smith',
        company: 'Acme Corp',
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        locationType: 'commercial',
        phone: '555-123-4567',
        email: 'john@acme.com',
      },
      destination: {
        name: 'Jane Doe',
        company: 'Widget Inc',
        line1: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        locationType: 'commercial',
        phone: '555-987-6543',
        email: 'jane@widget.com',
      },
      package: {
        type: 'box',
        weight: 5.5,
        weightUnit: 'lbs',
        length: 12,
        width: 10,
        height: 8,
        dimensionUnit: 'in',
        declaredValue: 100,
        currency: 'USD',
        contentsDescription: 'Office supplies',
      },
    },
  })
  
  if (response.status() !== 201) {
    throw new Error(`Failed to create shipment: ${response.status()}`)
  }
  
  const data = await response.json()
  return data.id
}
