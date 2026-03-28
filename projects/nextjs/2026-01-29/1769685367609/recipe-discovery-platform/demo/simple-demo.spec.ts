/**
 * Recipe Discovery Platform - Simple Demo
 *
 * Streamlined demo showing core features with robust selectors
 *
 * Run: npx playwright test --config=playwright.video.config.ts --grep @simple-demo
 *
 * @tags @simple-demo
 */
import { test, type Page } from '@playwright/test';
import {
  pause,
  scenicPause,
  quickPause,
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
// SIMPLE DEMO
// ---------------------------------------------------------------------------

test('@simple-demo Recipe Discovery Platform Demo', async ({ page }) => {
  await setViewport(page, 1280, 800);

  // =========================================================================
  // INTRO & LOGIN
  // =========================================================================
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await pause(page, 1000);

  await caption(
    page,
    'Welcome to Recipe Discovery Platform - your culinary companion.',
    3500
  );

  // Check if we need to login
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    await caption(page, "Let's sign in to explore recipes.", 2500);
    await pause(page, 500);

    // Fill login form
    await page.fill('input[name="email"]', 'chef@example.com');
    await pause(page, 400);
    await page.fill('input[name="password"]', 'password123');
    await pause(page, 400);

    await showCaption(page, 'Secure authentication powered by Auth.js v5.');
    await pause(page, 2000);

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await hideCaption(page);
    await pause(page, 1500);
  }

  // =========================================================================
  // DASHBOARD / HOME
  // =========================================================================
  await caption(page, 'Your personalized recipe dashboard.', 3000);
  await scenicPause(page);

  await showCaption(page, 'Browse curated recipes and discover new favorites.');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await pause(page, 1500);
  await hideCaption(page);
  await pause(page, 800);

  // =========================================================================
  // NAVIGATION TO RECIPES PAGE
  // =========================================================================
  await showCaption(page, "Let's explore all available recipes.");
  await pause(page, 1500);

  // Navigate to recipes page using the URL directly
  await page.goto('/recipes');
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1000);

  await caption(page, 'Powerful search and filtering for thousands of recipes.', 3500);
  await scenicPause(page);

  // =========================================================================
  // SEARCH FUNCTIONALITY
  // =========================================================================
  await showCaption(page, 'Search by name, cuisine, or ingredients.');
  await pause(page, 1500);

  // Find and fill search input
  const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
  await searchInput.fill('pasta');
  await pause(page, 1200);
  await hideCaption(page);

  await caption(page, 'Real-time results as you type.', 2500);
  await pause(page, 1000);

  // =========================================================================
  // VIEW RECIPE DETAILS
  // =========================================================================
  await showCaption(page, "Let's view a recipe in detail.");
  await pause(page, 1500);

  // Click on first recipe card
  const firstRecipe = page.locator('article, [role="article"], .recipe-card, a[href*="/recipes/"]').first();
  await firstRecipe.click();
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1500);

  await caption(page, 'Detailed recipes with ingredients, instructions, and more.', 3500);
  await scenicPause(page);

  // Scroll to show ingredients/instructions
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await pause(page, 1500);

  await showCaption(page, 'Step-by-step cooking instructions.');
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await pause(page, 2000);
  await hideCaption(page);

  // =========================================================================
  // FAVORITES
  // =========================================================================
  await showCaption(page, 'Save your favorite recipes for later.');
  await pause(page, 1500);

  // Navigate to favorites
  await page.goto('/favorites');
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1500);

  await caption(page, 'All your saved recipes in one place.', 3000);
  await scenicPause(page);

  // =========================================================================
  // PROFILE
  // =========================================================================
  await showCaption(page, 'Manage your profile and preferences.');
  await pause(page, 1500);

  // Navigate to profile
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await hideCaption(page);
  await pause(page, 1500);

  await caption(page, 'Customize your recipe discovery experience.', 3000);
  await scenicPause(page);

  // =========================================================================
  // CLOSING
  // =========================================================================
  await caption(
    page,
    'Recipe Discovery Platform - discover, save, and share amazing recipes!',
    4000
  );
  await pause(page, 1000);
});
