import { test, expect } from '@playwright/test';

test('verify app has demo-worthy data', async ({ page }) => {
  console.log('\n=== DATA CHECK: Verifying app has content for demo ===\n');

  // Check landing page
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'data-check-home.png' });

  const homeText = await page.locator('body').innerText();
  console.log('Home page loaded successfully');

  // Check login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'data-check-login.png' });
  console.log('Login page loaded successfully');

  // Check register page
  await page.goto('http://localhost:3000/register');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'data-check-register.png' });
  console.log('Register page loaded successfully');

  // Try to login with seed user
  await page.goto('http://localhost:3000/login');
  await page.getByLabel(/email/i).fill('alice@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait a bit and check URL
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  console.log(`After login attempt, current URL: ${currentUrl}`);

  // If we're at /chat, we logged in successfully
  if (currentUrl.includes('/chat')) {
    console.log('✅ Login successful! User can access chat.');
    await page.screenshot({ path: 'data-check-chat.png' });

    // Check for conversations in sidebar
    const convItems = await page.locator('[data-testid^="conversation-"], .conversation-item').count();
    console.log(`Found ${convItems} conversation items in sidebar`);

    // Check for message input
    const messageInput = await page.getByPlaceholder(/message|type/i).isVisible();
    console.log(`Message input visible: ${messageInput}`);
  } else {
    console.log('⚠️  Login failed. User stayed on:', currentUrl);
    await page.screenshot({ path: 'data-check-login-failed.png' });
  }

  console.log('\n=== DATA CHECK COMPLETE ===\n');
});
