'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Shield, CheckCircle, XCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    token: string
  }>
}

interface InvitationData {
  email: string
  role: string
  site: {
    id: string
    name: string
    slug: string
  }
}

export default function InviteAcceptancePage({ params }: PageProps) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      validateInvitation(p.token)
      checkAuth()
    })
  }, [params])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const validateInvitation = async (inviteToken: string) => {
    setIsValidating(true)
    try {
      const res = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken })
      })

      const data = await res.json()

      if (!data.valid) {
        setError(data.error)
        return
      }

      setInvitation(data.invitation)
    } catch (error) {
      console.error('Error validating invitation:', error)
      setError('Failed to validate invitation')
    } finally {
      setIsValidating(false)
    }
  }

  const handleAccept = async () => {
    if (!token) return

    setIsAccepting(true)
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Successfully joined the site!')
      router.push(`/dashboard/${data.siteId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsAccepting(false)
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to manage content, settings, and team members'
      case 'author':
        return 'Create and edit pages, upload media, and manage content'
      case 'viewer':
        return 'View content and preview pages'
      default:
        return ''
    }
  }

  const getRoleIcon = (role: string) => {
    const className = "w-12 h-12"
    switch (role) {
      case 'admin':
        return <Shield className={`${className} text-purple-500`} />
      case 'author':
        return <Mail className={`${className} text-blue-500`} />
      case 'viewer':
        return <Mail className={`${className} text-gray-500`} />
      default:
        return <Mail className={className} />
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Validating Invitation
          </h2>
          <p className="text-gray-600">Please wait while we verify your invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            {getRoleIcon(invitation.role)}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You're Invited!
          </h1>
          <p className="text-gray-600">
            Join <span className="font-semibold text-gray-900">{invitation.site.name}</span>
          </p>
        </div>

        {/* Invitation Details */}
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Invited as</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 capitalize">
                {invitation.role}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {getRoleDescription(invitation.role)}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <div className="font-medium mb-1">Email Verification Required</div>
                <div className="text-blue-700">
                  This invitation is for <strong>{invitation.email}</strong>.
                  You must sign in or create an account with this email to accept.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Invitation
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have access?{' '}
              <Link
                href={`/dashboard/${invitation.site.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Go to dashboard
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/login?invite=${token}`}
              className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In to Accept
            </Link>

            <Link
              href={`/register?invite=${token}`}
              className="block w-full text-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Create Account to Accept
            </Link>

            <p className="text-center text-xs text-gray-500 mt-4">
              By accepting this invitation, you agree to the terms and conditions
              of using this site
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
