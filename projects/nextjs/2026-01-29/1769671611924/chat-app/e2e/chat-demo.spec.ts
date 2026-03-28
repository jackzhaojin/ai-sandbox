/**
 * Chat App Demo - Showcases OAuth-based Claude integration
 *
 * This demo tests the end-to-end chat functionality with Claude AI
 * using OAuth token authentication (Claude Pro/Max subscription).
 */

import { test, expect } from '@playwright/test';
import { startTimestampRecording, caption } from '../caption-overlay';
import { pause } from '../demo-helpers';

// Generate a unique test user email to avoid conflicts
const timestamp = Date.now();
const testEmail = `demo${timestamp}@example.com`;
const testPassword = 'SecurePass123!';

test('Chat App Demo @demo', async ({ page }) => {
  // CRITICAL: Start timestamp recording for exact video-audio sync
  startTimestampRecording();

  //
  // Scene 1: Landing Page
  //
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Assert no error states
  await expect(page.locator('body')).not.toContainText('Runtime Error');
  await expect(page.locator('body')).not.toContainText('Application error');

  // Assert landing page content is visible
  await expect(page.getByRole('heading', { name: /Chat with Claude/i }).first()).toBeVisible({ timeout: 5000 });

  caption(page, 'Welcome to Claude Chat, a conversational AI application.', 4800);
  await pause(page, 4800);

  caption(page, 'Built with Next.js and powered by Claude AI using OAuth authentication.', 5600);
  await pause(page, 5600);

  //
  // Scene 2: Registration
  //
  await page.getByRole('link', { name: /register|sign up|get started/i }).click();
  await page.waitForLoadState('networkidle');

  // Assert registration page loaded
  await expect(page.locator('body')).not.toContainText('Runtime Error');
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 });

  caption(page, 'First, let\'s create a new account to access the chat.', 4000);
  await pause(page, 4000);

  // Fill registration form
  await page.getByLabel(/name/i).fill('Demo User');
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).first().fill(testPassword);

  // Handle confirm password if it exists
  const confirmPasswordField = page.getByLabel(/confirm password/i);
  const hasConfirmPassword = await confirmPasswordField.count() > 0;
  if (hasConfirmPassword) {
    await confirmPasswordField.fill(testPassword);
  }

  caption(page, 'Entering user details and creating an account.', 3600);
  await pause(page, 3600);

  await page.getByRole('button', { name: /sign up|register|create account/i }).click();
  await page.waitForTimeout(2000);

  // Should redirect to chat or login
  const currentUrl = page.url();
  console.log(`After registration, URL: ${currentUrl}`);

  // If redirected to login, log in
  if (currentUrl.includes('/login')) {
    caption(page, 'Registration successful. Now logging in.', 3200);
    await pause(page, 3200);

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForTimeout(2000);
  }

  //
  // Scene 3: Chat Interface
  //
  await page.waitForURL(/\/chat/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Assert chat interface is visible
  await expect(page.locator('body')).not.toContainText('Runtime Error');
  await expect(page.getByPlaceholder(/message|type/i)).toBeVisible({ timeout: 5000 });

  caption(page, 'Here is the chat interface with conversation history on the left.', 4800);
  await pause(page, 4800);

  //
  // Scene 4: Send Message and Receive Response
  //
  const testMessage = 'Hello! Can you help me write a haiku about coding?';

  caption(page, 'Let\'s send a message to Claude and see the AI response.', 4000);
  await pause(page, 4000);

  await page.getByPlaceholder(/message|type/i).fill(testMessage);
  await page.getByRole('button', { name: /send|submit/i }).click();

  caption(page, 'Message sent. The app is now streaming Claude\'s response using OAuth authentication.', 6400);
  await pause(page, 6400);

  // Wait for the assistant's response to appear
  // This tests the OAuth integration - if it works, we'll see a response
  // Look for a message container with bg-gray-50 (assistant message styling)
  const assistantMessage = page.locator('.bg-gray-50').filter({ hasText: 'Claude' }).first();
  await assistantMessage.waitFor({ state: 'visible', timeout: 30000 });

  caption(page, 'Success! Claude responded with a creative haiku, proving our OAuth integration works perfectly.', 6400);
  await pause(page, 6400);

  //
  // Scene 5: Highlight Features
  //
  caption(page, 'The app uses Claude Agent SDK with OAuth tokens, supporting both Pro and Max subscriptions.', 7200);
  await pause(page, 7200);

  caption(page, 'All messages are persisted in a SQLite database, and conversations can be managed from the sidebar.', 7200);
  await pause(page, 7200);

  // Final pause to ensure voiceover completes
  await page.waitForTimeout(5000);
});
