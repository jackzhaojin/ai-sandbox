/**
 * Login Form Component
 *
 * Client-side form for user login
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! Please login.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setGeneralError('')

    const result = await login(formData)

    if (result.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setGeneralError(result.message)
      if (result.errors) {
        setErrors(result.errors)
      }
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error for this field
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined,
      })
    }
  }

  return (
    <div className="border-2 border-green-500 p-8 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {successMessage && (
          <div className="border border-green-500 bg-green-950 p-3 text-green-400 font-mono text-sm">
            {successMessage}
          </div>
        )}
        {generalError && (
          <div className="border border-red-500 bg-red-950 p-3 text-red-400 font-mono text-sm">
            {generalError}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-green-400 font-mono mb-2 uppercase text-sm"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full bg-black border-2 ${
              errors.email ? 'border-red-500' : 'border-green-500'
            } text-green-400 px-4 py-2 font-mono focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,0,0.5)]`}
            placeholder="user@example.com"
            required
          />
          {errors.email && (
            <p className="text-red-400 font-mono text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-green-400 font-mono mb-2 uppercase text-sm"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full bg-black border-2 ${
              errors.password ? 'border-red-500' : 'border-green-500'
            } text-green-400 px-4 py-2 font-mono focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,0,0.5)]`}
            placeholder="••••••••"
            required
          />
          {errors.password && (
            <p className="text-red-400 font-mono text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full border-2 border-green-500 bg-black text-green-500 px-6 py-3 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'LOGGING IN...' : 'LOGIN'}
        </button>

        <div className="text-center">
          <p className="text-green-400 font-mono text-sm">
            DON&apos;T HAVE AN ACCOUNT?{' '}
            <Link
              href="/auth/register"
              className="text-green-300 hover:text-green-100 underline"
            >
              REGISTER
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
