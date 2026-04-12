"use client"

import { useId } from "react"
import { Control, Controller } from "react-hook-form"
import { FieldErrors } from "react-hook-form"
import { User, Building2, Phone, Mail, Hash, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ContactInputProps {
  prefix: "origin" | "destination" | "billing"
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
}

export function ContactInput({ prefix, control, errors }: ContactInputProps) {
  const baseId = useId()
  
  const getFieldError = (fieldName: string) => {
    return errors[`${prefix}${fieldName}`]?.message as string | undefined
  }

  const getInputId = (fieldName: string) => `${baseId}-${fieldName.toLowerCase()}`
  const getErrorId = (fieldName: string) => `${baseId}-${fieldName.toLowerCase()}-error`

  return (
    <div className="space-y-4">
      {/* Name */}
      <Controller
        name={`${prefix}Name`}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor={getInputId("Name")} className="text-gray-700">
              Contact Name <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id={getInputId("Name")}
                {...field}
                value={field.value || ""}
                placeholder="John Smith"
                className="pl-10"
                aria-invalid={!!getFieldError("Name")}
                aria-describedby={getFieldError("Name") ? getErrorId("Name") : undefined}
                aria-required="true"
                autoComplete="name"
              />
            </div>
            {getFieldError("Name") && (
              <p id={getErrorId("Name")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert" aria-live="assertive">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("Name")}
              </p>
            )}
          </div>
        )}
      />

      {/* Company */}
      <Controller
        name={`${prefix}Company`}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor={getInputId("Company")} className="text-gray-700">
              Company Name <span className="text-gray-500">(Optional)</span>
            </Label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id={getInputId("Company")}
                {...field}
                value={field.value || ""}
                placeholder="Acme Corporation"
                className="pl-10"
                aria-invalid={!!getFieldError("Company")}
                aria-describedby={getFieldError("Company") ? getErrorId("Company") : undefined}
                autoComplete="organization"
              />
            </div>
            {getFieldError("Company") && (
              <p id={getErrorId("Company")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("Company")}
              </p>
            )}
          </div>
        )}
      />

      {/* Phone and Extension */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Controller
            name={`${prefix}Phone`}
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor={getInputId("Phone")} className="text-gray-700">
                  Phone Number <span className="text-red-600" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <Input
                    id={getInputId("Phone")}
                    {...field}
                    value={field.value || ""}
                    placeholder="555-123-4567"
                    className="pl-10"
                    aria-invalid={!!getFieldError("Phone")}
                    aria-describedby={getFieldError("Phone") ? getErrorId("Phone") : undefined}
                    aria-required="true"
                    autoComplete="tel"
                    type="tel"
                  />
                </div>
                {getFieldError("Phone") && (
                  <p id={getErrorId("Phone")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert" aria-live="assertive">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    {getFieldError("Phone")}
                  </p>
                )}
              </div>
            )}
          />
        </div>
        <div>
          <Controller
            name={`${prefix}Extension`}
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor={getInputId("Extension")} className="text-gray-700">
                  Ext.
                </Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <Input
                    id={getInputId("Extension")}
                    {...field}
                    value={field.value || ""}
                    placeholder="123"
                    className="pl-10"
                    aria-invalid={!!getFieldError("Extension")}
                    aria-describedby={getFieldError("Extension") ? getErrorId("Extension") : undefined}
                    autoComplete="off"
                  />
                </div>
                {getFieldError("Extension") && (
                  <p id={getErrorId("Extension")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    {getFieldError("Extension")}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Email */}
      <Controller
        name={`${prefix}Email`}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor={getInputId("Email")} className="text-gray-700">
              Email Address <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id={getInputId("Email")}
                type="email"
                {...field}
                value={field.value || ""}
                placeholder="john@example.com"
                className="pl-10"
                aria-invalid={!!getFieldError("Email")}
                aria-describedby={getFieldError("Email") ? getErrorId("Email") : undefined}
                aria-required="true"
                autoComplete="email"
              />
            </div>
            {getFieldError("Email") && (
              <p id={getErrorId("Email")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert" aria-live="assertive">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("Email")}
              </p>
            )}
          </div>
        )}
      />
    </div>
  )
}
