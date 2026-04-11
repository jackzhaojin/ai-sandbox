"use client"

import { Control, Controller } from "react-hook-form"
import { FieldErrors } from "react-hook-form"
import { User, Building2, Phone, Mail, Hash } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ContactInputProps {
  prefix: "origin" | "destination" | "billing"
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
}

export function ContactInput({ prefix, control, errors }: ContactInputProps) {
  const getFieldError = (fieldName: string) => {
    return errors[`${prefix}${fieldName}`]?.message as string | undefined
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <Controller
        name={`${prefix}Name`}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor={`${prefix}Name`} className="text-gray-700">
              Contact Name <span className="text-red-600">*</span>
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`${prefix}Name`}
                {...field}
                value={field.value || ""}
                placeholder="John Smith"
                className="pl-10"
                aria-invalid={!!getFieldError("Name")}
              />
            </div>
            {getFieldError("Name") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("Name")}</p>
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
            <Label htmlFor={`${prefix}Company`} className="text-gray-700">
              Company Name (Optional)
            </Label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`${prefix}Company`}
                {...field}
                value={field.value || ""}
                placeholder="Acme Corporation"
                className="pl-10"
              />
            </div>
            {getFieldError("Company") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("Company")}</p>
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
                <Label htmlFor={`${prefix}Phone`} className="text-gray-700">
                  Phone Number <span className="text-red-600">*</span>
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`${prefix}Phone`}
                    {...field}
                    value={field.value || ""}
                    placeholder="555-123-4567"
                    className="pl-10"
                    aria-invalid={!!getFieldError("Phone")}
                  />
                </div>
                {getFieldError("Phone") && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError("Phone")}</p>
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
                <Label htmlFor={`${prefix}Extension`} className="text-gray-700">
                  Ext.
                </Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={`${prefix}Extension`}
                    {...field}
                    value={field.value || ""}
                    placeholder="123"
                    className="pl-10"
                  />
                </div>
                {getFieldError("Extension") && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError("Extension")}</p>
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
            <Label htmlFor={`${prefix}Email`} className="text-gray-700">
              Email Address <span className="text-red-600">*</span>
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`${prefix}Email`}
                type="email"
                {...field}
                value={field.value || ""}
                placeholder="john@example.com"
                className="pl-10"
                aria-invalid={!!getFieldError("Email")}
              />
            </div>
            {getFieldError("Email") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("Email")}</p>
            )}
          </div>
        )}
      />
    </div>
  )
}
