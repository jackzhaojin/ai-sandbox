"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { FormField } from "./FormField"

export interface ContactInputValue {
  name: string
  phone?: string
  email?: string
}

export interface ContactInputProps {
  /** Current contact value */
  value: Partial<ContactInputValue>
  /** Callback when any field changes */
  onChange: (value: Partial<ContactInputValue>) => void
  /** Whether the contact fields are required */
  required?: boolean
  /** Additional CSS classes */
  className?: string
  /** Disable all fields */
  disabled?: boolean
  /** Label prefix (e.g., "Sender", "Recipient") */
  labelPrefix?: string
  /** Show only specific fields */
  fields?: Array<"name" | "phone" | "email">
}

/**
 * ContactInput - A reusable contact information input component
 * 
 * Collects name, phone, and email contact information.
 * 
 * @example
 * <ContactInput
 *   value={contact}
 *   onChange={setContact}
 *   labelPrefix="Sender"
 *   required
 *   fields={["name", "email"]}
 * />
 */
export function ContactInput({
  value,
  onChange,
  required = false,
  className,
  disabled = false,
  labelPrefix = "Contact",
  fields = ["name", "phone", "email"],
}: ContactInputProps) {
  const handleChange = React.useCallback(
    (field: keyof ContactInputValue, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue })
    },
    [value, onChange]
  )

  const showName = fields.includes("name")
  const showPhone = fields.includes("phone")
  const showEmail = fields.includes("email")

  return (
    <div className={cn("space-y-4", className)}>
      {showName && (
        <FormField
          label={`${labelPrefix} Name`}
          required={required}
          helpText="Primary contact person"
        >
          <Input
            placeholder="Full name"
            value={value.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={disabled}
            autoComplete="name"
          />
        </FormField>
      )}

      {showPhone && (
        <FormField
          label={`${labelPrefix} Phone`}
          helpText="For delivery notifications"
        >
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={value.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={disabled}
            autoComplete="tel"
          />
        </FormField>
      )}

      {showEmail && (
        <FormField
          label={`${labelPrefix} Email`}
          helpText="For shipping confirmations"
        >
          <Input
            type="email"
            placeholder="email@example.com"
            value={value.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={disabled}
            autoComplete="email"
          />
        </FormField>
      )}
    </div>
  )
}

export default ContactInput
