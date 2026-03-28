import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

/**
 * Auth.js Setup
 *
 * Exports:
 * - handlers: API route handlers for [...nextauth]
 * - auth: Get session in Server Components and Route Handlers
 * - signIn: Programmatic sign in
 * - signOut: Programmatic sign out
 */
const nextAuth = NextAuth(authConfig)

export const { handlers, auth, signIn, signOut } = nextAuth

export { nextAuth as default }
