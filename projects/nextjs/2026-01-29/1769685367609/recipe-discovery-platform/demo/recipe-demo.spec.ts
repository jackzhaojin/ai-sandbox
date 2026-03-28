/**
 * Recipe Discovery Platform Demo
 *
 * Comprehensive demo showcasing:
 * - User authentication
 * - Recipe browsing and search
 * - Filtering by cuisine, difficulty, dietary preferences
 * - Recipe detail view
 * - Favorites functionality
 * - Recipe creation
 *
 * Run: npx playwright test --config=playwright.video.config.ts --grep @recipe-demo
 *
 * @tags @recipe-demo
 */
import { test, type Page } from '@playwright/test';
import {
  pause,
  scenicPause,
  quickPause,
  smoothScroll,
  setViewport,
} from './helpers';

// ---------------------------------------------------------------------------
// Caption overlay system
// ---------------------------------------------------------------------------

const CAPTION_CSS = [
  'position:fixed',
  'bottom:0',
  'left:0',
  'right:0',
  'z-index:99999',
  'padding:20px 40px 28px',
  'background:linear-gradient(transparent 0%,rgba(0,0,0,0.15) 15%,rgba(0,0,0,0.82) 100%)',
  'color:#fff',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  'font-size:20px',
  'font-weight:500',
  'line-height:1.4',
  'text-align:center',
  'letter-spacing:0.01em',
  'text-shadow:0 1px 3px rgba(0,0,0,0.5)',
  'pointer-events:none',
  'opacity:0',
  'transition:opacity 0.3s ease',
].join(';');

async function showCaption(page: Page, text: string): Promise<void> {
  await page.evaluate(([t, css]: string[]) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText = css;
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.opacity = '1';
  }, [text, CAPTION_CSS]);
  await page.waitForTimeout(300);
}

async function hideCaption(page: Page): Promise<void> {
  await page.evaluate(() => {
    const el = document.getElementById('demo-caption');
    if (el) el.style.opacity = '0';
  });
  await page.waitForTimeout(300);
}

async function caption(page: Page, text: string, ms = 3000): Promise<void> {
  await showCaption(page, text);
  await page.waitForTimeout(ms);
  await hideCaption(page);
}

// ---------------------------------------------------------------------------
// RECIPE DISCOVERY PLATFORM DEMO
// ---------------------------------------------------------------------------

test('@recipe-demo Recipe Discovery Platform -- Full Feature Tour', async ({ page }) => {
  // =========================================================================
  // SETUP
  // =========================================================================
  await setViewport(page, 1280, 800);

  // =========================================================================
  // INTRO
  // =========================================================================
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await pause(page, 800);

  await caption(
    page,
    'Welcome to Recipe Discovery Platform -- your culinary companion.',
    3500
  );

  // =========================================================================
  // LOGIN
  // =========================================================================
  // Check if we're on login page, if not we're already logged in
  const isLoginPage = await page.url().includes('/login');

  if (isLoginPage) {
    await caption(page, 'Let\'s start by logging in.', 2500);
    await pause(page, 500);

    // Fill in login form
    await page.fill('input[name="email"]', 'chef@example.com');
    await pause(page, 400);
    await page.fill('input[name="password"]', 'password123');
    await pause(page, 400);

    await caption(page, 'Secure authentication with Auth.js v5.', 2500);

    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await pause(page, 1000);
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================
  await caption(page, 'Welcome to the dashboard -- your recipe hub.', 3000);
  await scenicPause(page);

  await showCaption(page, 'Quick stats showing your recipe activity.');
  await pause(page, 2500);

  // Scroll down to show more content
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await pause(page, 800);
  await hideCaption(page);

  await caption(page, 'Browse recently added recipes from the community.', 3000);
  await pause(page, 1000);

  // =========================================================================
  // ALL RECIPES
  // =========================================================================
  await showCaption(page, 'Let\'s explore all recipes.');
  await page.getByRole('link', { name: 'Recipes' }).first().click();
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1200);

  await caption(page, 'All recipes page with powerful search and filtering.', 3500);
  await pause(page, 800);

  // =========================================================================
  // SEARCH
  // =========================================================================
  await showCaption(page, 'Search for recipes by name, cuisine, or ingredients.');
  await pause(page, 500);

  await page.fill('input[placeholder*="Search recipes"]', 'pasta');
  await pause(page, 800);
  await hideCaption(page);

  await caption(page, 'Real-time search results as you type.', 2500);
  await pause(page, 1000);

  // Clear search
  await page.fill('input[placeholder*="Search recipes"]', '');
  await pause(page, 600);

  // =========================================================================
  // FILTERS
  // =========================================================================
  await caption(page, 'Filter recipes by cuisine, difficulty, and dietary preferences.', 3500);
  await pause(page, 800);

  // Try to click a cuisine filter if it exists
  await showCaption(page, 'Select Italian cuisine.');
  const italianFilter = page.locator('text=Italian').first();
  if (await italianFilter.isVisible().catch(() => false)) {
    await italianFilter.click();
    await pause(page, 800);
  }
  await hideCaption(page);

  await caption(page, 'Filters update the recipe grid instantly.', 2500);
  await pause(page, 1000);

  // =========================================================================
  // RECIPE DETAIL
  // =========================================================================
  await showCaption(page, 'Click any recipe to view full details.');

  // Click first recipe card if available
  const firstRecipe = page.locator('article, [role="article"], a[href*="/recipes/"]').first();
  if (await firstRecipe.isVisible().catch(() => false)) {
    await firstRecipe.click();
    await page.waitForLoadState('networkidle');
    await hideCaption(page);
    await pause(page, 1200);

    await caption(page, 'Detailed recipe view with ingredients and instructions.', 3500);
    await scenicPause(page);

    // Scroll down to see full recipe
    await showCaption(page, 'Complete cooking instructions and ingredient list.');
    await smoothScroll(page, 400);
    await pause(page, 1500);
    await hideCaption(page);

    await caption(page, 'Cooking time, difficulty, and serving information.', 3000);
    await pause(page, 800);

    // Go back to recipes
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await pause(page, 800);
  }

  // =========================================================================
  // FAVORITES
  // =========================================================================
  await showCaption(page, 'Save your favorite recipes for easy access.');
  await page.click('a[href="/favorites"]').catch(() => {});
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1200);

  await caption(page, 'Your favorites collection -- organized and ready to cook.', 3500);
  await pause(page, 1000);

  // =========================================================================
  // CREATE RECIPE
  // =========================================================================
  await showCaption(page, 'Share your own recipes with the community.');
  await page.click('a[href="/recipes/new"]').catch(() => {});
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1200);

  await caption(page, 'Easy-to-use recipe creation form.', 3000);
  await pause(page, 800);

  await showCaption(page, 'Add title, ingredients, instructions, and cooking details.');
  await smoothScroll(page, 300);
  await pause(page, 2000);
  await hideCaption(page);

  // =========================================================================
  // SEARCH PAGE
  // =========================================================================
  await showCaption(page, 'Advanced search with multiple filter options.');
  await page.click('a[href="/search"]').catch(() => {
    // If search link not found, navigate directly
    page.goto('/search');
  });
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1200);

  await caption(page, 'Comprehensive search with cuisine, dietary tags, and time filters.', 3500);
  await pause(page, 1000);

  // =========================================================================
  // PROFILE
  // =========================================================================
  await showCaption(page, 'Manage your profile and preferences.');
  await page.click('a[href="/profile"]').catch(() => {});
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1200);

  await caption(page, 'Update your profile information and view your recipe stats.', 3500);
  await pause(page, 800);

  // =========================================================================
  // RESPONSIVE DESIGN
  // =========================================================================
  await caption(page, 'Fully responsive -- works beautifully on all devices.', 3500);
  await pause(page, 500);

  // Show mobile view
  await setViewport(page, 375, 667);
  await pause(page, 1000);

  await caption(page, 'Mobile-optimized interface for cooking on the go.', 3000);
  await pause(page, 1000);

  // Back to desktop
  await setViewport(page, 1280, 800);
  await pause(page, 800);

  // =========================================================================
  // OUTRO
  // =========================================================================
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await pause(page, 800);

  await caption(
    page,
    'Recipe Discovery Platform -- built with Next.js, TypeScript, and Tailwind CSS.',
    4500
  );

  await pause(page, 500);

  await caption(
    page,
    'Discover, create, and share delicious recipes. Thanks for watching!',
    4000
  );
});
