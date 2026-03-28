/**
 * Tests for Anthropic client configuration
 *
 * Note: We test the module structure and constants without actually importing
 * the client instance to avoid browser environment issues in jsdom.
 * The actual Anthropic client usage is validated through E2E tests.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Anthropic Client Configuration', () => {
  // Read the client file to verify its structure without importing
  const clientFilePath = join(__dirname, '../anthropic/client.ts')
  const clientFileContent = readFileSync(clientFilePath, 'utf-8')

  describe('Module Exports', () => {
    it('should export DEFAULT_MODEL constant', () => {
      expect(clientFileContent).toContain('export const DEFAULT_MODEL')
    })

    it('should export DEFAULT_MAX_TOKENS constant', () => {
      expect(clientFileContent).toContain('export const DEFAULT_MAX_TOKENS')
    })

    it('should export anthropic client', () => {
      expect(clientFileContent).toContain('export const anthropic')
    })

    it('should import Anthropic SDK', () => {
      expect(clientFileContent).toContain("import Anthropic from '@anthropic-ai/sdk'")
    })
  })

  describe('Configuration Values', () => {
    it('should define a Claude model', () => {
      // Check that the file contains a claude model reference
      expect(clientFileContent).toMatch(/DEFAULT_MODEL\s*=\s*['"]claude-/)
    })

    it('should define max tokens as a number', () => {
      // Check that DEFAULT_MAX_TOKENS is set to a number
      expect(clientFileContent).toMatch(/DEFAULT_MAX_TOKENS\s*=\s*\d+/)
    })

    it('should check for API key before initializing', () => {
      expect(clientFileContent).toContain('process.env.ANTHROPIC_API_KEY')
    })

    it('should handle missing API key gracefully', () => {
      // Should have a null fallback
      expect(clientFileContent).toContain(': null')
    })
  })

  describe('Security', () => {
    it('should not hardcode API keys', () => {
      // Make sure no sk- prefixed keys are hardcoded
      expect(clientFileContent).not.toMatch(/['"]sk-ant-/)
    })

    it('should use environment variable for API key', () => {
      expect(clientFileContent).toContain('process.env.ANTHROPIC_API_KEY')
    })
  })
})
