import { test, expect, Page } from '@playwright/test';

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Step 1: Flow starts at /recipes
  if (opts.through >= 1) {
    await page.goto('/recipes');
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
  }

  // Step 2: Scaffold loads and routes exist
  if (opts.through >= 2) {
    await expect(page.getByRole('link', { name: 'Recipe Book' })).toBeVisible();
  }

  // Steps 3-4: RecipeStore seeded with data (UI not yet implemented — no visible assertions)

  // Step 5: Settings store persists toggle state
  if (opts.through >= 5) {
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');

    // Toggle to imperial
    await page.getByTestId('toggle-units').click();
    await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();

    // Toggle theme to dark
    await page.getByTestId('toggle-theme').click();
    await expect(page.getByText('Dark')).toBeVisible();

    // Change default servings
    await page.getByTestId('default-servings').fill('6');
    await expect(page.getByTestId('default-servings')).toHaveValue('6');
  }

  // Step 6: Shared layout with navigation header
  if (opts.through >= 6) {
    await page.getByRole('navigation').getByRole('link', { name: 'Categories' }).click();
    await expect(page).toHaveURL('/categories');

    await page.getByRole('navigation').getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL('/search');

    await page.getByRole('navigation').getByRole('link', { name: 'Favorites' }).click();
    await expect(page).toHaveURL('/favorites');

    await page.getByRole('navigation').getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/recipes');
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

test('step 6: shared layout with navigation header', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('link', { name: 'Recipe Book' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Categories' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Favorites' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Settings' })).toBeVisible();

  // Navigate via header to each route
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/settings');

  await page.getByRole('navigation').getByRole('link', { name: 'Categories' }).click();
  await expect(page).toHaveURL('/categories');

  await page.getByRole('navigation').getByRole('link', { name: 'Search' }).click();
  await expect(page).toHaveURL('/search');

  await page.getByRole('navigation').getByRole('link', { name: 'Favorites' }).click();
  await expect(page).toHaveURL('/favorites');

  await page.getByRole('navigation').getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('/recipes');
});

test('step 5: settings store persists toggle state', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  // Verify default metric units
  await expect(page.getByText('Metric (g, ml)')).toBeVisible();

  // Toggle to imperial
  await page.getByTestId('toggle-units').click();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();

  // Toggle theme
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
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
  await page.waitForSelector('[data-testid="default-servings"]');
  await expect(page.getByTestId('default-servings')).toHaveValue('6');
});

test('checkpoint 1: end-to-end journey through step 6', async ({ page }) => {
  await completePriorSteps(page, { through: 6 });

  // Verify settings persisted after the full navigation loop
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/settings');
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();
  await expect(page.getByText('Dark')).toBeVisible();
  await expect(page.getByTestId('default-servings')).toHaveValue('6');

  // Reload and verify persistence across page reload
  await page.reload();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();
  await expect(page.getByText('Dark')).toBeVisible();
  await page.waitForSelector('[data-testid="default-servings"]');
  await expect(page.getByTestId('default-servings')).toHaveValue('6');
});
