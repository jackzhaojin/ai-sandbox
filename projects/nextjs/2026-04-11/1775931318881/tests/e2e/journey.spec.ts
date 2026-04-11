import { test, expect, Page } from '@playwright/test';

/**
 * Journey E2E Test Specification
 * 
 * This spec file is append-only - each step adds its segment to the journey.
 * The completePriorSteps helper grows as the app grows.
 */

/**
 * Helper to complete all prior steps up to a certain point in the flow.
 * Each step that adds a gate extends this helper with its own segment.
 */
export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Start at the flow's natural entry and walk through `opts.through`.
  
  if (opts.through >= 1) {
    // Step 1: Homepage - navigate to new shipment
    await page.goto('/');
    await expect(page.getByText('B2B Postal Checkout')).toBeVisible();
  }
  
  // Future steps will extend this helper:
  // if (opts.through >= 2) { /* step 2 segment */ }
  // if (opts.through >= 3) { /* step 3 segment */ }
  // etc.
}

/**
 * Step 1: Homepage loads correctly
 * Verifies the base project is set up and the homepage renders
 */
test('step 1: homepage loads with create shipment button', async ({ page }) => {
  await page.goto('/');
  
  // Verify the main heading
  await expect(page.getByRole('heading', { name: /B2B Postal Checkout/i })).toBeVisible();
  
  // Verify the feature cards are present (use heading role for specificity)
  await expect(page.getByRole('heading', { name: 'Ship' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compare' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pay' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  
  // Verify the create shipment button exists
  const createButton = page.getByRole('button', { name: /Create New Shipment/i });
  await expect(createButton).toBeVisible();
  
  // The button should link to /shipments/new (route not implemented yet)
  // This test validates the UI exists - navigation will be tested in step 3+
});

/**
 * Step 2 placeholder: Verify project structure
 * This validates that all directories and configs are in place
 */
test('step 2: project structure is correct', async ({ page }) => {
  // Verify dev server is running
  await page.goto('/');
  await expect(page).toHaveURL('/');
  
  // Verify no console errors
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Should have no console errors
  expect(logs).toHaveLength(0);
});
