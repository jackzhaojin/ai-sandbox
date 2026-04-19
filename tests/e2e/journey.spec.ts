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
  await expect(page.getByText('Recipes')).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByText('Favorites')).toBeVisible();

  await page.goto('/search');
  await expect(page.getByText('Search')).toBeVisible();

  await page.goto('/categories');
  await expect(page.getByText('Categories')).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByText('Settings')).toBeVisible();
});
