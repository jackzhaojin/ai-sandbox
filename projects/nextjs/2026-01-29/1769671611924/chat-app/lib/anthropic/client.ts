/**
 * Anthropic Claude API Client
 * Configured with OAuth token from environment variables
 *
 * Uses Claude Agent SDK which supports both OAuth tokens (for Claude Pro/Max subscriptions)
 * and API keys (for pay-per-use access)
 */

// Default model configuration
export const DEFAULT_MODEL = 'claude-sonnet-4-5';
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Check if authentication credentials are configured
 */
export function hasAuthCredentials(): boolean {
  return !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY);
}

/**
 * Get the authentication type being used
 */
export function getAuthType(): 'oauth' | 'apikey' | 'none' {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return 'oauth';
  if (process.env.ANTHROPIC_API_KEY) return 'apikey';
  return 'none';
}
