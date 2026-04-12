"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { corporateAccountSchema, type CorporateAccountFormData } from "@/lib/validation"

interface CorporateAccountFormProps {
  value?: Partial<CorporateAccountFormData>
  onChange: (data: CorporateAccountFormData) => void
  disabled?: boolean
  className?: string
  errors?: Record<string, string>
}

export function CorporateAccountForm({
  value,
  onChange,
  disabled = false,
  className,
  errors = {},
}: CorporateAccountFormProps) {
  const [showPin, setShowPin] = useState(false)

  const {
    register,
    formState: { errors: formErrors },
    watch,
  } = useForm<CorporateAccountFormData>({
    resolver: zodResolver(corporateAccountSchema),
    defaultValues: {
      accountNumber: value?.accountNumber || "",
      pin: value?.pin || "",
    },
    mode: "onBlur",
  })

  const watchedAccountNumber = watch("accountNumber")
  const watchedPin = watch("pin")
  const isValidLength = watchedPin?.length >= 4 && watchedPin?.length <= 6
  const isAllDigits = /^\d*$/.test(watchedPin || "")

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Corporate Account</h4>
            <p className="text-sm text-green-700">
              Use your pre-negotiated corporate rates. No additional fees apply.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Number */}
        <div className="space-y-1.5">
          <label htmlFor="corpAccountNumber" className="block text-sm font-medium text-gray-700">
            Account Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("accountNumber")}
              id="corpAccountNumber"
              type="text"
              disabled={disabled}
              placeholder="e.g., CORP-12345678"
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

        {/* PIN */}
        <div className="space-y-1.5">
          <label htmlFor="corpPin" className="block text-sm font-medium text-gray-700">
            4-6 Digit PIN <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("pin")}
              id="corpPin"
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              disabled={disabled}
              placeholder="••••••"
              className={cn(
                "w-full pl-10 pr-10 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.pin?.message || errors.pin)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              tabIndex={-1}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {(formErrors.pin?.message || errors.pin) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.pin?.message || errors.pin}
            </p>
          )}

          {/* PIN validation indicators */}
          {watchedPin && (
            <div className="flex items-center gap-3 text-xs">
              <span
                className={cn(
                  "flex items-center gap-1",
                  isValidLength ? "text-green-600" : "text-gray-500"
                )}
              >
                {isValidLength ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                4-6 digits
              </span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  isAllDigits ? "text-green-600" : "text-gray-500"
                )}
              >
                {isAllDigits ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-gray-300" />
                )}
                Numbers only
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Account verification note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Your account will be verified against our corporate database.
          If you don&apos;t have a corporate account yet, please contact your account manager
          or select a different payment method.
        </p>
      </div>
    </div>
  )
}
