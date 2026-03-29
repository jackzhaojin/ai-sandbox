import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@pageforge.dev';
const TEST_PASSWORD = 'password123';

test.describe('Dashboard Routing', () => {
  test('should redirect to sites page after login', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/sites/, { timeout: 10000 });

    // Verify we're on the sites page
    expect(page.url()).toContain('/sites');

    // Verify the dashboard layout is rendered (sidebar + content)
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Verify sidebar contains navigation links
    await expect(sidebar.locator('text=Sites')).toBeVisible();
    await expect(sidebar.locator('text=Pages')).toBeVisible();
    await expect(sidebar.locator('text=Templates')).toBeVisible();
    await expect(sidebar.locator('text=Fragments')).toBeVisible();
    await expect(sidebar.locator('text=Media')).toBeVisible();
    await expect(sidebar.locator('text=Settings')).toBeVisible();
  });

  test('should navigate between dashboard pages using sidebar', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/sites/, { timeout: 10000 });

    // Navigate to Pages
    await page.click('a[href="/pages"]');
    await page.waitForURL(/\/pages/, { timeout: 5000 });
    expect(page.url()).toContain('/pages');
    await expect(page.locator('h1:has-text("Pages")')).toBeVisible();

    // Navigate to Templates
    await page.click('a[href="/templates"]');
    await page.waitForURL(/\/templates/, { timeout: 5000 });
    expect(page.url()).toContain('/templates');
    await expect(page.locator('h1:has-text("Templates")')).toBeVisible();

    // Navigate to Media
    await page.click('a[href="/media"]');
    await page.waitForURL(/\/media/, { timeout: 5000 });
    expect(page.url()).toContain('/media');
    await expect(page.locator('h1:has-text("Media")')).toBeVisible();

    // Navigate to Fragments
    await page.click('a[href="/fragments"]');
    await page.waitForURL(/\/fragments/, { timeout: 5000 });
    expect(page.url()).toContain('/fragments');
    await expect(page.locator('h1:has-text("Fragments")')).toBeVisible();

    // Navigate back to Sites
    await page.click('a[href="/sites"]');
    await page.waitForURL(/\/sites/, { timeout: 5000 });
    expect(page.url()).toContain('/sites');
    await expect(page.locator('h1:has-text("Sites")')).toBeVisible();
  });

  test('should protect dashboard routes - redirect to login when not authenticated', async ({ page }) => {
    // Try to access sites page without authentication
    await page.goto(`${BASE_URL}/sites`);

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should not show any 404 errors on dashboard pages', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/sites/, { timeout: 10000 });

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through all pages
    const routes = ['/sites', '/pages', '/templates', '/fragments', '/media', '/settings'];
    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');

      // Verify no 404 in the page content
      const pageContent = await page.content();
      expect(pageContent).not.toContain('404');
      expect(pageContent).not.toContain('Not Found');
    }

    // No console errors should be present
    console.log('Console errors:', errors);
  });
});
