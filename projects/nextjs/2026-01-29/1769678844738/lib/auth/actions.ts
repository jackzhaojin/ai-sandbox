/**
 * Authentication Server Actions
 *
 * These actions handle:
 * - User registration
 * - User login
 * - User logout
 * - Password hashing
 */

'use server'

import { signIn, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'

// ============================================================================
// Register New User
// ============================================================================

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface RegisterResult {
  success: boolean
  message: string
  errors?: {
    email?: string
    password?: string
    name?: string
  }
}

export async function register(data: RegisterData): Promise<RegisterResult> {
  try {
    // Validate input
    if (!data.email || !data.password) {
      return {
        success: false,
        message: 'Email and password are required',
        errors: {
          email: !data.email ? 'Email is required' : undefined,
          password: !data.password ? 'Password is required' : undefined,
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        message: 'Invalid email format',
        errors: { email: 'Invalid email format' }
      }
    }

    // Validate password strength (minimum 8 characters)
    if (data.password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters',
        errors: { password: 'Password must be at least 8 characters' }
      }
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (existingUser) {
      return {
        success: false,
        message: 'User already exists',
        errors: { email: 'An account with this email already exists' }
      }
    }

    // Hash password (bcrypt with cost factor 12)
    const passwordHash = await bcrypt.hash(data.password, 12)

    // Create user
    await db.insert(users).values({
      email: data.email,
      name: data.name || null,
      passwordHash,
    })

    return {
      success: true,
      message: 'Account created successfully'
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      message: 'An error occurred during registration'
    }
  }
}

// ============================================================================
// Login User
// ============================================================================

export interface LoginData {
  email: string
  password: string
}

export interface LoginResult {
  success: boolean
  message: string
  errors?: {
    email?: string
    password?: string
  }
}

export async function login(data: LoginData): Promise<LoginResult> {
  try {
    // Validate input
    if (!data.email || !data.password) {
      return {
        success: false,
        message: 'Email and password are required',
        errors: {
          email: !data.email ? 'Email is required' : undefined,
          password: !data.password ? 'Password is required' : undefined,
        }
      }
    }

    // Attempt sign in
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    return {
      success: true,
      message: 'Logged in successfully'
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            message: 'Invalid email or password',
            errors: {
              email: 'Invalid credentials',
              password: 'Invalid credentials'
            }
          }
        default:
          return {
            success: false,
            message: 'An error occurred during login'
          }
      }
    }
    throw error
  }
}

// ============================================================================
// Logout User
// ============================================================================

export async function logout() {
  await signOut({ redirect: false })
}
