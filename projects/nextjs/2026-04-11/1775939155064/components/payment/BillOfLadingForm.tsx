"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Truck, Hash, AlertCircle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { billOfLadingSchema, type BillOfLadingFormData } from "@/lib/validation"

interface BillOfLadingFormProps {
  value?: Partial<BillOfLadingFormData>
  onChange: (data: BillOfLadingFormData) => void
  disabled?: boolean
  className?: string
  errors?: Record<string, string>
}

const FREIGHT_TERMS_OPTIONS = [
  { value: "prepaid", label: "Prepaid" },
  { value: "collect", label: "Collect" },
  { value: "third_party", label: "Third Party" },
]

export function BillOfLadingForm({
  value,
  onChange,
  disabled = false,
  className,
  errors = {},
}: BillOfLadingFormProps) {
  const {
    register,
    formState: { errors: formErrors },
  } = useForm<BillOfLadingFormData>({
    resolver: zodResolver(billOfLadingSchema),
    defaultValues: {
      bolNumber: value?.bolNumber || "",
      bolDate: value?.bolDate || "",
      shipperReference: value?.shipperReference || "",
      freightTerms: value?.freightTerms || undefined,
    },
    mode: "onBlur",
  })

  // Get today's date for max attribute
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Bill of Lading Payment</h4>
        <p className="text-sm text-blue-700">
          Enter your BOL details. BOL number must be in format BOL-YYYY-XXXXXX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BOL Number */}
        <div className="space-y-1.5">
          <label htmlFor="bolNumber" className="block text-sm font-medium text-gray-700">
            BOL Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("bolNumber")}
              id="bolNumber"
              type="text"
              disabled={disabled}
              placeholder="e.g., BOL-2024-123456"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.bolNumber?.message || errors.bolNumber)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.bolNumber?.message || errors.bolNumber) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.bolNumber?.message || errors.bolNumber}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Format: BOL-YYYY-XXXXXX
          </p>
        </div>

        {/* BOL Date */}
        <div className="space-y-1.5">
          <label htmlFor="bolDate" className="block text-sm font-medium text-gray-700">
            BOL Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("bolDate")}
              id="bolDate"
              type="date"
              max={today}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.bolDate?.message || errors.bolDate)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.bolDate?.message || errors.bolDate) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.bolDate?.message || errors.bolDate}
            </p>
          )}
          <p className="text-xs text-gray-500">Must be today or earlier</p>
        </div>

        {/* Shipper Reference */}
        <div className="space-y-1.5">
          <label htmlFor="shipperReference" className="block text-sm font-medium text-gray-700">
            Shipper Reference
            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("shipperReference")}
              id="shipperReference"
              type="text"
              disabled={disabled}
              placeholder="e.g., REF-12345"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.shipperReference?.message || errors.shipperReference)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.shipperReference?.message || errors.shipperReference) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.shipperReference?.message || errors.shipperReference}
            </p>
          )}
        </div>

        {/* Freight Terms */}
        <div className="space-y-1.5">
          <label htmlFor="freightTerms" className="block text-sm font-medium text-gray-700">
            Freight Terms <span className="text-red-500">*</span>
          </label>
          <select
            {...register("freightTerms")}
            id="freightTerms"
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              (formErrors.freightTerms?.message || errors.freightTerms)
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            )}
          >
            <option value="">Select freight terms</option>
            {FREIGHT_TERMS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {(formErrors.freightTerms?.message || errors.freightTerms) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.freightTerms?.message || errors.freightTerms}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
