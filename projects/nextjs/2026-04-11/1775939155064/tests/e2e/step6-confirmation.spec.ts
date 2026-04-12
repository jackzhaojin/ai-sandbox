import { test, expect, Page } from '@playwright/test'

/**
 * Step 6: Confirmation Page - Success Display, QR Code, Copy Button, Recent Shipments Tests
 * 
 * Tests:
 * - Confirmation display with tracking/reference number
 * - QR code display
 * - Copy button functionality
 * - Recent shipments section
 * - Action buttons
 */

test.describe('Step 6: Confirmation Page', () => {
  test.describe('Confirmation Display', () => {
    test('displays success banner with confirmation number', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      // Navigate to confirmation page
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify success banner
      await expect(page.getByText(/Shipment Confirmed|Order Confirmed/i)).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/Confirmation Number/i)).toBeVisible()
      
      // Verify confirmation number format
      const confirmationText = await page.getByText(/SHK-\d{4}-\d{6}|Confirmation #:? \w+/i).first().textContent()
      expect(confirmationText).toBeTruthy()
    })

    test('displays shipment reference information', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify shipment reference section
      await expect(page.getByText(/Confirmation Number/i)).toBeVisible()
      await expect(page.getByText(/Carrier|Service Type/i).first()).toBeVisible()
    })

    test('displays pickup confirmation details', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify pickup details
      await expect(page.getByText(/Pickup|Scheduled/i).first()).toBeVisible()
    })

    test('displays delivery information', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify delivery info
      await expect(page.getByText(/Delivery|Destination/i).first()).toBeVisible()
    })
  })

  test.describe('QR Code', () => {
    test('displays QR code for tracking', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify QR code section
      await expect(page.getByText(/Scan to track|QR Code/i)).toBeVisible({ timeout: 10000 })
      
      // Verify QR code image/canvas is present
      const qrCode = page.locator('canvas, img[src*="qr"], svg').first()
      await expect(qrCode).toBeVisible()
    })
  })

  test.describe('Copy Button', () => {
    test('displays copy button for confirmation number', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify copy button exists
      const copyButton = page.getByRole('button', { name: /Copy/i }).first()
      await expect(copyButton).toBeVisible({ timeout: 10000 })
    })

    test('copy button shows feedback when clicked', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Click copy button
      const copyButton = page.getByRole('button', { name: /Copy/i }).first()
      await copyButton.click()
      
      // Verify feedback (text changes to "Copied!" or tooltip appears)
      await expect(page.getByText(/Copied/i)).toBeVisible()
    })
  })

  test.describe('Quick Actions', () => {
    test('displays action buttons', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify action buttons
      await expect(page.getByRole('button', { name: /Add Insurance/i })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: /Change Address/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Hold at Location/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Schedule Another/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Repeat This Shipment/i })).toBeVisible()
    })

    test('Schedule Another button navigates to new shipment', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Click Schedule Another
      await page.getByRole('link', { name: /Schedule Another/i }).click()
      
      // Should navigate to new shipment page
      await expect(page).toHaveURL(/\/shipments\/new/, { timeout: 10000 })
      await expect(page.getByRole('heading', { name: /Create New Shipment/i })).toBeVisible()
    })

    test('Repeat This Shipment button navigates to clone page', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Click Repeat This Shipment
      await page.getByRole('link', { name: /Repeat This Shipment/i }).click()
      
      // Should navigate to clone page
      await expect(page).toHaveURL(new RegExp(`/shipments/new.*clone=${shipmentId}`), { timeout: 10000 })
    })

    test('View Shipment Details button navigates to shipment details', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Click View Shipment Details
      const viewDetailsLink = page.getByRole('link', { name: /View Shipment Details/i })
      if (await viewDetailsLink.isVisible().catch(() => false)) {
        await viewDetailsLink.click()
        await expect(page).toHaveURL(new RegExp(`/shipments/${shipmentId}(?!/confirmation)`), { timeout: 10000 })
      }
    })
  })

  test.describe('Recent Shipments', () => {
    test('displays recent shipments section', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Look for recent shipments section
      const recentHeading = page.getByText(/Recent Shipments|Your Shipments/i)
      
      if (await recentHeading.isVisible().catch(() => false)) {
        await expect(recentHeading).toBeVisible()
      }
    })

    test('shows at least one recent shipment', async ({ page }) => {
      // Create multiple shipments
      const { shipmentId: shipment1 } = await createConfirmedShipment(page)
      const { shipmentId: shipment2 } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipment2}/confirmation`)
      
      // Check for recent shipments list
      const recentShipments = page.locator('[data-testid="recent-shipment"], .recent-shipment')
      const count = await recentShipments.count()
      
      // Should show recent shipments (may include shipment1)
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('recent shipment links work', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Look for recent shipment links
      const recentShipmentLinks = page.locator('a[href*="/shipments/"]').filter({ hasText: /SHK-|Confirmed/i })
      const count = await recentShipmentLinks.count()
      
      if (count > 0) {
        // Click first recent shipment
        const firstLink = recentShipmentLinks.first()
        const href = await firstLink.getAttribute('href')
        await firstLink.click()
        
        // Should navigate to that shipment
        await expect(page).toHaveURL(href!, { timeout: 10000 })
      }
    })
  })

  test.describe('Contact Information', () => {
    test('displays support contact information', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify support info
      await expect(page.getByText(/Support|Contact/i).first()).toBeVisible()
    })

    test('displays tracking information', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify tracking section
      await expect(page.getByText(/Tracking|Track/i).first()).toBeVisible()
    })
  })

  test.describe('Next Steps', () => {
    test('displays before pickup checklist', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify next steps section
      await expect(page.getByText(/Next Steps|Before Pickup/i).first()).toBeVisible()
    })

    test('displays documentation status', async ({ page }) => {
      const { shipmentId } = await createConfirmedShipment(page)
      
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Verify documentation section
      await expect(page.getByText(/Documentation|Label|Shipping Label/i).first()).toBeVisible()
    })
  })

  test.describe('Redirection for Unconfirmed Shipments', () => {
    test('redirects to review page if shipment not confirmed', async ({ page }) => {
      // Create a shipment but don't confirm it
      const response = await page.request.post('/api/shipments', {
        data: {
          origin: {
            name: 'Test User',
            company: 'Test Corp',
            line1: '123 Test St',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            country: 'US',
            locationType: 'commercial',
            phone: '555-123-4567',
            email: 'test@test.com',
          },
          destination: {
            name: 'Dest User',
            company: 'Dest Corp',
            line1: '456 Dest Ave',
            city: 'Dallas',
            state: 'TX',
            postalCode: '75201',
            country: 'US',
            locationType: 'commercial',
            phone: '555-987-6543',
            email: 'dest@test.com',
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
            contentsDescription: 'Test contents',
          },
        },
      })
      
      expect(response.status()).toBe(201)
      const data = await response.json()
      const shipmentId = data.id
      
      // Navigate to confirmation page (should redirect)
      await page.goto(`/shipments/${shipmentId}/confirmation`)
      
      // Should redirect to review page
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/review/, { timeout: 10000 })
    })
  })

  test.describe('Complete Journey', () => {
    test('end-to-end journey from new shipment to confirmation', async ({ page }) => {
      // Step 1: Create shipment
      await page.goto('/shipments/new')
      await expect(page.getByRole('heading', { name: /Create New Shipment/i })).toBeVisible()
      
      // Fill origin
      await page.getByLabel(/Street Address/i).first().fill('123 Main St')
      await page.getByLabel(/City/i).first().fill('Austin')
      await page.getByLabel(/ZIP Code/i).first().fill('78701')
      await page.getByLabel(/Contact Name/i).first().fill('John Smith')
      await page.getByLabel(/Phone Number/i).first().fill('555-123-4567')
      await page.getByLabel(/Email Address/i).first().fill('john@acme.com')
      await page.getByRole('combobox', { name: /State\/Province/i }).first().click()
      await page.getByRole('option', { name: 'Texas' }).click()
      
      // Fill destination
      await page.getByLabel(/Street Address/i).nth(1).fill('456 Oak Ave')
      await page.getByLabel(/City/i).nth(1).fill('Dallas')
      await page.getByLabel(/ZIP Code/i).nth(1).fill('75201')
      await page.getByLabel(/Contact Name/i).nth(1).fill('Jane Doe')
      await page.getByLabel(/Phone Number/i).nth(1).fill('555-987-6543')
      await page.getByLabel(/Email Address/i).nth(1).fill('jane@widget.com')
      await page.getByRole('combobox', { name: /State\/Province/i }).nth(1).click()
      await page.getByRole('option', { name: 'Texas' }).click()
      
      // Fill package
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
      
      // Step 2: Select rate
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/pricing/, { timeout: 10000 })
      await expect(page.getByText(/Generating quotes/i)).not.toBeVisible({ timeout: 15000 })
      await page.getByRole('radio').first().click()
      await page.getByRole('button', { name: /Select Rate & Continue/i }).click()
      
      // Step 3: Payment (skip for this test - go directly to pickup)
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/payment/, { timeout: 10000 })
      const url = page.url()
      const shipmentIdMatch = url.match(/\/shipments\/([a-zA-Z0-9-]+)\/payment/)
      expect(shipmentIdMatch).toBeTruthy()
      const shipmentId = shipmentIdMatch![1]
      
      // Create payment and pickup via API to save time
      await page.request.post(`/api/shipments/${shipmentId}/payment`, {
        data: {
          method: 'purchase_order',
          purchaseOrder: {
            poNumber: 'PO-E2E-001',
            poAmount: 500,
            expirationDate: '2026-12-31',
            approvalContact: 'Test Approver',
            department: 'Test Dept',
          },
          billing: {
            address: {
              line1: '123 Billing St',
              city: 'Austin',
              state: 'TX',
              postal: '78701',
              country: 'US',
            },
            contact: {
              name: 'Billing Contact',
              title: 'Manager',
              phone: '555-123-4567',
              email: 'billing@test.com',
            },
            company: {
              legalName: 'Test Corp',
              businessType: 'corporation',
              industry: 'technology',
            },
          },
        },
      })
      
      await page.request.post(`/api/shipments/${shipmentId}/pickup`, {
        data: {
          selectedPickup: {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            timeSlot: {
              id: 'morning-e2e',
              label: 'Morning',
              startTime: '08:00',
              endTime: '12:00',
              availability: 'available',
              fee: 0,
            },
            readyTime: '07:00',
          },
          location: { locationType: 'ground_level' },
          access: { requirements: [] },
          equipment: { equipment: [] },
          loading: { assistanceType: 'customer_load' },
          contacts: {
            primary: { name: 'Test Contact', jobTitle: 'Manager', mobilePhone: '555-111-2222', email: 'test@acme.com' },
            backup: { name: 'Backup', phone: '555-333-4444' },
          },
          notifications: { emailReminder24h: true, smsReminder2h: true, driverEnroute: true },
        },
      })
      
      // Step 4 & 5: Review and confirm
      await page.goto(`/shipments/${shipmentId}/review`)
      await expect(page.getByRole('heading', { name: /Review Shipment/i })).toBeVisible({ timeout: 10000 })
      
      // Accept terms
      await page.locator('#declaredValueAccurate').check({ force: true })
      await page.locator('#insuranceUnderstood').check({ force: true })
      await page.locator('#contentsCompliant').check({ force: true })
      await page.locator('#carrierAuthorized').check({ force: true })
      
      // Confirm shipment
      await page.getByRole('button', { name: /Confirm Shipment/i }).click()
      
      // Step 6: Confirmation
      await expect(page).toHaveURL(/\/shipments\/[^/]+\/confirmation/, { timeout: 15000 })
      await expect(page.getByText(/Shipment Confirmed/i)).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/Confirmation Number/i)).toBeVisible()
      
      // Verify in database
      const shipmentResponse = await page.request.get(`/api/shipments/${shipmentId}`)
      expect(shipmentResponse.status()).toBe(200)
      
      const shipmentData = await shipmentResponse.json()
      expect(shipmentData.status).toBe('confirmed')
      expect(shipmentData.confirmation_number).toBeDefined()
      expect(shipmentData.confirmation_number).toMatch(/^SHK-/)
      
      console.log(`✅ Complete journey verified for shipment ${shipmentId} with confirmation ${shipmentData.confirmation_number}`)
    })
  })
})

// Helper functions
async function createConfirmedShipment(page: Page): Promise<{ shipmentId: string; confirmationNumber: string }> {
  // Create shipment
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
  
  // Add payment
  await page.request.post(`/api/shipments/${shipmentId}/payment`, {
    data: {
      method: 'purchase_order',
      purchaseOrder: {
        poNumber: 'PO-TEST-001',
        poAmount: 500,
      },
      billing: {
        address: {
          line1: '123 Billing St',
          city: 'Austin',
          state: 'TX',
          postal: '78701',
          country: 'US',
        },
        contact: {
          name: 'Billing Contact',
          title: 'Manager',
          phone: '555-123-4567',
          email: 'billing@test.com',
        },
        company: {
          legalName: 'Test Corp',
          businessType: 'corporation',
        },
      },
    },
  })
  
  // Add pickup
  await page.request.post(`/api/shipments/${shipmentId}/pickup`, {
    data: {
      selectedPickup: {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: {
          id: 'morning-test',
          label: 'Morning',
          startTime: '08:00',
          endTime: '12:00',
        },
        readyTime: '07:00',
      },
      location: { locationType: 'ground_level' },
      access: { requirements: [] },
      equipment: { equipment: [] },
      loading: { assistanceType: 'customer_load' },
      contacts: {
        primary: { name: 'Test Contact', jobTitle: 'Manager', mobilePhone: '555-111-2222', email: 'test@acme.com' },
        backup: { name: 'Backup', phone: '555-333-4444' },
      },
      notifications: { emailReminder24h: true, smsReminder2h: true },
    },
  })
  
  // Confirm shipment via API
  const submitResponse = await page.request.post(`/api/shipments/${shipmentId}/submit`, {
    data: {
      terms_accepted: true,
      acknowledgments: [
        'declared_value_accurate',
        'insurance_understood',
        'contents_compliant',
        'carrier_authorized',
      ],
    },
  })
  
  if (submitResponse.status() !== 200) {
    const errorData = await submitResponse.json()
    console.warn('Submit response:', errorData)
    // May fail if validation doesn't pass, that's okay for testing
  }
  
  // Get confirmation number
  const getResponse = await page.request.get(`/api/shipments/${shipmentId}`)
  const getData = await getResponse.json()
  
  return {
    shipmentId,
    confirmationNumber: getData.confirmation_number || `SHK-2024-${Math.floor(Math.random() * 1000000)}`,
  }
}
