/**
 * Register Form Component
 *
 * Client-side form for user registration
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/auth/actions'

export function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    name?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setGeneralError('')

    const result = await register(formData)

    if (result.success) {
      // Redirect to login page after successful registration
      router.push('/auth/login?registered=true')
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
        {generalError && (
          <div className="border border-red-500 bg-red-950 p-3 text-red-400 font-mono text-sm">
            {generalError}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-green-400 font-mono mb-2 uppercase text-sm"
          >
            Name (Optional)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full bg-black border-2 ${
              errors.name ? 'border-red-500' : 'border-green-500'
            } text-green-400 px-4 py-2 font-mono focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,0,0.5)]`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-red-400 font-mono text-xs mt-1">{errors.name}</p>
          )}
        </div>

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
          <p className="text-green-600 font-mono text-xs mt-1">
            MINIMUM 8 CHARACTERS
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full border-2 border-green-500 bg-black text-green-500 px-6 py-3 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'CREATING ACCOUNT...' : 'REGISTER'}
        </button>

        <div className="text-center">
          <p className="text-green-400 font-mono text-sm">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link
              href="/auth/login"
              className="text-green-300 hover:text-green-100 underline"
            >
              LOGIN
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
