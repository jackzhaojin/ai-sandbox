/**
 * Anthropic Claude API Client
 * Configured with API key from environment variables
 *
 * Note: Full API implementation will be done in Step 5 (Build core API endpoints)
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize only if API key is provided (optional for development)
export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

// Default model configuration
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_MAX_TOKENS = 4096;
