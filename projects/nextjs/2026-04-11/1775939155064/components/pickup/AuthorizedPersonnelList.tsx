'use client'

import React from 'react'
import { Users, Plus, Trash2, Shield, UserCheck, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type AuthorizedPerson,
  type AuthorizationLevel,
  AUTHORIZATION_LEVEL_LABELS,
  AUTHORIZATION_LEVELS,
} from '@/types/pickup'

interface AuthorizedPersonnelListProps {
  anyoneAtLocation: boolean
  personnelList: AuthorizedPerson[]
  onAnyoneAtLocationChange: (value: boolean) => void
  onPersonnelListChange: (list: AuthorizedPerson[]) => void
  errors?: {
    anyoneAtLocation?: string
    personnelList?: string[]
  }
  disabled?: boolean
}

const AUTHORIZATION_ICONS: Record<AuthorizationLevel, React.ReactNode> = {
  full: <Shield className="h-4 w-4 text-green-600" />,
  limited: <UserCheck className="h-4 w-4 text-amber-600" />,
  notification_only: <Eye className="h-4 w-4 text-gray-600" />,
}

const AUTHORIZATION_DESCRIPTIONS: Record<AuthorizationLevel, string> = {
  full: 'Can release shipment and sign all documentation',
  limited: 'Can release shipment but cannot sign financial docs',
  notification_only: 'Will receive updates but cannot release shipment',
}

export function AuthorizedPersonnelList({
  anyoneAtLocation,
  personnelList,
  onAnyoneAtLocationChange,
  onPersonnelListChange,
  errors,
  disabled = false,
}: AuthorizedPersonnelListProps) {
  const handleAddPerson = () => {
    const newPerson: AuthorizedPerson = {
      name: '',
      authorizationLevel: 'limited',
    }
    onPersonnelListChange([...personnelList, newPerson])
  }

  const handleRemovePerson = (index: number) => {
    const newList = personnelList.filter((_, i) => i !== index)
    onPersonnelListChange(newList)
  }

  const handleUpdatePerson = (
    index: number,
    field: keyof AuthorizedPerson,
    value: string
  ) => {
    const newList = [...personnelList]
    newList[index] = { ...newList[index], [field]: value }
    onPersonnelListChange(newList)
  }

  const handleToggleAnyoneAtLocation = (checked: boolean) => {
    onAnyoneAtLocationChange(checked)
  }

  return (
    <div className={cn('space-y-6', disabled && 'opacity-50')}>
      {/* "Anyone at Location" Toggle */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Checkbox
            id="anyone-at-location"
            checked={anyoneAtLocation}
            onChange={handleToggleAnyoneAtLocation}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="anyone-at-location"
              className="text-sm font-semibold text-blue-900 cursor-pointer"
            >
              Anyone at this location can authorize pickup
            </Label>
            <p className="text-sm text-blue-700 mt-1">
              Enable this if any employee at the pickup location can release the shipment.
              When disabled, only the people listed below will be authorized.
            </p>
          </div>
        </div>
      </div>

      {/* Personnel List */}
      {!anyoneAtLocation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">
                Authorized Personnel
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {personnelList.length} {personnelList.length === 1 ? 'person' : 'people'} added
            </span>
          </div>

          {personnelList.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">No authorized personnel</p>
              <p className="text-sm text-gray-500 mt-1">
                Add people who are authorized to release this shipment
              </p>
              <button
                type="button"
                onClick={handleAddPerson}
                disabled={disabled}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Person
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {personnelList.map((person, index) => (
                  <div
                    key={index}
                    className={cn(
                      'bg-white rounded-lg border p-4 transition-all',
                      errors?.personnelList?.[index]
                        ? 'border-red-300 bg-red-50/30'
                        : 'border-gray-200'
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name Input */}
                      <div className="space-y-2">
                        <Label
                          htmlFor={`person-name-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`person-name-${index}`}
                          type="text"
                          placeholder="e.g., Robert Johnson"
                          value={person.name}
                          onChange={(e) =>
                            handleUpdatePerson(index, 'name', e.target.value)
                          }
                          disabled={disabled}
                          className={cn(
                            errors?.personnelList?.[index]?.includes('name') &&
                              'border-red-500 focus:border-red-500 focus:ring-red-500'
                          )}
                        />
                      </div>

                      {/* Authorization Level Select */}
                      <div className="space-y-2">
                        <Label
                          htmlFor={`person-level-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Authorization Level <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id={`person-level-${index}`}
                          value={person.authorizationLevel}
                          onChange={(e) =>
                            handleUpdatePerson(
                              index,
                              'authorizationLevel',
                              e.target.value as AuthorizationLevel
                            )
                          }
                          disabled={disabled}
                          className={cn(
                            'w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
                          )}
                        >
                          {AUTHORIZATION_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {AUTHORIZATION_LEVEL_LABELS[level]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Authorization Description */}
                    <div className="mt-3 flex items-start gap-2">
                      {AUTHORIZATION_ICONS[person.authorizationLevel]}
                      <p className="text-sm text-gray-600">
                        {AUTHORIZATION_DESCRIPTIONS[person.authorizationLevel]}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(index)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              <button
                type="button"
                onClick={handleAddPerson}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Another Person
              </button>
            </>
          )}

          {errors?.personnelList && typeof errors.personnelList === 'string' && (
            <p className="text-sm text-red-600">{errors.personnelList}</p>
          )}
        </div>
      )}

      {/* Info Box when "Anyone at Location" is enabled */}
      {anyoneAtLocation && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Open Authorization Enabled
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Any employee at the pickup location can release this shipment.
                The driver will verify they work at the location before releasing packages.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
