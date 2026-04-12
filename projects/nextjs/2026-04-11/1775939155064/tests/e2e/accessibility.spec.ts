import { test, expect } from '@playwright/test'

/**
 * Accessibility Tests for B2B Postal Checkout
 * 
 * These tests verify:
 * - Keyboard navigation works throughout the flow
 * - Focus indicators are visible
 * - ARIA attributes are properly set
 * - Color contrast meets WCAG 2.1 AA standards
 * - Screen reader announcements work
 */

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shipments/new')
  })

  test('skip link is present and functional', async ({ page }) => {
    // Press Tab to focus skip link
    await page.keyboard.press('Tab')
    
    // Skip link should be visible
    const skipLink = page.locator('a:has-text("Skip to main content")')
    await expect(skipLink).toBeVisible()
    
    // Click skip link
    await skipLink.click()
    
    // Main content should be focused
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeFocused()
  })

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    // Get all interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const count = await interactiveElements.count()
    
    // Tab through all elements and verify they receive focus
    for (let i = 0; i < Math.min(count, 20); i++) {
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('form inputs have proper labels', async ({ page }) => {
    // Check that all inputs have associated labels
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const id = await input.getAttribute('id')
      
      // Should have aria-label, aria-labelledby, or associated label
      if (!ariaLabel && !ariaLabelledBy && id) {
        const label = page.locator(`label[for="${id}"]`)
        await expect(label).toHaveCount(1)
      }
    }
  })

  test('required fields are marked as required', async ({ page }) => {
    // Check that fields marked with * also have aria-required
    const requiredFields = page.locator('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]')
    expect(await requiredFields.count()).toBeGreaterThan(0)
  })

  test('error messages are announced to screen readers', async ({ page }) => {
    // Submit form without filling anything
    const submitButton = page.locator('button:has-text("Continue")')
    await submitButton.click()
    
    // Wait for errors
    await page.waitForTimeout(500)
    
    // Check that error messages have proper ARIA attributes
    const errorAlerts = page.locator('[role="alert"]')
    const count = await errorAlerts.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alert = errorAlerts.nth(i)
        const hasAriaLive = await alert.getAttribute('aria-live')
        expect(hasAriaLive).toBeTruthy()
      }
    }
  })

  test('aria-invalid is set on invalid fields', async ({ page }) => {
    // Submit form without filling anything
    const submitButton = page.locator('button:has-text("Continue")')
    await submitButton.click()
    
    // Wait for errors
    await page.waitForTimeout(500)
    
    // Check that invalid fields have aria-invalid
    const invalidInputs = page.locator('[aria-invalid="true"]')
    const count = await invalidInputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('select dropdowns have proper ARIA attributes', async ({ page }) => {
    // Find select triggers
    const selectTriggers = page.locator('[role="combobox"]')
    const count = await selectTriggers.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const trigger = selectTriggers.nth(i)
        
        // Should have aria-expanded
        const ariaExpanded = await trigger.getAttribute('aria-expanded')
        expect(ariaExpanded).toBeTruthy()
        
        // Should have aria-haspopup
        const ariaHasPopup = await trigger.getAttribute('aria-haspopup')
        expect(ariaHasPopup).toBe('listbox')
        
        // Should have aria-controls
        const ariaControls = await trigger.getAttribute('aria-controls')
        expect(ariaControls).toBeTruthy()
      }
    }
  })

  test('radio groups have proper ARIA attributes', async ({ page }) => {
    // Find radio groups
    const radioGroups = page.locator('[role="radiogroup"]')
    const count = await radioGroups.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const group = radioGroups.nth(i)
        
        // Should have aria-labelledby or aria-label
        const hasLabel = await group.getAttribute('aria-labelledby') || await group.getAttribute('aria-label')
        expect(hasLabel).toBeTruthy()
        
        // Check radio items
        const radioItems = group.locator('[role="radio"]')
        if (await radioItems.count() > 0) {
          // Check that at least one has aria-checked
          const checked = await radioItems.first().getAttribute('aria-checked')
          expect(checked).toBeTruthy()
        }
      }
    }
  })

  test('focus indicators are visible', async ({ page }) => {
    // Focus on first input
    const firstInput = page.locator('input').first()
    await firstInput.focus()
    
    // Check computed styles for focus ring
    const styles = await firstInput.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        outlineWidth: computed.outlineWidth,
        outlineStyle: computed.outlineStyle,
        outlineColor: computed.outlineColor,
      }
    })
    
    // Should have visible outline on focus
    expect(styles.outlineWidth).not.toBe('0px')
  })

  test('step indicator is accessible', async ({ page }) => {
    // Check step indicator structure
    const stepNav = page.locator('nav[aria-label="Checkout progress"]')
    await expect(stepNav).toBeVisible()
    
    // Check that steps are in a list
    const stepList = stepNav.locator('ol[role="list"]')
    await expect(stepList).toBeVisible()
    
    // Check current step is marked
    const currentStep = stepNav.locator('[aria-current="step"]')
    await expect(currentStep).toHaveCount(1)
  })

  test('color contrast meets WCAG AA standards', async ({ page }) => {
    // Check text contrast on important elements
    const elements = [
      { selector: 'h1', minContrast: 4.5 },
      { selector: 'label', minContrast: 4.5 },
      { selector: 'button', minContrast: 4.5 },
      { selector: 'input', minContrast: 4.5 },
    ]
    
    for (const { selector, minContrast } of elements) {
      const element = page.locator(selector).first()
      if (await element.isVisible().catch(() => false)) {
        const contrast = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          const color = computed.color
          const bgColor = computed.backgroundColor
          
          // Convert to RGB and calculate luminance
          const parseColor = (colorStr: string) => {
            const match = colorStr.match(/\d+/g)
            if (match) {
              return match.map(Number)
            }
            return [0, 0, 0]
          }
          
          const [r1, g1, b1] = parseColor(color)
          const [r2, g2, b2] = parseColor(bgColor)
          
          const luminance = (r: number, g: number, b: number) => {
            const a = [r, g, b].map((v) => {
              v /= 255
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
            })
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
          }
          
          const l1 = luminance(r1, g1, b1)
          const l2 = luminance(r2, g2, b2)
          const lighter = Math.max(l1, l2)
          const darker = Math.min(l1, l2)
          
          return (lighter + 0.05) / (darker + 0.05)
        })
        
        expect(contrast).toBeGreaterThanOrEqual(minContrast)
      }
    }
  })

  test('loading states are announced', async ({ page }) => {
    // Check for live region
    const liveRegion = page.locator('[aria-live]')
    expect(await liveRegion.count()).toBeGreaterThan(0)
    
    // Check for polite announcements
    const politeRegion = page.locator('[aria-live="polite"]')
    expect(await politeRegion.count()).toBeGreaterThan(0)
    
    // Check for assertive announcements (errors)
    const assertiveRegion = page.locator('[aria-live="assertive"]')
    expect(await assertiveRegion.count()).toBeGreaterThan(0)
  })

  test('page has proper heading structure', async ({ page }) => {
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    
    // Check heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const count = await headings.count()
    
    if (count > 0) {
      // Verify no heading levels are skipped
      const levels: number[] = []
      for (let i = 0; i < count; i++) {
        const tag = await headings.nth(i).evaluate(el => el.tagName)
        levels.push(parseInt(tag.replace('H', '')))
      }
      
      // First heading should be h1
      expect(levels[0]).toBe(1)
      
      // No level should be more than 1 greater than the previous
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1)
      }
    }
  })

  test('images have alt text or are hidden from screen readers', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaHidden = await img.getAttribute('aria-hidden')
      const role = await img.getAttribute('role')
      
      // Should have alt text OR be hidden from screen readers
      expect(alt !== null || ariaHidden === 'true' || role === 'presentation' || role === 'none').toBe(true)
    }
  })

  test('icons are hidden from screen readers when decorative', async ({ page }) => {
    // Check Lucide icons
    const icons = page.locator('svg[class*="lucide"], [data-lucide]')
    const count = await icons.count()
    
    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i)
      const ariaHidden = await icon.getAttribute('aria-hidden')
      const ariaLabel = await icon.getAttribute('aria-label')
      const role = await icon.getAttribute('role')
      
      // Icons should either be hidden OR have an accessible label
      if (!ariaLabel) {
        expect(ariaHidden === 'true' || role === 'img').toBe(true)
      }
    }
  })
})
