"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, User, Phone, Mail, Key, AlertCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { thirdPartyBillingSchema, type ThirdPartyBillingFormData } from "@/lib/validation"

interface ThirdPartyBillingFormProps {
  value?: Partial<ThirdPartyBillingFormData>
  onChange: (data: ThirdPartyBillingFormData) => void
  disabled?: boolean
  className?: string
  errors?: Record<string, string>
}

export function ThirdPartyBillingForm({
  value,
  onChange,
  disabled = false,
  className,
  errors = {},
}: ThirdPartyBillingFormProps) {
  const {
    register,
    formState: { errors: formErrors },
  } = useForm<ThirdPartyBillingFormData>({
    resolver: zodResolver(thirdPartyBillingSchema),
    defaultValues: {
      accountNumber: value?.accountNumber || "",
      companyName: value?.companyName || "",
      contactName: value?.contactName || "",
      contactPhone: value?.contactPhone || "",
      contactEmail: value?.contactEmail || "",
      authorizationCode: value?.authorizationCode || "",
    },
    mode: "onBlur",
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-900 mb-1">Third-Party Billing</h4>
            <p className="text-sm text-orange-700">
              A 2.5% processing fee applies to third-party billing. The third party will be invoiced directly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Number */}
        <div className="space-y-1.5">
          <label htmlFor="tpAccountNumber" className="block text-sm font-medium text-gray-700">
            Account Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("accountNumber")}
              id="tpAccountNumber"
              type="text"
              disabled={disabled}
              placeholder="e.g., 123456789"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.accountNumber?.message || errors.accountNumber)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.accountNumber?.message || errors.accountNumber) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.accountNumber?.message || errors.accountNumber}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div className="space-y-1.5">
          <label htmlFor="tpCompanyName" className="block text-sm font-medium text-gray-700">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("companyName")}
              id="tpCompanyName"
              type="text"
              disabled={disabled}
              placeholder="e.g., ABC Logistics Inc."
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.companyName?.message || errors.companyName)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.companyName?.message || errors.companyName) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.companyName?.message || errors.companyName}
            </p>
          )}
        </div>

        {/* Contact Name */}
        <div className="space-y-1.5">
          <label htmlFor="tpContactName" className="block text-sm font-medium text-gray-700">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("contactName")}
              id="tpContactName"
              type="text"
              disabled={disabled}
              placeholder="e.g., John Doe"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.contactName?.message || errors.contactName)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.contactName?.message || errors.contactName) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.contactName?.message || errors.contactName}
            </p>
          )}
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5">
          <label htmlFor="tpContactPhone" className="block text-sm font-medium text-gray-700">
            Contact Phone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("contactPhone")}
              id="tpContactPhone"
              type="tel"
              disabled={disabled}
              placeholder="e.g., 555-123-4567"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.contactPhone?.message || errors.contactPhone)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.contactPhone?.message || errors.contactPhone) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.contactPhone?.message || errors.contactPhone}
            </p>
          )}
        </div>

        {/* Contact Email */}
        <div className="space-y-1.5">
          <label htmlFor="tpContactEmail" className="block text-sm font-medium text-gray-700">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("contactEmail")}
              id="tpContactEmail"
              type="email"
              disabled={disabled}
              placeholder="e.g., billing@company.com"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.contactEmail?.message || errors.contactEmail)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.contactEmail?.message || errors.contactEmail) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.contactEmail?.message || errors.contactEmail}
            </p>
          )}
        </div>

        {/* Authorization Code */}
        <div className="space-y-1.5">
          <label htmlFor="tpAuthCode" className="block text-sm font-medium text-gray-700">
            Authorization Code
            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("authorizationCode")}
              id="tpAuthCode"
              type="text"
              disabled={disabled}
              placeholder="e.g., AUTH-12345"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.authorizationCode?.message || errors.authorizationCode)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.authorizationCode?.message || errors.authorizationCode) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.authorizationCode?.message || errors.authorizationCode}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
