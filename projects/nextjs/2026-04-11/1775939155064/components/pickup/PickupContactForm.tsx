'use client'

import React from 'react'
import { User, Phone, Mail, Briefcase, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  type PrimaryContact,
  type BackupContact,
  type PreferredContactMethod,
  PREFERRED_CONTACT_METHOD_LABELS,
} from '@/types/pickup'

interface PickupContactFormProps {
  primaryContact: PrimaryContact
  backupContact: BackupContact
  onPrimaryChange: (contact: PrimaryContact) => void
  onBackupChange: (contact: BackupContact) => void
  errors?: {
    primary?: {
      name?: string
      jobTitle?: string
      mobilePhone?: string
      altPhone?: string
      email?: string
      preferredMethod?: string
    }
    backup?: {
      name?: string
      phone?: string
      email?: string
    }
  }
  disabled?: boolean
}

export function PickupContactForm({
  primaryContact,
  backupContact,
  onPrimaryChange,
  onBackupChange,
  errors,
  disabled = false,
}: PickupContactFormProps) {
  const handlePrimaryChange = (field: keyof PrimaryContact, value: string) => {
    onPrimaryChange({ ...primaryContact, [field]: value })
  }

  const handleBackupChange = (field: keyof BackupContact, value: string) => {
    onBackupChange({ ...backupContact, [field]: value })
  }

  const handlePreferredMethodChange = (method: string) => {
    onPrimaryChange({
      ...primaryContact,
      preferredMethod: method as PreferredContactMethod,
    })
  }

  return (
    <div className={cn('space-y-8', disabled && 'opacity-50')}>
      {/* Primary Contact Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Primary Contact
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          The main person responsible for coordinating the pickup
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="primary-name" className="text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="primary-name"
              type="text"
              placeholder="e.g., John Smith"
              value={primaryContact.name}
              onChange={(e) => handlePrimaryChange('name', e.target.value)}
              disabled={disabled}
              className={cn(
                errors?.primary?.name && 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )}
            />
            {errors?.primary?.name && (
              <p className="text-sm text-red-600">{errors.primary.name}</p>
            )}
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="primary-job-title" className="text-sm font-medium text-gray-700">
              Job Title
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary-job-title"
                type="text"
                placeholder="e.g., Shipping Manager"
                value={primaryContact.jobTitle || ''}
                onChange={(e) => handlePrimaryChange('jobTitle', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.primary?.jobTitle && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.primary?.jobTitle && (
              <p className="text-sm text-red-600">{errors.primary.jobTitle}</p>
            )}
          </div>

          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="primary-mobile" className="text-sm font-medium text-gray-700">
              Mobile Phone <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary-mobile"
                type="tel"
                placeholder="(555) 123-4567"
                value={primaryContact.mobilePhone}
                onChange={(e) => handlePrimaryChange('mobilePhone', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.primary?.mobilePhone && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.primary?.mobilePhone ? (
              <p className="text-sm text-red-600">{errors.primary.mobilePhone}</p>
            ) : (
              <p className="text-sm text-gray-500">Primary contact number for driver coordination</p>
            )}
          </div>

          {/* Alternate Phone */}
          <div className="space-y-2">
            <Label htmlFor="primary-alt-phone" className="text-sm font-medium text-gray-700">
              Alternate Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary-alt-phone"
                type="tel"
                placeholder="(555) 987-6543"
                value={primaryContact.altPhone || ''}
                onChange={(e) => handlePrimaryChange('altPhone', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.primary?.altPhone && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.primary?.altPhone && (
              <p className="text-sm text-red-600">{errors.primary.altPhone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="primary-email" className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="primary-email"
                type="email"
                placeholder="john.smith@company.com"
                value={primaryContact.email}
                onChange={(e) => handlePrimaryChange('email', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.primary?.email && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.primary?.email ? (
              <p className="text-sm text-red-600">{errors.primary.email}</p>
            ) : (
              <p className="text-sm text-gray-500">For pickup confirmations and notifications</p>
            )}
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-3 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">
              Preferred Contact Method <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={primaryContact.preferredMethod}
              onChange={handlePreferredMethodChange}
              className="flex flex-wrap gap-4"
            >
              {Object.entries(PREFERRED_CONTACT_METHOD_LABELS).map(([value, label]) => (
                <RadioGroupItem
                  key={value}
                  value={value}
                  disabled={disabled}
                  label={
                    <span className="flex items-center gap-2">
                      {value === 'phone' && <Phone className="h-4 w-4" />}
                      {value === 'email' && <Mail className="h-4 w-4" />}
                      {value === 'text' && <MessageSquare className="h-4 w-4" />}
                      {label}
                    </span>
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 transition-all',
                    primaryContact.preferredMethod === value
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300',
                    disabled && 'cursor-not-allowed'
                  )}
                />
              ))}
            </RadioGroup>
            {errors?.primary?.preferredMethod && (
              <p className="text-sm text-red-600">{errors.primary.preferredMethod}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Backup Contact Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Backup Contact
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          An alternate contact in case the primary contact is unavailable
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup Name */}
          <div className="space-y-2">
            <Label htmlFor="backup-name" className="text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="backup-name"
              type="text"
              placeholder="e.g., Jane Doe"
              value={backupContact.name}
              onChange={(e) => handleBackupChange('name', e.target.value)}
              disabled={disabled}
              className={cn(
                errors?.backup?.name && 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )}
            />
            {errors?.backup?.name ? (
              <p className="text-sm text-red-600">{errors.backup.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Must be different from primary contact</p>
            )}
          </div>

          {/* Backup Phone */}
          <div className="space-y-2">
            <Label htmlFor="backup-phone" className="text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="backup-phone"
                type="tel"
                placeholder="(555) 456-7890"
                value={backupContact.phone}
                onChange={(e) => handleBackupChange('phone', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.backup?.phone && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.backup?.phone ? (
              <p className="text-sm text-red-600">{errors.backup.phone}</p>
            ) : (
              <p className="text-sm text-gray-500">Must be different from primary mobile</p>
            )}
          </div>

          {/* Backup Email */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="backup-email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="backup-email"
                type="email"
                placeholder="jane.doe@company.com"
                value={backupContact.email || ''}
                onChange={(e) => handleBackupChange('email', e.target.value)}
                disabled={disabled}
                className={cn(
                  'pl-10',
                  errors?.backup?.email && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors?.backup?.email && (
              <p className="text-sm text-red-600">{errors.backup.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
