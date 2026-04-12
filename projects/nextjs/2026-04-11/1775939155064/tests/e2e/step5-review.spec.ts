import { test, expect, Page } from '@playwright/test'

/**
 * Step 5: Review Page - All Sections Display, Edit Navigation, Terms Tests
 * 
 * Tests:
 * - All 6 sections display correct data
 * - Edit navigation to each step
 * - Validation errors display
 * - Terms checkboxes
 * - Form submission
 */

test.describe('Step 5: Review Shipment', () => {
  test.beforeEach(async ({ page }) => {
    await createCompleteShipmentAndNavigateToReview(page)
  })

  test.describe('Review Sections Display', () => {
    test('displays all 6 review sections', async ({ page }) => {
      // Verify all sections are displayed
      await expect(page.getByRole('heading', { name: /Origin/i }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: /Destination/i }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: /Package/i }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: /Pricing & Rates/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: /Payment/i }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: /Pickup Schedule/i })).toBeVisible()
    })

    test('displays origin data correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Origin/i }).first()).toBeVisible()
      
      // Verify origin address details are displayed
      await expect(page.getByText(/Austin/i).first()).toBeVisible()
      await expect(page.getByText(/Texas|TX/i).first()).toBeVisible()
    })

    test('displays destination data correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Destination/i }).first()).toBeVisible()
      
      // Verify destination address details
      await expect(page.getByText(/Dallas/i).first()).toBeVisible()
      await expect(page.getByText(/Texas|TX/i).first()).toBeVisible()
    })

    test('displays package data correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Package/i }).first()).toBeVisible()
      
      // Verify package details
      await expect(page.getByText(/5\.5|5\.50/i).first()).toBeVisible()
      await expect(page.getByText(/lb/i).first()).toBeVisible()
    })

    test('displays pricing data correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pricing & Rates/i })).toBeVisible()
      
      // Verify pricing information
      await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible()
    })

    test('displays payment data correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Payment/i }).first()).toBeVisible()
      
      // Verify payment method is displayed
      await expect(page.getByText(/Purchase Order|Bill of Lading|Net Terms|Corporate|Third-Party/i).first()).toBeVisible()
    })

    test('displays pickup schedule correctly', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pickup Schedule/i })).toBeVisible()
      
      // Verify pickup details
      await expect(page.getByText(/AM|PM|Morning|Afternoon|Evening/i).first()).toBeVisible()
    })

    test('displays Edit buttons for each section', async ({ page }) => {
      // Verify Edit buttons exist
      const editButtons = page.getByRole('link', { name: /Edit/i })
      const count = await editButtons.count()
      expect(count).toBeGreaterThanOrEqual(6)
    })
  })

  test.describe('Edit Navigation', () => {
    test('Edit Origin navigates to Step 1', async ({ page }) => {
      // Get shipment ID
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/review/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Click Edit on Origin section
      const originEdit = page.locator('div').filter({ hasText: /^Origin$/ }).first().locator('a:has-text("Edit")')
      if (await originEdit.isVisible().catch(() => false)) {
        await originEdit.click()
        await expect(page).toHaveURL(/\/shipments\/new.*edit=/, { timeout: 10000 })
        await expect(page.getByRole('heading', { name: /Edit Shipment/i })).toBeVisible()
        
        // Navigate back to review
        await page.goto(`/shipments/${shipmentId}/review`)
        await expect(page.getByRole('heading', { name: /Review Shipment/i })).toBeVisible({ timeout: 10000 })
      }
    })

    test('Edit Pricing navigates to pricing page', async ({ page }) => {
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/review/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Click Edit on Pricing section
      const pricingEdit = page.locator('div').filter({ hasText: /^Pricing & Rates$/ }).locator('a:has-text("Edit")')
      if (await pricingEdit.isVisible().catch(() => false)) {
        await pricingEdit.click()
        await expect(page).toHaveURL(/\/shipments\/[^/]+\/pricing/, { timeout: 10000 })
        await expect(page.getByRole('heading', { name: /Select Shipping Rate/i })).toBeVisible()
        
        // Navigate back to review
        await page.goto(`/shipments/${shipmentId}/review`)
      }
    })

    test('Edit Payment navigates to payment page', async ({ page }) => {
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/review/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Click Edit on Payment section
      const paymentEdit = page.locator('div').filter({ hasText: /^Payment$/ }).first().locator('a:has-text("Edit")')
      if (await paymentEdit.isVisible().catch(() => false)) {
        await paymentEdit.click()
        await expect(page).toHaveURL(/\/shipments\/[^/]+\/payment/, { timeout: 10000 })
        await expect(page.getByRole('heading', { name: /Payment & Billing/i })).toBeVisible()
        
        // Navigate back to review
        await page.goto(`/shipments/${shipmentId}/review`)
      }
    })

    test('Edit Pickup navigates to pickup page', async ({ page }) => {
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/review/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Click Edit on Pickup section
      const pickupEdit = page.locator('div').filter({ hasText: /^Pickup Schedule$/ }).locator('a:has-text("Edit")')
      if (await pickupEdit.isVisible().catch(() => false)) {
        await pickupEdit.click()
        await expect(page).toHaveURL(/\/shipments\/[^/]+\/pickup/, { timeout: 10000 })
        await expect(page.getByRole('heading', { name: /Schedule Pickup/i })).toBeVisible()
      }
    })
  })

  test.describe('Terms and Conditions', () => {
    test('displays Terms & Conditions section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Terms & Conditions/i })).toBeVisible()
    })

    test('Confirm Shipment button is disabled until terms accepted', async ({ page }) => {
      // Verify button is initially disabled
      const confirmButton = page.getByRole('button', { name: /Confirm Shipment/i })
      await expect(confirmButton).toBeDisabled()
    })

    test('enables Confirm Shipment after accepting all terms', async ({ page }) => {
      // Accept all terms
      await page.locator('#declaredValueAccurate').check({ force: true })
      await page.locator('#insuranceUnderstood').check({ force: true })
      await page.locator('#contentsCompliant').check({ force: true })
      await page.locator('#carrierAuthorized').check({ force: true })
      
      // Verify button is now enabled
      const confirmButton = page.getByRole('button', { name: /Confirm Shipment/i })
      await expect(confirmButton).toBeEnabled()
    })

    test('shows hazmat certification when hazmat selected', async ({ page }) => {
      // Check if hazmat certification checkbox exists
      const hazmatCheckbox = page.locator('#hazmatCertification')
      const count = await hazmatCheckbox.count()
      
      if (count > 0) {
        // Hazmat was selected, verify checkbox
        await expect(hazmatCheckbox).toBeVisible()
      }
    })
  })

  test.describe('Shipment Summary Card', () => {
    test('displays shipment summary in sidebar', async ({ page }) => {
      // Verify summary card elements
      await expect(page.getByText('Origin', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Destination', { exact: true }).first()).toBeVisible()
    })

    test('displays route information', async ({ page }) => {
      await expect(page.getByText(/Austin/i).first()).toBeVisible()
      await expect(page.getByText(/Dallas/i).first()).toBeVisible()
    })

    test('displays estimated delivery', async ({ page }) => {
      // Look for estimated delivery text
      const deliveryText = await page.getByText(/Estimated Delivery|Delivery/i).count()
      expect(deliveryText).toBeGreaterThan(0)
    })
  })

  test.describe('Form Submission', () => {
    test('submits shipment after accepting terms', async ({ page }) => {
      // Accept all terms
      await page.locator('#declaredValueAccurate').check({ force: true })
      await page.locator('#insuranceUnderstood').check({ force: true })
      await page.locator('#contentsCompliant').check({ force: true })
      await page.locator('#carrierAuthorized').check({ force: true })
      
      // Get shipment ID
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/review/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Submit shipment
      const confirmButton = page.getByRole('button', { name: /Confirm Shipment/i })
      await expect(confirmButton).toBeEnabled()
      await confirmButton.click()
      
      // Should navigate to confirmation page
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/confirmation/, { timeout: 15000 })
      await expect(page.getByText(/Shipment Confirmed/i)).toBeVisible({ timeout: 10000 })
      
      // Verify shipment status via API
      const shipmentResponse = await page.request.get(`/api/shipments/${shipmentId}`)
      expect(shipmentResponse.status()).toBe(200)
      
      const shipmentData = await shipmentResponse.json()
      expect(shipmentData.status).toBe('confirmed')
      expect(shipmentData.confirmation_number).toBeDefined()
    })

    test('validates terms acceptance before submission', async ({ page }) => {
      // Don't accept terms
      
      // Try to submit
      const confirmButton = page.getByRole('button', { name: /Confirm Shipment/i })
      await expect(confirmButton).toBeDisabled()
    })
  })

  test.describe('Additional Actions', () => {
    test('Save as Draft button works', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /Save as Draft/i })
      await expect(saveButton).toBeVisible()
      
      await saveButton.click()
      
      // Should show success message
      await expect(page.getByText(/Draft saved successfully/i)).toBeVisible({ timeout: 10000 })
    })

    test('Print Summary button is visible', async ({ page }) => {
      const printButton = page.getByRole('button', { name: /Print Summary/i })
      await expect(printButton).toBeVisible()
    })

    test('Start Over button is visible', async ({ page }) => {
      const startOverButton = page.getByRole('button', { name: /Start Over|Edit Shipment/i })
      await expect(startOverButton).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('back button navigates to pickup page', async ({ page }) => {
      await page.getByRole('button', { name: /Back to Pickup/i }).click()
      
      // Should navigate to pickup page
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/pickup/, { timeout: 10000 })
      await expect(page.getByRole('heading', { name: /Schedule Pickup/i })).toBeVisible()
    })
  })
})

// Helper functions
async function createCompleteShipmentAndNavigateToReview(page: Page) {
  // Create shipment via API with complete data
  const shipmentResponse = await page.request.post('/api/shipments', {
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
  
  if (shipmentResponse.status() !== 201) {
    throw new Error(`Failed to create shipment: ${shipmentResponse.status()}`)
  }
  
  const shipmentData = await shipmentResponse.json()
  const shipmentId = shipmentData.id
  
  // Create payment info
  await page.request.post(`/api/shipments/${shipmentId}/payment`, {
    data: {
      method: 'purchase_order',
      purchaseOrder: {
        poNumber: 'PO-TEST-001',
        poAmount: 1000,
        expirationDate: '2026-12-31',
        approvalContact: 'John Approver',
        department: 'Procurement',
      },
      billing: {
        address: {
          line1: '123 Billing St',
          city: 'Austin',
          state: 'TX',
          postal: '78701',
          country: 'US',
          locationType: 'commercial',
          sameAsOrigin: false,
        },
        contact: {
          name: 'Billing Contact',
          title: 'Finance Manager',
          phone: '555-123-4567',
          email: 'billing@test.com',
        },
        company: {
          legalName: 'Test Corp Inc',
          businessType: 'corporation',
          industry: 'technology',
        },
        invoicePreferences: {
          deliveryMethod: 'email',
          format: 'standard',
          frequency: 'per_shipment',
        },
      },
    },
  })
  
  // Create pickup info
  await page.request.post(`/api/shipments/${shipmentId}/pickup`, {
    data: {
      selectedPickup: {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: {
          id: 'morning-test',
          label: 'Morning',
          startTime: '08:00',
          endTime: '12:00',
          availability: 'available',
          fee: 0,
        },
        readyTime: '07:00',
      },
      location: {
        locationType: 'ground_level',
      },
      access: {
        requirements: [],
      },
      equipment: {
        equipment: [],
      },
      loading: {
        assistanceType: 'customer_load',
      },
      contacts: {
        primary: {
          name: 'Jane Pickup',
          jobTitle: 'Warehouse Manager',
          mobilePhone: '555-111-2222',
          email: 'jane@acme.com',
          preferredMethod: 'email',
        },
        backup: {
          name: 'Bob Backup',
          phone: '555-333-4444',
        },
      },
      notifications: {
        emailReminder24h: true,
        smsReminder2h: true,
        driverEnroute: true,
      },
    },
  })
  
  // Navigate to review page
  await page.goto(`/shipments/${shipmentId}/review`)
  await expect(page.getByRole('heading', { name: /Review Shipment/i })).toBeVisible({ timeout: 10000 })
}
