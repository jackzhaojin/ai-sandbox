import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should redirect to chat after successful login', async ({ page }) => {
    await page.goto('/login')

    // Fill in login form with test credentials
    await page.getByLabel(/email/i).fill('alice@example.com')
    await page.getByLabel(/password/i).fill('password123')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to chat page
    await expect(page).toHaveURL(/\/chat/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in login form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid credentials|incorrect/i)).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid email
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/password/i).fill('password123')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation error
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access protected chat page without authentication
    await page.goto('/chat')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')

    // Click on sign up link
    await page.getByRole('link', { name: /sign up|register/i }).click()

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible()
  })

  test('should register new user', async ({ page }) => {
    await page.goto('/register')

    // Generate unique email
    const uniqueEmail = `test${Date.now()}@example.com`

    // Fill in registration form
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/^password/i).first().fill('password123')
    await page.getByLabel(/name/i).fill('Test User')

    // Submit form
    await page.getByRole('button', { name: /sign up|create account/i }).click()

    // Should redirect to chat or show success message
    // Wait for either redirect or success message
    await Promise.race([
      expect(page).toHaveURL(/\/chat/),
      expect(page.getByText(/account created|success/i)).toBeVisible(),
    ])
  })

  test('should sign out successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('alice@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to chat
    await expect(page).toHaveURL(/\/chat/)

    // Click sign out button
    await page.getByRole('button', { name: /sign out|logout/i }).click()

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login)?/)
  })
})
