import { createHash, randomBytes } from 'crypto'

/**
 * Generate a new API key with the format: pf_live_[32 random alphanumeric chars]
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(24).toString('base64url').substring(0, 32)
  return `pf_live_${randomPart}`
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Extract the prefix from an API key (first 12 characters)
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, 12)
}

/**
 * Mask an API key for display (show prefix only)
 */
export function maskApiKey(prefix: string): string {
  return `${prefix}...`
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash
}
