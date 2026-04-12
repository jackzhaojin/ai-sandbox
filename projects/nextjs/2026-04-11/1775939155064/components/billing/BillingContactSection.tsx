"use client"

import { Control, Controller, FieldErrors } from "react-hook-form"
import { User, Briefcase, Phone, Mail, Building, Hash, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface BillingContactSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  disabled?: boolean
}

export function BillingContactSection({
  control,
  errors,
  disabled = false,
}: BillingContactSectionProps) {
  const getFieldError = (fieldName: string) => {
    return errors[fieldName]?.message as string | undefined
  }

  return (
    <div className={cn("space-y-6", disabled && "opacity-60")}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Billing Contact</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Name */}
        <Controller
          name="billingContactName"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingContactName" className="text-gray-700">
                Contact Name <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingContactName"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., Jane Smith"
                  className="pl-10"
                  disabled={disabled}
                  aria-invalid={!!getFieldError("billingContactName")}
                />
              </div>
              {getFieldError("billingContactName") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingContactName")}</p>
              )}
            </div>
          )}
        />

        {/* Job Title */}
        <Controller
          name="billingContactTitle"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingContactTitle" className="text-gray-700">
                Job Title <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingContactTitle"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., Accounts Payable Manager"
                  className="pl-10"
                  disabled={disabled}
                  aria-invalid={!!getFieldError("billingContactTitle")}
                />
              </div>
              {getFieldError("billingContactTitle") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingContactTitle")}</p>
              )}
            </div>
          )}
        />

        {/* Phone Number */}
        <Controller
          name="billingContactPhone"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingContactPhone" className="text-gray-700">
                Phone Number <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingContactPhone"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="555-123-4567"
                  className="pl-10"
                  disabled={disabled}
                  aria-invalid={!!getFieldError("billingContactPhone")}
                />
              </div>
              {getFieldError("billingContactPhone") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingContactPhone")}</p>
              )}
            </div>
          )}
        />

        {/* Email Address */}
        <Controller
          name="billingContactEmail"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingContactEmail" className="text-gray-700">
                Email Address <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingContactEmail"
                  type="email"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="billing@company.com"
                  className="pl-10"
                  disabled={disabled}
                  aria-invalid={!!getFieldError("billingContactEmail")}
                />
              </div>
              {getFieldError("billingContactEmail") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingContactEmail")}</p>
              )}
            </div>
          )}
        />

        {/* Department */}
        <Controller
          name="billingContactDepartment"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingContactDepartment" className="text-gray-700">
                Department
              </Label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingContactDepartment"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., Finance"
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
              {getFieldError("billingContactDepartment") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingContactDepartment")}</p>
              )}
            </div>
          )}
        />

        {/* GL Code */}
        <Controller
          name="billingGLCode"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="billingGLCode" className="text-gray-700">
                GL Code
              </Label>
              <div className="relative mt-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingGLCode"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., 6100-SHIPPING"
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
              {getFieldError("billingGLCode") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingGLCode")}</p>
              )}
            </div>
          )}
        />

        {/* Tax ID / EIN */}
        <Controller
          name="billingTaxId"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-2">
              <Label htmlFor="billingTaxId" className="text-gray-700">
                Tax ID / EIN
              </Label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="billingTaxId"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="XX-XXXXXXX"
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
              {getFieldError("billingTaxId") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("billingTaxId")}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Federal Employer Identification Number or Business Tax ID
              </p>
            </div>
          )}
        />
      </div>
    </div>
  )
}
