import { test, expect, Page } from '@playwright/test';

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Placeholder for journey steps that will be added in subsequent steps.
  if (opts.through >= 1) {
    await page.goto('/recipes');
    await expect(page.getByText('Recipes')).toBeVisible();
  }
}

test('step 2: scaffold loads and routes exist', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();

  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('step 5: settings store persists toggle state', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('Settings')).toBeVisible();

  // Verify default metric units
  await expect(page.getByText('Metric (g, ml)')).toBeVisible();

  // Toggle to imperial
  await page.getByTestId('toggle-units').click();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();

  // Toggle theme
  await expect(page.getByText('Light')).toBeVisible();
  await page.getByTestId('toggle-theme').click();
  await expect(page.getByText('Dark')).toBeVisible();

  // Change default servings
  await page.getByTestId('default-servings').fill('6');
  await expect(page.getByTestId('default-servings')).toHaveValue('6');

  // Reload and verify persistence
  await page.reload();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();
  await expect(page.getByText('Dark')).toBeVisible();
  await expect(page.getByTestId('default-servings')).toHaveValue('6');
});
