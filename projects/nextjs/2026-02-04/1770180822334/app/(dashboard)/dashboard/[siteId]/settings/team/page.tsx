'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users,
  Mail,
  MoreVertical,
  Trash2,
  Shield,
  Eye,
  Edit3,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Ban
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    siteId: string
  }>
}

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  last_active_at: string | null
  profiles: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string
  profiles: {
    name: string
    email: string
  }
}

export default function TeamSettingsPage({ params }: PageProps) {
  const router = useRouter()
  const [siteId, setSiteId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('author')
  const [editRole, setEditRole] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [showInviteUrl, setShowInviteUrl] = useState(false)

  useEffect(() => {
    params.then(p => {
      setSiteId(p.siteId)
      fetchMembers(p.siteId)
      fetchInvitations(p.siteId)
    })
  }, [params])

  const fetchMembers = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}/members`)
      if (!res.ok) throw new Error('Failed to fetch members')
      const data = await res.json()
      setMembers(data.members || [])
      setCurrentUserRole(data.currentUserRole)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvitations = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}/invitations`)
      if (!res.ok) throw new Error('Failed to fetch invitations')
      const data = await res.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteId) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      const data = await res.json()
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      setInviteRole('author')
      setInviteUrl(data.inviteUrl)
      setShowInviteUrl(true)
      fetchInvitations(siteId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!siteId || !selectedMember) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success('Role updated successfully')
      setShowEditModal(false)
      setSelectedMember(null)
      fetchMembers(siteId)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveMember = async (member: Member) => {
    if (!siteId) return
    if (!confirm(`Remove ${member.profiles.name} from this site?`)) return

    try {
      const res = await fetch(`/api/sites/${siteId}/members/${member.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      toast.success('Member removed successfully')
      fetchMembers(siteId)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    if (!siteId) return

    try {
      const res = await fetch(`/api/sites/${siteId}/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend' })
      })

      if (!res.ok) throw new Error('Failed to resend invitation')

      toast.success('Invitation resent successfully')
      fetchInvitations(siteId)
    } catch (error) {
      toast.error('Failed to resend invitation')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!siteId) return

    try {
      const res = await fetch(`/api/sites/${siteId}/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' })
      })

      if (!res.ok) throw new Error('Failed to revoke invitation')

      toast.success('Invitation revoked successfully')
      fetchInvitations(siteId)
    } catch (error) {
      toast.error('Failed to revoke invitation')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-purple-500" />
      case 'author': return <Edit3 className="w-4 h-4 text-blue-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'author': return 'bg-blue-100 text-blue-700'
      case 'viewer': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isAdmin = currentUserRole === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Team Management
          </h1>
          <p className="mt-1 text-gray-600">
            Manage who has access to this site
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      {/* Current Members */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.profiles.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{member.profiles.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{member.profiles.email}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Joined {formatDate(member.joined_at)}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setEditRole(member.role)
                      setShowEditModal(true)
                    }}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {isAdmin && invitations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Invitations ({invitations.length})</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {invitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date()
              return (
                <div key={invitation.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{invitation.email}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadgeColor(invitation.role)}`}>
                        {getRoleIcon(invitation.role)}
                        {invitation.role}
                      </span>
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Invited {formatDate(invitation.created_at)} • Expires {formatDate(invitation.expires_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      Revoke
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invite User</h2>

            {showInviteUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Invitation Created!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Copy and share this link with the invitee:
                  </p>
                  <div className="mt-2 p-2 bg-white border border-green-200 rounded text-xs font-mono break-all">
                    {inviteUrl}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl)
                      toast.success('Link copied to clipboard')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setShowInviteUrl(false)
                      setInviteUrl('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer - Can view content</option>
                    <option value="author">Author - Can create and edit</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Role</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedMember.profiles.name}</div>
                  <div className="text-sm text-gray-600">{selectedMember.profiles.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer - Can view content</option>
                  <option value="author">Author - Can create and edit</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdateRole}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Role'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedMember(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
