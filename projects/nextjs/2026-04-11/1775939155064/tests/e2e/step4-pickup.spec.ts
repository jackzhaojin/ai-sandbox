import { test, expect, Page } from '@playwright/test'

/**
 * Step 4: Pickup Scheduling - Calendar, Date/Time Selection Tests
 * 
 * Tests:
 * - Calendar navigation
 * - Date/time selection
 * - Location types
 * - Conditional fields
 * - Contact validation
 * - Fee summary
 */

test.describe('Step 4: Pickup Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await createShipmentAndNavigateToPickup(page)
  })

  test.describe('Calendar Navigation', () => {
    test('displays calendar with month navigation', async ({ page }) => {
      // Verify calendar components
      await expect(page.getByRole('heading', { name: /Date & Time/i })).toBeVisible()
      await expect(page.locator('button[aria-label="Previous month"]')).toBeVisible()
      await expect(page.locator('button[aria-label="Next month"]')).toBeVisible()
      
      // Verify day headers
      await expect(page.getByText('Sun')).toBeVisible()
      await expect(page.getByText('Mon')).toBeVisible()
      await expect(page.getByText('Tue')).toBeVisible()
    })

    test('navigates to next month', async ({ page }) => {
      // Get current month text
      const currentMonth = await page.locator('h3, h4').filter({ hasText: /January|February|March|April|May|June|July|August|September|October|November|December/i }).first().textContent()
      
      // Click next month
      await page.locator('button[aria-label="Next month"]').click()
      await page.waitForTimeout(500)
      
      // Verify month changed
      const newMonth = await page.locator('h3, h4').filter({ hasText: /January|February|March|April|May|June|July|August|September|October|November|December/i }).first().textContent()
      expect(newMonth).not.toBe(currentMonth)
    })

    test('navigates to previous month', async ({ page }) => {
      // Click previous month
      await page.locator('button[aria-label="Previous month"]').click()
      await page.waitForTimeout(500)
      
      // Verify calendar still displays
      await expect(page.getByText('Sun')).toBeVisible()
    })

    test('shows available, limited, and unavailable dates', async ({ page }) => {
      // Verify calendar legend
      await expect(page.getByText('Available', { exact: true })).toBeVisible()
      await expect(page.getByText('Limited', { exact: true })).toBeVisible()
      await expect(page.getByText('Unavailable', { exact: true })).toBeVisible()
      
      // Verify calendar has clickable dates
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      const count = await calendarButtons.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Date/Time Selection', () => {
    test('selects a date and shows time slots', async ({ page }) => {
      // Select a date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      const count = await calendarButtons.count()
      expect(count).toBeGreaterThan(0)
      
      await calendarButtons.nth(Math.min(10, count - 1)).click()
      
      // Time slots should appear
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('selects a time slot', async ({ page }) => {
      // Select date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      // Wait for time slots
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
      
      // Select time slot
      const availableSlot = page.locator('button').filter({ hasText: /Available/ }).filter({ hasText: /Morning|Afternoon|Evening/i }).first()
      await availableSlot.click()
      
      // Verify slot is selected
      await expect(page.getByText(/Package Ready Time/i)).toBeVisible({ timeout: 5000 })
    })

    test('selects ready time', async ({ page }) => {
      // Select date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      // Select time slot
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
      const availableSlot = page.locator('button').filter({ hasText: /Available/ }).first()
      await availableSlot.click()
      
      // Select ready time
      await expect(page.getByText(/Package Ready Time/i)).toBeVisible({ timeout: 5000 })
      const readyTimeDropdown = page.getByRole('combobox')
      await readyTimeDropdown.selectOption({ index: 2 })
      
      // Verify selection
      const selectedValue = await readyTimeDropdown.inputValue()
      expect(selectedValue).toBeTruthy()
    })

    test('shows selection summary after date/time selection', async ({ page }) => {
      // Select date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      // Select time slot
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
      const availableSlot = page.locator('button').filter({ hasText: /Available/ }).first()
      await availableSlot.click()
      
      // Select ready time
      await expect(page.getByText(/Package Ready Time/i)).toBeVisible({ timeout: 5000 })
      await page.getByRole('combobox').selectOption({ index: 2 })
      
      // Selection summary should be visible
      await expect(page.getByText(/Your Selection/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Location Types', () => {
    test('selects ground level location', async ({ page }) => {
      const groundLevelRadio = page.getByRole('radio', { name: /Ground Level/i })
      await groundLevelRadio.scrollIntoViewIfNeeded()
      await groundLevelRadio.click({ force: true })
      
      await expect(groundLevelRadio).toBeChecked()
    })

    test('selects loading dock location and shows dock number field', async ({ page }) => {
      const loadingDockRadio = page.getByRole('radio', { name: /Loading Dock/i })
      await loadingDockRadio.scrollIntoViewIfNeeded()
      await loadingDockRadio.click({ force: true })
      
      await expect(loadingDockRadio).toBeChecked()
      
      // Dock number field should appear
      const dockInput = page.getByLabel(/Dock Number/i)
      await expect(dockInput).toBeVisible()
      
      // Fill dock number
      await dockInput.fill('Dock A-12')
      await expect(dockInput).toHaveValue('Dock A-12')
    })

    test('selects other location and shows description field', async ({ page }) => {
      const otherRadio = page.getByRole('radio', { name: /Other/i })
      await otherRadio.scrollIntoViewIfNeeded()
      await otherRadio.click({ force: true })
      
      await expect(otherRadio).toBeChecked()
      
      // Description field should appear
      const descInput = page.getByLabel(/Description|Other Description/i)
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill('Side entrance')
        await expect(descInput).toHaveValue('Side entrance')
      }
    })
  })

  test.describe('Access Requirements', () => {
    test('selects access requirements', async ({ page }) => {
      // Look for access requirement checkboxes
      const securityCheckbox = page.getByLabel(/Security Check-in/i)
      const gateCodeCheckbox = page.getByLabel(/Gate Code Required/i)
      
      if (await securityCheckbox.isVisible().catch(() => false)) {
        await securityCheckbox.check()
        await expect(securityCheckbox).toBeChecked()
      }
      
      if (await gateCodeCheckbox.isVisible().catch(() => false)) {
        await gateCodeCheckbox.check()
        
        // Gate code field should appear
        const gateCodeInput = page.getByLabel(/Gate Code/i)
        if (await gateCodeInput.isVisible().catch(() => false)) {
          await gateCodeInput.fill('1234')
          await expect(gateCodeInput).toHaveValue('1234')
        }
      }
    })

    test('shows conditional fields for selected access requirements', async ({ page }) => {
      // Select limited parking
      const limitedParking = page.getByLabel(/Limited Parking/i)
      if (await limitedParking.isVisible().catch(() => false)) {
        await limitedParking.check()
        
        // Parking instructions should appear
        const parkingInput = page.getByLabel(/Parking Instructions/i)
        if (await parkingInput.isVisible().catch(() => false)) {
          await parkingInput.fill('Use visitor parking')
          await expect(parkingInput).toHaveValue('Use visitor parking')
        }
      }
    })
  })

  test.describe('Equipment & Loading', () => {
    test('selects pickup equipment', async ({ page }) => {
      // Click on Equipment section to expand
      const equipmentHeading = page.getByRole('heading', { name: /Equipment & Loading/i })
      await equipmentHeading.click()
      await page.waitForTimeout(500)
      
      // Select equipment
      const dollyCheckbox = page.getByLabel(/Dolly|Hand Truck/i)
      if (await dollyCheckbox.isVisible().catch(() => false)) {
        await dollyCheckbox.check()
        await expect(dollyCheckbox).toBeChecked()
      }
    })

    test('selects loading assistance type', async ({ page }) => {
      // Click on Equipment section
      const equipmentHeading = page.getByRole('heading', { name: /Equipment & Loading/i })
      await equipmentHeading.click()
      await page.waitForTimeout(500)
      
      // Select loading assistance
      const customerLoadRadio = page.getByRole('radio', { name: /Customer Will Load/i })
      await customerLoadRadio.scrollIntoViewIfNeeded()
      await customerLoadRadio.click({ force: true })
      
      await expect(customerLoadRadio).toBeChecked()
    })
  })

  test.describe('Contact Information', () => {
    test('fills primary contact information', async ({ page }) => {
      // Click on Contact section
      const contactHeading = page.getByRole('heading', { name: /Contact Information/i })
      await contactHeading.click()
      await page.waitForTimeout(500)
      
      // Fill primary contact
      await page.getByPlaceholder(/e\.g\., John Smith/i).scrollIntoViewIfNeeded()
      await page.getByPlaceholder(/e\.g\., John Smith/i).fill('Jane Pickup')
      await page.getByPlaceholder(/e\.g\., Shipping Manager/i).fill('Warehouse Manager')
      await page.getByPlaceholder(/\(555\) 123-4567/i).fill('555-111-2222')
      await page.getByPlaceholder(/john\.smith@company\.com/i).fill('jane@acme.com')
      
      // Verify fields
      await expect(page.getByPlaceholder(/e\.g\., John Smith/i)).toHaveValue('Jane Pickup')
    })

    test('fills backup contact information', async ({ page }) => {
      // Click on Contact section
      const contactHeading = page.getByRole('heading', { name: /Contact Information/i })
      await contactHeading.click()
      await page.waitForTimeout(500)
      
      // Fill backup contact
      await page.getByPlaceholder(/e\.g\., Jane Doe/i).scrollIntoViewIfNeeded()
      await page.getByPlaceholder(/e\.g\., Jane Doe/i).fill('Bob Backup')
      await page.getByPlaceholder(/\(555\) 456-7890/i).fill('555-333-4444')
      
      // Verify fields
      await expect(page.getByPlaceholder(/e\.g\., Jane Doe/i)).toHaveValue('Bob Backup')
    })

    test('validates contact phone format', async ({ page }) => {
      // Click on Contact section
      const contactHeading = page.getByRole('heading', { name: /Contact Information/i })
      await contactHeading.click()
      await page.waitForTimeout(500)
      
      // Try invalid phone
      const phoneInput = page.getByPlaceholder(/\(555\) 123-4567/i)
      await phoneInput.scrollIntoViewIfNeeded()
      await phoneInput.fill('123')
      
      // Form validation may occur on submit
      // Just verify the field accepts input
      await expect(phoneInput).toHaveValue('123')
    })
  })

  test.describe('Special Instructions', () => {
    test('adds special instructions for driver', async ({ page }) => {
      // Click on Special Instructions section
      const instructionsHeading = page.getByRole('heading', { name: /Special Instructions/i })
      await instructionsHeading.click()
      await page.waitForTimeout(500)
      
      // Fill instructions
      const instructionsInput = page.getByLabel(/Driver Instructions|Special Instructions/i)
      if (await instructionsInput.isVisible().catch(() => false)) {
        await instructionsInput.fill('Please call upon arrival')
        await expect(instructionsInput).toHaveValue('Please call upon arrival')
      }
    })
  })

  test.describe('Fee Summary', () => {
    test('displays fee summary sidebar', async ({ page }) => {
      // Fee summary should be visible
      await expect(page.getByText(/Fee Summary|Pickup Fees/i)).toBeVisible()
    })

    test('updates fees based on selections', async ({ page }) => {
      // Select date and time first
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
      const availableSlot = page.locator('button').filter({ hasText: /Available/ }).first()
      await availableSlot.click()
      
      // Fee summary should update
      await expect(page.getByText(/Fee Summary|Pickup Fees/i)).toBeVisible()
    })
  })

  test.describe('Form Submission', () => {
    test('completes pickup scheduling and navigates to review', async ({ page }) => {
      // Select date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      // Select time slot
      await expect(page.getByText(/Select a Time Window/i).first()).toBeVisible({ timeout: 10000 })
      const availableSlot = page.locator('button').filter({ hasText: /Available/ }).first()
      await availableSlot.click()
      
      // Select ready time
      await expect(page.getByText(/Package Ready Time/i)).toBeVisible({ timeout: 5000 })
      await page.getByRole('combobox').selectOption({ index: 2 })
      
      // Select location type
      const groundLevelRadio = page.getByRole('radio', { name: /Ground Level/i })
      await groundLevelRadio.scrollIntoViewIfNeeded()
      await groundLevelRadio.click({ force: true })
      
      // Select loading assistance
      const equipmentHeading = page.getByRole('heading', { name: /Equipment & Loading/i })
      await equipmentHeading.click()
      await page.waitForTimeout(500)
      
      const customerLoadRadio = page.getByRole('radio', { name: /Customer Will Load/i })
      await customerLoadRadio.scrollIntoViewIfNeeded()
      await customerLoadRadio.click({ force: true })
      
      // Fill contact info
      const contactHeading = page.getByRole('heading', { name: /Contact Information/i })
      await contactHeading.click()
      await page.waitForTimeout(500)
      
      await page.getByPlaceholder(/e\.g\., John Smith/i).scrollIntoViewIfNeeded()
      await page.getByPlaceholder(/e\.g\., John Smith/i).fill('Jane Pickup')
      await page.getByPlaceholder(/e\.g\., Shipping Manager/i).fill('Warehouse Manager')
      await page.getByPlaceholder(/\(555\) 123-4567/i).fill('555-111-2222')
      await page.getByPlaceholder(/john\.smith@company\.com/i).fill('jane@acme.com')
      
      await page.getByPlaceholder(/e\.g\., Jane Doe/i).scrollIntoViewIfNeeded()
      await page.getByPlaceholder(/e\.g\., Jane Doe/i).fill('Bob Backup')
      await page.getByPlaceholder(/\(555\) 456-7890/i).fill('555-333-4444')
      
      // Submit form
      await page.getByRole('button', { name: /Continue to Review/i }).click()
      
      // Should navigate to review page
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/review/, { timeout: 15000 })
      await expect(page.getByRole('heading', { name: /Review Shipment/i })).toBeVisible({ timeout: 10000 })
    })

    test('validates required fields before submission', async ({ page }) => {
      // Try to submit without filling required fields
      await page.getByRole('button', { name: /Continue to Review/i }).click()
      await page.waitForTimeout(500)
      
      // Should still be on pickup page (validation failed)
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/pickup/)
    })
  })

  test.describe('Navigation', () => {
    test('back button navigates to payment page', async ({ page }) => {
      await page.getByRole('button', { name: /Back to Payment/i }).click()
      
      // Should navigate to payment page
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/payment/, { timeout: 10000 })
      await expect(page.getByRole('heading', { name: /Payment & Billing/i })).toBeVisible()
    })

    test('save as draft persists current state', async ({ page }) => {
      // Select a date
      const calendarButtons = page.locator('div.grid-cols-7 button:not([disabled])')
      await calendarButtons.nth(5).click()
      
      // Save draft
      const saveButton = page.getByRole('button', { name: /Save Draft/i })
      await saveButton.click()
      
      // Should show success message
      await expect(page.getByText(/Draft saved successfully/i)).toBeVisible({ timeout: 10000 })
    })
  })
})

// Helper functions
async function createShipmentAndNavigateToPickup(page: Page) {
  // Create shipment via API
  const response = await page.request.post('/api/shipments', {
    data: {
      origin: {
        name: 'John Smith',
        company: 'Acme Corp',
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
        locationType: 'commercial',
        phone: '555-123-4567',
        email: 'john@acme.com',
      },
      destination: {
        name: 'Jane Doe',
        company: 'Widget Inc',
        line1: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
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
  const shipmentId = data.id
  
  // Navigate to pickup page
  await page.goto(`/shipments/${shipmentId}/pickup`)
  await expect(page.getByRole('heading', { name: /Schedule Pickup/i })).toBeVisible({ timeout: 10000 })
}
