'use client'

import React, { useState } from 'react'
import { RetroCard } from '@/components/ui/RetroCard'
import { RetroInput } from '@/components/ui/RetroInput'
import { RetroSelect } from '@/components/ui/RetroSelect'
import { RetroButton } from '@/components/ui/RetroButton'
import { useToast } from '@/lib/hooks/useToast'
import { useUIStore } from '@/store/ui'

interface User {
  id?: string
  name?: string | null
  email?: string | null
}

interface SettingsManagerProps {
  user: User
}

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
]

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' }
]

const REFRESH_INTERVAL_OPTIONS = [
  { value: '0', label: 'Disabled' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' }
]

export function SettingsManager({ user }: SettingsManagerProps) {
  const toast = useToast()
  const { theme, toggleTheme, notificationsEnabled, toggleNotifications } = useUIStore()

  // User preferences state
  const [displayName, setDisplayName] = useState(user.name || '')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timezone, setTimezone] = useState('UTC')

  // Dashboard settings state
  const [defaultDateRange, setDefaultDateRange] = useState('30')
  const [autoRefresh, setAutoRefresh] = useState('30')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Simulate API call - in a real app, this would save to the database
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setSaving(true)

    try {
      // Simulate API call - in a real app, this would update the password
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    const confirmText = 'DELETE'
    const userInput = prompt(
      `This action cannot be undone. Type "${confirmText}" to confirm:`
    )

    if (userInput !== confirmText) {
      return
    }

    try {
      // Simulate API call - in a real app, this would soft-delete the account
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Account deleted. Redirecting...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  async function handleExportData() {
    try {
      // Simulate API call - in a real app, this would fetch all user data
      const userData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        preferences: {
          dateFormat,
          timezone,
          theme,
          notifications: notificationsEnabled
        },
        exportDate: new Date().toISOString()
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('User data exported successfully')
    } catch (error) {
      toast.error('Failed to export user data')
    }
  }

  return (
    <div className="space-y-6">
      {/* User Preferences */}
      <RetroCard title="USER PREFERENCES">
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <RetroInput
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name..."
          />

          <div>
            <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
              Email Notifications
            </label>
            <label className="flex items-center gap-3 text-green-400 font-mono text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={toggleNotifications}
                className="w-5 h-5 bg-black border-2 border-green-500 checked:bg-green-500 cursor-pointer"
              />
              <span>Enable email notifications</span>
            </label>
          </div>

          <RetroSelect
            label="Date Format"
            options={DATE_FORMAT_OPTIONS}
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          />

          <RetroSelect
            label="Timezone"
            options={TIMEZONE_OPTIONS}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />

          <div>
            <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
              Theme
            </label>
            <label className="flex items-center gap-3 text-green-400 font-mono text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={theme === 'modern'}
                onChange={toggleTheme}
                className="w-5 h-5 bg-black border-2 border-green-500 checked:bg-green-500 cursor-pointer"
              />
              <span>Modern theme (toggle for retro)</span>
            </label>
          </div>

          <RetroButton type="submit" disabled={saving} variant="primary">
            {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
          </RetroButton>
        </form>
      </RetroCard>

      {/* Dashboard Settings */}
      <RetroCard title="DASHBOARD SETTINGS">
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <RetroSelect
            label="Default Date Range"
            options={[
              { value: '7', label: 'Last 7 Days' },
              { value: '30', label: 'Last 30 Days' },
              { value: '90', label: 'Last 90 Days' }
            ]}
            value={defaultDateRange}
            onChange={(e) => setDefaultDateRange(e.target.value)}
          />

          <RetroSelect
            label="Auto-Refresh Interval"
            options={REFRESH_INTERVAL_OPTIONS}
            value={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.value)}
          />

          <RetroButton type="submit" disabled={saving} variant="primary">
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </RetroButton>
        </form>
      </RetroCard>

      {/* Account Management */}
      <RetroCard title="CHANGE PASSWORD">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <RetroInput
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password..."
            required
          />

          <RetroInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password..."
            required
          />

          <RetroInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password..."
            required
          />

          <RetroButton type="submit" disabled={saving} variant="primary">
            {saving ? 'UPDATING...' : 'CHANGE PASSWORD'}
          </RetroButton>
        </form>
      </RetroCard>

      {/* Account Management Actions */}
      <RetroCard title="ACCOUNT MANAGEMENT">
        <div className="space-y-4">
          <div>
            <p className="text-green-400 font-mono text-sm mb-4">
              Export all your user data and preferences in JSON format.
            </p>
            <RetroButton onClick={handleExportData} variant="secondary">
              EXPORT USER DATA
            </RetroButton>
          </div>

          <div className="border-t-2 border-green-700 pt-4 mt-4">
            <p className="text-red-500 font-mono text-sm mb-4">
              &gt; WARNING: This action cannot be undone
            </p>
            <p className="text-green-400 font-mono text-sm mb-4">
              Deleting your account will permanently remove all your data,
              reports, and analytics history.
            </p>
            <RetroButton onClick={handleDeleteAccount} variant="danger">
              DELETE ACCOUNT
            </RetroButton>
          </div>
        </div>
      </RetroCard>
    </div>
  )
}
