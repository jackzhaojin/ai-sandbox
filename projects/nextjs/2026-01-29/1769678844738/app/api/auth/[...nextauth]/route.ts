/**
 * Auth.js API Route Handler
 *
 * This handles all authentication routes:
 * - GET /api/auth/signin
 * - POST /api/auth/signin
 * - GET /api/auth/signout
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 * - POST /api/auth/callback/:provider
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
