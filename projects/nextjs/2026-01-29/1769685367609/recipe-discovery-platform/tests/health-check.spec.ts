import { test, expect } from '@playwright/test';

/**
 * Health check test to verify all routes render without errors
 * This ensures the app is ready for demo video recording
 */

test.describe('App Health Check', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
    expect(errorText).not.toContain('Error:');

    // Fill login form
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
  });

  test('should display dashboard with recipes', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Check dashboard loads
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
    expect(errorText).not.toContain('Invalid src prop');
  });

  test('should display recipes page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to recipes
    await page.goto('http://localhost:3000/recipes');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
    expect(errorText).not.toContain('Invalid src prop');
  });

  test('should display search page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to search
    await page.goto('http://localhost:3000/search');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
  });

  test('should display favorites page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to favorites
    await page.goto('http://localhost:3000/favorites');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
  });

  test('should display profile page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to profile
    await page.goto('http://localhost:3000/profile');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
  });

  test('should display new recipe page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'chef@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to new recipe
    await page.goto('http://localhost:3000/recipes/new');
    await page.waitForLoadState('networkidle');

    // Check no runtime errors
    const errorText = await page.locator('body').textContent();
    expect(errorText).not.toContain('Runtime Error');
  });
});
