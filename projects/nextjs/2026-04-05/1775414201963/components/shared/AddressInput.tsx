"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FormField } from "./FormField"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
]

export interface AddressInputValue {
  label?: string
  recipientName: string
  recipientPhone?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface AddressInputProps {
  /** Current address value */
  value: Partial<AddressInputValue>
  /** Callback when any field changes */
  onChange: (value: Partial<AddressInputValue>) => void
  /** Whether to show the label field */
  showLabel?: boolean
  /** Whether the address is required */
  required?: boolean
  /** Additional CSS classes */
  className?: string
  /** Disable all fields */
  disabled?: boolean
  /** Show recipient fields */
  showRecipient?: boolean
  /** Default country (ISO code) */
  defaultCountry?: string
}

/**
 * AddressInput - A reusable address input component
 * 
 * Collects full address information including recipient details,
 * street address, city, state, ZIP, and country.
 * 
 * @example
 * <AddressInput
 *   value={address}
 *   onChange={setAddress}
 *   showLabel
 *   showRecipient
 *   required
 * />
 */
export function AddressInput({
  value,
  onChange,
  showLabel = false,
  required = false,
  className,
  disabled = false,
  showRecipient = true,
  defaultCountry = "US",
}: AddressInputProps) {
  const handleChange = React.useCallback(
    (field: keyof AddressInputValue, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue })
    },
    [value, onChange]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <FormField
          label="Address Label"
          helpText="e.g., Main Office, Warehouse"
          required={required}
        >
          <Input
            placeholder="Enter a label for this address"
            value={value.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            disabled={disabled}
          />
        </FormField>
      )}

      {showRecipient && (
        <>
          <FormField
            label="Recipient Name"
            required={required}
          >
            <Input
              placeholder="Full name"
              value={value.recipientName || ""}
              onChange={(e) => handleChange("recipientName", e.target.value)}
              disabled={disabled}
              autoComplete="name"
            />
          </FormField>

          <FormField
            label="Recipient Phone"
            helpText="For delivery contact"
          >
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={value.recipientPhone || ""}
              onChange={(e) => handleChange("recipientPhone", e.target.value)}
              disabled={disabled}
              autoComplete="tel"
            />
          </FormField>
        </>
      )}

      <FormField
        label="Street Address"
        required={required}
      >
        <Input
          placeholder="123 Main Street"
          value={value.line1 || ""}
          onChange={(e) => handleChange("line1", e.target.value)}
          disabled={disabled}
          autoComplete="address-line1"
        />
      </FormField>

      <FormField label="Apartment, Suite, etc. (Optional)">
        <Input
          placeholder="Apt 4B, Suite 100, etc."
          value={value.line2 || ""}
          onChange={(e) => handleChange("line2", e.target.value)}
          disabled={disabled}
          autoComplete="address-line2"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="City" required={required}>
          <Input
            placeholder="City"
            value={value.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={disabled}
            autoComplete="address-level2"
          />
        </FormField>

        <FormField label="State" required={required}>
          <Select
            value={value.state || ""}
            onValueChange={(val) => handleChange("state", val || "")}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="ZIP Code" required={required}>
          <Input
            placeholder="12345"
            value={value.postalCode || ""}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            disabled={disabled}
            autoComplete="postal-code"
          />
        </FormField>

        <FormField label="Country" required={required}>
          <Select
            value={value.country || defaultCountry}
            onValueChange={(val) => handleChange("country", val || "")}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="MX">Mexico</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="JP">Japan</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </div>
  )
}

export default AddressInput
