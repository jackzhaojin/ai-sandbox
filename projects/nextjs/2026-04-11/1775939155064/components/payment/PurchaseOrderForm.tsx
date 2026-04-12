"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, DollarSign, User, Building, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { purchaseOrderSchema, type PurchaseOrderFormData } from "@/lib/validation"

interface PurchaseOrderFormProps {
  value?: Partial<PurchaseOrderFormData>
  onChange: (data: PurchaseOrderFormData) => void
  disabled?: boolean
  className?: string
  shipmentTotal?: number
  errors?: Record<string, string>
}

export function PurchaseOrderForm({
  value,
  onChange,
  disabled = false,
  className,
  shipmentTotal = 0,
  errors = {},
}: PurchaseOrderFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    watch,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      poNumber: value?.poNumber || "",
      poAmount: value?.poAmount || shipmentTotal,
      expirationDate: value?.expirationDate || "",
      approvalContact: value?.approvalContact || "",
      department: value?.department || "",
    },
    mode: "onBlur",
  })

  const watchedPoAmount = watch("poAmount")
  const amountError = shipmentTotal > 0 && watchedPoAmount && watchedPoAmount < shipmentTotal
    ? `PO amount must be at least $${shipmentTotal.toFixed(2)} (shipment total)`
    : undefined

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Purchase Order Payment</h4>
        <p className="text-sm text-blue-700">
          Enter your purchase order details. The PO amount must cover the full shipment cost.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PO Number */}
        <div className="space-y-1.5">
          <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">
            PO Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("poNumber")}
              id="poNumber"
              type="text"
              disabled={disabled}
              placeholder="e.g., PO-2024-001234"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.poNumber?.message || errors.poNumber)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.poNumber?.message || errors.poNumber) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.poNumber?.message || errors.poNumber}
            </p>
          )}
        </div>

        {/* PO Amount */}
        <div className="space-y-1.5">
          <label htmlFor="poAmount" className="block text-sm font-medium text-gray-700">
            PO Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("poAmount", { valueAsNumber: true })}
              id="poAmount"
              type="number"
              step="0.01"
              min={shipmentTotal || 0.01}
              disabled={disabled}
              placeholder="0.00"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.poAmount?.message || errors.poAmount || amountError)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.poAmount?.message || errors.poAmount || amountError) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.poAmount?.message || errors.poAmount || amountError}
            </p>
          )}
          {shipmentTotal > 0 && !amountError && (
            <p className="text-xs text-gray-500">
              Minimum required: ${shipmentTotal.toFixed(2)}
            </p>
          )}
        </div>

        {/* Expiration Date */}
        <div className="space-y-1.5">
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
            PO Expiration Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("expirationDate")}
              id="expirationDate"
              type="date"
              min={today}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.expirationDate?.message || errors.expirationDate)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.expirationDate?.message || errors.expirationDate) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.expirationDate?.message || errors.expirationDate}
            </p>
          )}
        </div>

        {/* Approval Contact */}
        <div className="space-y-1.5">
          <label htmlFor="approvalContact" className="block text-sm font-medium text-gray-700">
            Approval Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("approvalContact")}
              id="approvalContact"
              type="text"
              disabled={disabled}
              placeholder="e.g., Jane Smith"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.approvalContact?.message || errors.approvalContact)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.approvalContact?.message || errors.approvalContact) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.approvalContact?.message || errors.approvalContact}
            </p>
          )}
        </div>

        {/* Department */}
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("department")}
              id="department"
              type="text"
              disabled={disabled}
              placeholder="e.g., Procurement"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.department?.message || errors.department)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.department?.message || errors.department) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.department?.message || errors.department}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper icon component
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
