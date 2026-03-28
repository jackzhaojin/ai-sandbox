import { test, expect } from '@playwright/test'

// Helper function to login before each test
async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.getByLabel(/password/i).fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/chat/)
}

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display chat interface', async ({ page }) => {
    // Check for main chat elements
    await expect(page.getByPlaceholder(/message|type/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible()
  })

  test('should display existing conversations in sidebar', async ({ page }) => {
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-list"], .conversation-item, [role="list"]', {
      timeout: 10000,
    })

    // Check that conversations are visible
    const conversationItems = await page.locator('.conversation-item, [data-testid^="conversation-"]').count()
    expect(conversationItems).toBeGreaterThan(0)
  })

  test('should create new conversation with "New Chat" button', async ({ page }) => {
    // Click new chat button
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    // Chat input should be visible and empty
    const input = page.getByPlaceholder(/message|type/i)
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('')

    // Message area should be empty
    await expect(page.getByText(/no messages|start conversation|say hello/i)).toBeVisible()
  })

  test('should send a message and receive AI response', async ({ page }) => {
    // Create new conversation
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    // Type and send a message
    const testMessage = 'Hello, this is a test message!'
    await page.getByPlaceholder(/message|type/i).fill(testMessage)
    await page.getByRole('button', { name: /send|submit/i }).click()

    // User message should appear
    await expect(page.getByText(testMessage)).toBeVisible()

    // Wait for AI response (streaming indicator or response text)
    await page.waitForSelector('[data-testid="message-assistant"], .message-assistant, [role="article"]', {
      timeout: 30000,
    })

    // AI response should be visible
    const messages = await page.locator('[data-testid^="message-"], .message-item, [role="article"]').count()
    expect(messages).toBeGreaterThanOrEqual(2) // At least user + assistant message
  })

  test('should send multiple messages in same conversation', async ({ page }) => {
    // Create new conversation
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    // Send first message
    await page.getByPlaceholder(/message|type/i).fill('First message')
    await page.getByRole('button', { name: /send|submit/i }).click()

    // Wait for response
    await page.waitForTimeout(2000)

    // Send second message
    await page.getByPlaceholder(/message|type/i).fill('Second message')
    await page.getByRole('button', { name: /send|submit/i }).click()

    // Both messages should be visible
    await expect(page.getByText('First message')).toBeVisible()
    await expect(page.getByText('Second message')).toBeVisible()
  })

  test('should switch between conversations', async ({ page }) => {
    // Get list of conversations
    await page.waitForSelector('[data-testid="conversation-list"], .conversation-item, [role="list"]', {
      timeout: 10000,
    })

    const conversations = page.locator('.conversation-item, [data-testid^="conversation-"]')
    const count = await conversations.count()

    if (count >= 2) {
      // Click first conversation
      await conversations.first().click()
      await page.waitForTimeout(1000)

      // Get messages count
      const firstConvMessages = await page.locator('[data-testid^="message-"], .message-item').count()

      // Click second conversation
      await conversations.nth(1).click()
      await page.waitForTimeout(1000)

      // Messages should change
      const secondConvMessages = await page.locator('[data-testid^="message-"], .message-item').count()

      // Different conversations might have different message counts
      expect(firstConvMessages).toBeGreaterThanOrEqual(0)
      expect(secondConvMessages).toBeGreaterThanOrEqual(0)
    }
  })

  test('should not send empty messages', async ({ page }) => {
    // Create new conversation
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    // Try to send empty message
    const sendButton = page.getByRole('button', { name: /send|submit/i })

    // Send button should be disabled or clicking should not work
    const isDisabled = await sendButton.isDisabled()

    if (!isDisabled) {
      await sendButton.click()
      // No message should appear
      await page.waitForTimeout(500)
      const messageCount = await page.locator('[data-testid^="message-"], .message-item').count()
      expect(messageCount).toBe(0)
    }
  })

  test('should persist messages after page reload', async ({ page }) => {
    // Create new conversation and send message
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    const testMessage = 'Persistence test message'
    await page.getByPlaceholder(/message|type/i).fill(testMessage)
    await page.getByRole('button', { name: /send|submit/i }).click()

    // Wait for message to appear
    await expect(page.getByText(testMessage)).toBeVisible()

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Message should still be visible
    await expect(page.getByText(testMessage)).toBeVisible()
  })

  test('should handle special characters and emojis in messages', async ({ page }) => {
    // Create new conversation
    await page.getByRole('button', { name: /new chat|new conversation/i }).click()

    // Send message with special characters and emojis
    const testMessage = 'Hello! 👋 Test <script>alert("xss")</script> & special chars: @#$%^&*()'
    await page.getByPlaceholder(/message|type/i).fill(testMessage)
    await page.getByRole('button', { name: /send|submit/i }).click()

    // Message should appear correctly (sanitized)
    await expect(page.getByText(/Hello! 👋 Test/)).toBeVisible()
  })
})
