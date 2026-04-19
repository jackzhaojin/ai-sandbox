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

  // Step 8: Recipe grid renders with category filter
  if (opts.through >= 8) {
    await page.goto('/recipes');
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
    // 5 seeded recipes visible
    await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();
  }

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

  // Step 8: Recipe grid renders seeded recipes with category filter
  if (opts.through >= 8) {
    await page.goto('/recipes');
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();
  }

  // Step 9: Recipe detail, favorite, unit conversion
  if (opts.through >= 9) {
    await page.getByRole('link', { name: /Classic Spaghetti Bolognese/ }).click();
    await expect(page).toHaveURL(/\/recipes\/a1b2c3d4-e5f6-7890-abcd-ef1234567890/);
    await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese' })).toBeVisible();

    // Favorite button — add to favorites
    await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Add to favorites');
    await page.getByTestId('favorite-button').click();
    await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Remove from favorites');

    // Units were already toggled to imperial in step 5 — just verify on detail page
    await expect(page.getByText('Units: Imperial (oz, cups)')).toBeVisible();
    await expect(page.getByText(/14\.11 oz/)).toBeVisible();
    await expect(page.getByText(/1\.1 lb/)).toBeVisible();
  }

  // Step 10: Create new recipe
  if (opts.through >= 10) {
    await page.goto('/recipes');
    await page.getByRole('link', { name: /New Recipe/i }).click();
    await expect(page).toHaveURL('/recipes/new');

    await page.fill('[id="title"]', 'Test Tomato Soup');
    await page.selectOption('[id="category"]', 'Main');
    await page.fill('[id="imageUrl"]', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80');
    await page.fill('[id="prepTime"]', '10');
    await page.fill('[id="cookTime"]', '20');

    const ingredientRows = page.locator('.flex.items-start.gap-2');
    await ingredientRows.first().locator('input').nth(0).fill('tomatoes');
    await ingredientRows.first().locator('input').nth(1).fill('500');
    await ingredientRows.first().locator('input').nth(2).fill('g');

    await page.getByRole('button', { name: /Add Ingredient/i }).click();
    await ingredientRows.nth(1).locator('input').nth(0).fill('onion');
    await ingredientRows.nth(1).locator('input').nth(1).fill('1');
    await ingredientRows.nth(1).locator('input').nth(2).fill('pc');

    await page.fill('[id="instructions"]', 'Chop tomatoes and onion. Simmer for 20 minutes. Blend and serve.');
    await page.getByRole('button', { name: /Save Recipe/i }).click();

    await expect(page).toHaveURL(/\/recipes\/.+/);
    await expect(page.getByRole('heading', { name: 'Test Tomato Soup' })).toBeVisible();

    // Back to grid
    await page.goto('/recipes');
    await expect(page.getByRole('link', { name: /Test Tomato Soup/ })).toBeVisible();
  }

  // Step 11: Edit existing recipe
  if (opts.through >= 11) {
    await page.getByRole('link', { name: /Classic Spaghetti Bolognese/ }).click();
    await expect(page).toHaveURL(/\/recipes\/a1b2c3d4-e5f6-7890-abcd-ef1234567890/);

    await page.getByTestId('edit-recipe-button').click();
    await expect(page).toHaveURL('/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit');

    await page.fill('[id="title"]', 'Classic Spaghetti Bolognese (Edited)');
    await page.getByRole('button', { name: /Save Changes/i }).click();

    await expect(page).toHaveURL('/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese (Edited)' })).toBeVisible();
  }

  // Step 12: Categories browse page
  if (opts.through >= 12) {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.getByTestId('category-card-main')).toBeVisible();
    await expect(page.getByTestId('category-card-dessert')).toBeVisible();

    await page.getByTestId('category-card-dessert').click();
    await expect(page).toHaveURL(/\/recipes\?category=Dessert/);
    await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  }

  // Step 13: Search page with live debounced filtering
  if (opts.through >= 13) {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

    await page.getByTestId('search-input').fill('garlic');
    await page.waitForTimeout(600);

    await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).not.toBeVisible();
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

test('step 8: recipe grid renders seeded recipes with category filter', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

  // All 5 seeded recipes visible
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();

  // Filter by Dessert category
  await page.goto('/recipes?category=Dessert');
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).not.toBeVisible();

  // Click a card navigates to detail
  await page.getByRole('link', { name: /Chocolate Lava Cake/ }).click();
  await expect(page).toHaveURL(/\/recipes\/c3d4e5f6-a7b8-9012-cdef-123456789012/);
});

test('step 9: recipe detail page with unit conversion and favorite button', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

  // Click first recipe to open detail
  await page.getByRole('link', { name: /Classic Spaghetti Bolognese/ }).click();
  await expect(page).toHaveURL(/\/recipes\/a1b2c3d4-e5f6-7890-abcd-ef1234567890/);

  // Verify detail content
  await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese' })).toBeVisible();
  await expect(page.getByText('Main')).toBeVisible();
  await expect(page.getByText(/Prep 15m/)).toBeVisible();
  await expect(page.getByText(/Cook 30m/)).toBeVisible();

  // Ingredients in metric by default
  await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
  await expect(page.getByText('Units: Metric (g, ml)')).toBeVisible();
  await expect(page.getByText('400 g')).toBeVisible();
  await expect(page.getByText('500 g')).toBeVisible();

  // Instructions visible
  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
  await expect(page.getByText('Heat olive oil in a large pan over medium heat.')).toBeVisible();

  // Favorite button — add to favorites
  await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Add to favorites');
  await page.getByTestId('favorite-button').click();
  await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Remove from favorites');

  // Toggle units to imperial in settings
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/settings');
  await page.getByTestId('toggle-units').click();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();

  // Return to recipe detail — ingredients should be in imperial
  await page.goto('/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  await expect(page.getByText('Units: Imperial (oz, cups)')).toBeVisible();
  // 400g -> ~14.11 oz; 500g >= 454 so -> ~1.1 lb
  await expect(page.getByText(/14\.11 oz/)).toBeVisible();
  await expect(page.getByText(/1\.1 lb/)).toBeVisible();

  // Not-found page
  await page.goto('/recipes/nonexistent-id');
  await expect(page.getByText('Recipe not found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Recipes' })).toBeVisible();
});

test('step 10: create new recipe via /recipes/new form', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

  // Navigate to new recipe form
  await page.getByRole('link', { name: /New Recipe/i }).click();
  await expect(page).toHaveURL('/recipes/new');
  await expect(page.getByRole('heading', { name: 'Create New Recipe' })).toBeVisible();

  // Fill the form
  await page.fill('[id="title"]', 'Test Tomato Soup');
  await page.selectOption('[id="category"]', 'Main');
  await page.fill('[id="imageUrl"]', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80');
  await page.fill('[id="prepTime"]', '10');
  await page.fill('[id="cookTime"]', '20');

  // Fill first ingredient
  const ingredientRows = page.locator('.flex.items-start.gap-2');
  await ingredientRows.first().locator('input').nth(0).fill('tomatoes');
  await ingredientRows.first().locator('input').nth(1).fill('500');
  await ingredientRows.first().locator('input').nth(2).fill('g');

  // Add second ingredient
  await page.getByRole('button', { name: /Add Ingredient/i }).click();
  await ingredientRows.nth(1).locator('input').nth(0).fill('onion');
  await ingredientRows.nth(1).locator('input').nth(1).fill('1');
  await ingredientRows.nth(1).locator('input').nth(2).fill('pc');

  // Fill instructions
  await page.fill('[id="instructions"]', 'Chop tomatoes and onion. Simmer for 20 minutes. Blend and serve.');

  // Submit
  await page.getByRole('button', { name: /Save Recipe/i }).click();

  // Should redirect to detail page
  await expect(page).toHaveURL(/\/recipes\/.+/);
  await expect(page.getByRole('heading', { name: 'Test Tomato Soup' })).toBeVisible();
  await expect(page.getByText('Main')).toBeVisible();
  await expect(page.getByText('tomatoes', { exact: true })).toBeVisible();
  await expect(page.getByText('500 g')).toBeVisible();
  await expect(page.getByText('onion', { exact: true })).toBeVisible();
  await expect(page.getByText('1 pc')).toBeVisible();

  // Go back to grid and verify new recipe appears
  await page.goto('/recipes');
  await expect(page.getByRole('link', { name: /Test Tomato Soup/ })).toBeVisible();

  // Reload and verify persistence (localStorage)
  await page.reload();
  await expect(page.getByRole('link', { name: /Test Tomato Soup/ })).toBeVisible();
});

test('step 11: edit existing recipe via /recipes/[id]/edit form', async ({ page }) => {
  await page.goto('/recipes');
  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

  // Click first recipe to open detail
  await page.getByRole('link', { name: /Classic Spaghetti Bolognese/ }).click();
  await expect(page).toHaveURL(/\/recipes\/a1b2c3d4-e5f6-7890-abcd-ef1234567890/);
  await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese' })).toBeVisible();

  // Click Edit button
  await page.getByTestId('edit-recipe-button').click();
  await expect(page).toHaveURL('/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit');
  await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeVisible();

  // Verify form is prefilled
  await expect(page.getByRole('textbox', { name: 'Title *' })).toHaveValue('Classic Spaghetti Bolognese');
  await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue('Main');
  await expect(page.getByRole('spinbutton', { name: 'Prep Time (minutes)' })).toHaveValue('15');
  await expect(page.getByRole('spinbutton', { name: 'Cook Time (minutes)' })).toHaveValue('30');

  // Change title
  await page.fill('[id="title"]', 'Classic Spaghetti Bolognese (Edited)');

  // Submit
  await page.getByRole('button', { name: /Save Changes/i }).click();

  // Should redirect to detail page with updated title
  await expect(page).toHaveURL('/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese (Edited)' })).toBeVisible();

  // Reload and verify persistence (localStorage)
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Classic Spaghetti Bolognese (Edited)' })).toBeVisible();

  // 404 for non-existent recipe
  await page.goto('/recipes/nonexistent-id/edit');
  await expect(page.getByText('Recipe not found')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Recipes' })).toBeVisible();
});

test('step 12: categories browse page shows grid with counts and links to filtered recipes', async ({ page }) => {
  await page.goto('/categories');
  await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();

  // All 5 category cards visible
  await expect(page.getByTestId('category-card-main')).toBeVisible();
  await expect(page.getByTestId('category-card-dessert')).toBeVisible();
  await expect(page.getByTestId('category-card-salad')).toBeVisible();
  await expect(page.getByTestId('category-card-appetizer')).toBeVisible();
  await expect(page.getByTestId('category-card-drink')).toBeVisible();

  // Verify counts from seeded recipes
  await expect(page.getByTestId('category-card-main').getByText('2 recipes')).toBeVisible();
  await expect(page.getByTestId('category-card-dessert').getByText('2 recipes')).toBeVisible();
  await expect(page.getByTestId('category-card-salad').getByText('1 recipe')).toBeVisible();
  await expect(page.getByTestId('category-card-appetizer').getByText('0 recipes')).toBeVisible();
  await expect(page.getByTestId('category-card-drink').getByText('0 recipes')).toBeVisible();

  // Click Dessert navigates to filtered recipes
  await page.getByTestId('category-card-dessert').click();
  await expect(page).toHaveURL(/\/recipes\?category=Dessert/);
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).not.toBeVisible();
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


test('step 13: search page with live debounced filtering', async ({ page }) => {
  await page.goto('/search');
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

  // All recipes visible before search
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();

  // Search by ingredient: "garlic" — should match 3 recipes
  await page.getByTestId('search-input').fill('garlic');
  await page.waitForTimeout(600); // wait for debounce

  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).not.toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).not.toBeVisible();

  // Search by title: "chocolate" — should match 1 recipe
  await page.getByTestId('search-input').fill('chocolate');
  await page.waitForTimeout(600);

  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).not.toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).not.toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).not.toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).not.toBeVisible();

  // Search with no matches
  await page.getByTestId('search-input').fill('xyznonexistent');
  await page.waitForTimeout(600);

  await expect(page.getByText('No recipes found')).toBeVisible();
  await expect(page.getByText('No recipes match "xyznonexistent".')).toBeVisible();

  // Clear search — all recipes return
  await page.getByTestId('search-input').fill('');
  await page.waitForTimeout(600);

  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Chocolate Lava Cake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Strawberry Cheesecake/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();
});


test('checkpoint 2: end-to-end journey through step 13', async ({ page }) => {
  await completePriorSteps(page, { through: 13 });

  // Verify search results are still showing the filtered state from step 13
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Grilled Salmon with Asparagus/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caesar Salad/ })).toBeVisible();

  // Verify the recipe created in step 10 still exists (persistence)
  await page.goto('/recipes');
  await expect(page.getByRole('link', { name: /Test Tomato Soup/ })).toBeVisible();

  // Verify the edited recipe title from step 11 persisted
  await expect(page.getByRole('link', { name: /Classic Spaghetti Bolognese \(Edited\)/ })).toBeVisible();

  // Verify the favorited recipe from step 9 still shows as favorited on detail page
  await page.getByRole('link', { name: /Classic Spaghetti Bolognese \(Edited\)/ }).click();
  await expect(page).toHaveURL(/\/recipes\/a1b2c3d4-e5f6-7890-abcd-ef1234567890/);
  await expect(page.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Remove from favorites');

  // Verify settings persisted (imperial from step 5)
  await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL('/settings');
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();

  // Reload and verify persistence across page reload
  await page.reload();
  await expect(page.getByText('Imperial (oz, cups)')).toBeVisible();
});
