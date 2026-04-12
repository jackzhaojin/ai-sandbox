'use client'

import { ReviewSection, KeyValuePair, SectionGrid, Subsection, SectionDivider } from './ReviewSection'
import type { PickupData } from './types'
import { 
  PICKUP_LOCATION_TYPE_LABELS, 
  ACCESS_REQUIREMENT_LABELS, 
  PICKUP_EQUIPMENT_LABELS,
  LOADING_ASSISTANCE_LABELS,
  PREFERRED_CONTACT_METHOD_LABELS,
  AUTHORIZATION_LEVEL_LABELS,
} from '@/lib/validation'
import { Calendar, Clock, MapPin, Truck } from 'lucide-react'

interface PickupReviewSectionProps {
  data: PickupData | null
  shipmentId: string
}

export function PickupReviewSection({ data, shipmentId }: PickupReviewSectionProps) {
  const isComplete = !!data && 
    !!data.selectedPickup?.date && 
    !!data.selectedPickup?.timeSlot && 
    !!data.location?.locationType && 
    !!data.loading?.assistanceType &&
    !!data.contacts?.primary?.name &&
    !!data.contacts?.backup?.name

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return timeString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <ReviewSection
      title="Pickup Schedule"
      editHref={`/shipments/${shipmentId}/pickup`}
      isComplete={isComplete}
      incompleteMessage="Pickup scheduling information is incomplete. Please complete Step 4."
    >
      {data ? (
        <div className="space-y-6">
          {/* Date & Time Summary */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{formatDate(data.selectedPickup?.date)}</p>
                <p className="text-sm text-gray-600">
                  {data.selectedPickup?.timeSlot?.label || 'Time not selected'}
                </p>
                {data.selectedPickup?.readyTime && (
                  <p className="text-xs text-gray-500">
                    Ready by {formatTime(data.selectedPickup.readyTime)}
                  </p>
                )}
              </div>
              {data.selectedPickup?.timeSlot?.fee > 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">
                    +{formatCurrency(data.selectedPickup.timeSlot.fee)}
                  </p>
                  <p className="text-xs text-gray-500">Time slot fee</p>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time Details */}
          <Subsection title="Date & Time">
            <SectionGrid>
              <KeyValuePair
                label="Pickup Date"
                value={formatDate(data.selectedPickup?.date)}
              />
              <KeyValuePair
                label="Time Window"
                value={data.selectedPickup?.timeSlot?.label}
              />
              <KeyValuePair
                label="Ready Time"
                value={data.selectedPickup?.readyTime ? formatTime(data.selectedPickup.readyTime) : 'Not specified'}
              />
            </SectionGrid>
          </Subsection>

          <SectionDivider />

          {/* Location Type */}
          <Subsection title="Pickup Location">
            <SectionGrid>
              <KeyValuePair
                label="Location Type"
                value={data.location?.locationType ? 
                  PICKUP_LOCATION_TYPE_LABELS[data.location.locationType as keyof typeof PICKUP_LOCATION_TYPE_LABELS] : 
                  undefined
                }
              />
              {data.location?.dockNumber && (
                <KeyValuePair label="Dock Number" value={data.location.dockNumber} />
              )}
              {data.location?.otherDescription && (
                <KeyValuePair 
                  label="Description" 
                  value={data.location.otherDescription}
                  className="md:col-span-2"
                />
              )}
            </SectionGrid>
          </Subsection>

          <SectionDivider />

          {/* Access Requirements */}
          <Subsection title="Access Requirements">
            {data.access?.requirements && data.access.requirements.length > 0 ? (
              <>
                <ul className="space-y-2 mb-4">
                  {data.access.requirements.map((req) => (
                    <li key={req} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {ACCESS_REQUIREMENT_LABELS[req as keyof typeof ACCESS_REQUIREMENT_LABELS] || req}
                      </span>
                    </li>
                  ))}
                </ul>
                {data.access.gateCode && (
                  <KeyValuePair label="Gate Code" value={data.access.gateCode} />
                )}
                {data.access.parkingInstructions && (
                  <KeyValuePair 
                    label="Parking Instructions" 
                    value={data.access.parkingInstructions}
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <p className="text-gray-500 text-sm italic">No special access requirements</p>
            )}
          </Subsection>

          <SectionDivider />

          {/* Equipment */}
          <Subsection title="Equipment Needs">
            {data.equipment?.equipment && data.equipment.equipment.length > 0 ? (
              <ul className="space-y-2">
                {data.equipment.equipment.map((eq) => (
                  <li key={eq} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {PICKUP_EQUIPMENT_LABELS[eq as keyof typeof PICKUP_EQUIPMENT_LABELS] || eq}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No special equipment requested</p>
            )}
          </Subsection>

          <SectionDivider />

          {/* Loading Assistance */}
          <Subsection title="Loading Assistance">
            <KeyValuePair
              label="Assistance Type"
              value={data.loading?.assistanceType ? 
                LOADING_ASSISTANCE_LABELS[data.loading.assistanceType as keyof typeof LOADING_ASSISTANCE_LABELS] : 
                undefined
              }
            />
          </Subsection>

          <SectionDivider />

          {/* Contacts */}
          <Subsection title="Contact Information">
            <div className="space-y-4">
              {/* Primary Contact */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Primary Contact</p>
                <SectionGrid>
                  <KeyValuePair label="Name" value={data.contacts?.primary?.name} />
                  {data.contacts?.primary?.jobTitle && (
                    <KeyValuePair label="Job Title" value={data.contacts.primary.jobTitle} />
                  )}
                  <KeyValuePair label="Mobile Phone" value={data.contacts?.primary?.mobilePhone} />
                  {data.contacts?.primary?.altPhone && (
                    <KeyValuePair label="Alt Phone" value={data.contacts.primary.altPhone} />
                  )}
                  <KeyValuePair label="Email" value={data.contacts?.primary?.email} />
                  <KeyValuePair 
                    label="Preferred Contact" 
                    value={data.contacts?.primary?.preferredMethod ? 
                      PREFERRED_CONTACT_METHOD_LABELS[data.contacts.primary.preferredMethod as keyof typeof PREFERRED_CONTACT_METHOD_LABELS] : 
                      undefined
                    } 
                  />
                </SectionGrid>
              </div>

              {/* Backup Contact */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Backup Contact</p>
                <SectionGrid>
                  <KeyValuePair label="Name" value={data.contacts?.backup?.name} />
                  <KeyValuePair label="Phone" value={data.contacts?.backup?.phone} />
                  {data.contacts?.backup?.email && (
                    <KeyValuePair label="Email" value={data.contacts.backup.email} />
                  )}
                </SectionGrid>
              </div>
            </div>
          </Subsection>

          <SectionDivider />

          {/* Authorized Personnel */}
          <Subsection title="Authorized Personnel">
            {data.authorizedPersonnel?.anyoneAtLocation ? (
              <p className="text-sm text-gray-700">Anyone at the location can authorize pickup</p>
            ) : data.authorizedPersonnel?.personnelList && data.authorizedPersonnel.personnelList.length > 0 ? (
              <ul className="space-y-2">
                {data.authorizedPersonnel.personnelList.map((person, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{person.name}</span>
                    <span className="text-gray-500">
                      {AUTHORIZATION_LEVEL_LABELS[person.authorizationLevel as keyof typeof AUTHORIZATION_LEVEL_LABELS] || person.authorizationLevel}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No specific authorized personnel listed</p>
            )}
          </Subsection>

          {/* Special Authorization (High-Value) */}
          {data.specialAuthorization && (
            <>
              <SectionDivider />
              <Subsection title="Security Authorization">
                <SectionGrid>
                  <KeyValuePair 
                    label="ID Verification Required" 
                    value={data.specialAuthorization.idVerificationRequired ? 'Yes' : 'No'} 
                  />
                  <KeyValuePair 
                    label="Signature Required" 
                    value={data.specialAuthorization.signatureRequired ? 'Yes' : 'No'} 
                  />
                  <KeyValuePair 
                    label="Photo ID Matching" 
                    value={data.specialAuthorization.photoIdMatching ? 'Yes' : 'No'} 
                  />
                </SectionGrid>
              </Subsection>
            </>
          )}

          <SectionDivider />

          {/* Notifications */}
          <Subsection title="Notification Preferences">
            <SectionGrid columns={3}>
              <KeyValuePair 
                label="24hr Email Reminder" 
                value={data.notifications?.emailReminder24h ? 'Enabled' : 'Disabled'} 
              />
              <KeyValuePair 
                label="2hr SMS Reminder" 
                value={data.notifications?.smsReminder2h ? 'Enabled' : 'Disabled'} 
              />
              <KeyValuePair 
                label="30min Call Reminder" 
                value={data.notifications?.callReminder30m ? 'Enabled' : 'Disabled'} 
              />
              <KeyValuePair 
                label="Driver En Route" 
                value={data.notifications?.driverEnroute ? 'Enabled' : 'Disabled'} 
              />
              <KeyValuePair 
                label="Pickup Completion" 
                value={data.notifications?.pickupCompletion ? 'Enabled' : 'Disabled'} 
              />
              <KeyValuePair 
                label="Transit Updates" 
                value={data.notifications?.transitUpdates ? 'Enabled' : 'Disabled'} 
              />
            </SectionGrid>
          </Subsection>

          {/* Special Instructions */}
          {(data.specialInstructions?.gateCode || 
            data.specialInstructions?.parkingLoading || 
            data.specialInstructions?.packageLocation || 
            data.specialInstructions?.driverInstructions) && (
            <>
              <SectionDivider />
              <Subsection title="Special Instructions">
                <div className="space-y-3">
                  {data.specialInstructions.gateCode && (
                    <KeyValuePair label="Gate Code" value={data.specialInstructions.gateCode} />
                  )}
                  {data.specialInstructions.parkingLoading && (
                    <KeyValuePair label="Parking/Loading" value={data.specialInstructions.parkingLoading} />
                  )}
                  {data.specialInstructions.packageLocation && (
                    <KeyValuePair label="Package Location" value={data.specialInstructions.packageLocation} />
                  )}
                  {data.specialInstructions.driverInstructions && (
                    <KeyValuePair 
                      label="Driver Instructions" 
                      value={data.specialInstructions.driverInstructions}
                      className="md:col-span-2"
                    />
                  )}
                </div>
              </Subsection>
            </>
          )}

          {/* Fees Summary */}
          {data.fees && (
            <>
              <SectionDivider />
              <Subsection title="Pickup Fees">
                <div className="space-y-2">
                  {data.fees.timeSlotFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time Slot Fee</span>
                      <span className="font-medium">{formatCurrency(data.fees.timeSlotFee)}</span>
                    </div>
                  )}
                  {data.fees.locationFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location Fee</span>
                      <span className="font-medium">{formatCurrency(data.fees.locationFee)}</span>
                    </div>
                  )}
                  {data.fees.equipmentFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Equipment Fee</span>
                      <span className="font-medium">{formatCurrency(data.fees.equipmentFee)}</span>
                    </div>
                  )}
                  {data.fees.loadingFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Loading Fee</span>
                      <span className="font-medium">{formatCurrency(data.fees.loadingFee)}</span>
                    </div>
                  )}
                  {data.fees.accessFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Access Fee</span>
                      <span className="font-medium">{formatCurrency(data.fees.accessFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total Pickup Fees</span>
                      <span>{formatCurrency(data.fees.totalFee)}</span>
                    </div>
                  </div>
                </div>
              </Subsection>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No pickup information available</p>
      )}
    </ReviewSection>
  )
}
