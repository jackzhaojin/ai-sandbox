"use client"

import { Control, Controller, FieldErrors } from "react-hook-form"
import { Mail, FileText, Calendar, Send, Building2, Monitor, FileSpreadsheet } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Invoice delivery methods
const DELIVERY_METHODS = [
  {
    value: "email",
    label: "Email",
    description: "Invoices sent to billing contact email",
    icon: Send,
  },
  {
    value: "mail",
    label: "Postal Mail",
    description: "Physical invoices sent to billing address",
    icon: Mail,
  },
  {
    value: "edi",
    label: "EDI (Electronic Data Interchange)",
    description: "Automated electronic invoicing for enterprise systems",
    icon: FileSpreadsheet,
  },
  {
    value: "portal",
    label: "Customer Portal",
    description: "Access and download invoices from online portal",
    icon: Monitor,
  },
] as const

// Invoice formats
const INVOICE_FORMATS = [
  { value: "standard", label: "Standard", description: "Basic invoice with essential details" },
  { value: "itemized", label: "Itemized", description: "Detailed line-item breakdown" },
  { value: "summary", label: "Summary", description: "High-level summary only" },
  { value: "custom", label: "Custom", description: "Custom format with your branding" },
] as const

// Invoice frequencies
const INVOICE_FREQUENCIES = [
  { value: "per_shipment", label: "Per Shipment", description: "One invoice per shipment" },
  { value: "weekly", label: "Weekly", description: "Consolidated weekly invoices" },
  { value: "monthly", label: "Monthly", description: "Consolidated monthly statement" },
] as const

interface InvoicePreferencesSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  disabled?: boolean
}

export function InvoicePreferencesSection({
  control,
  errors,
  disabled = false,
}: InvoicePreferencesSectionProps) {
  const getFieldError = (fieldName: string) => {
    return errors[fieldName]?.message as string | undefined
  }

  return (
    <div className={cn("space-y-6", disabled && "opacity-60")}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Invoice Preferences</h3>
      </div>

      {/* Delivery Method */}
      <div>
        <Label className="text-gray-700 mb-3 block">
          Delivery Method <span className="text-red-600">*</span>
        </Label>
        <Controller
          name="invoiceDeliveryMethod"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DELIVERY_METHODS.map((method) => {
                const Icon = method.icon
                const isSelected = field.value === method.value
                return (
                  <label
                    key={method.value}
                    className={cn(
                      "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="invoiceDeliveryMethod"
                      value={method.value}
                      checked={isSelected}
                      onChange={() => field.onChange(method.value)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-md shrink-0",
                        isSelected ? "bg-blue-200" : "bg-blue-100"
                      )}>
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{method.description}</div>
                      </div>
                    </div>
                    <div className={cn(
                      "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white"
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        />
        {getFieldError("invoiceDeliveryMethod") && (
          <p className="mt-2 text-sm text-red-600">{getFieldError("invoiceDeliveryMethod")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        {/* Invoice Format */}
        <Controller
          name="invoiceFormat"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="invoiceFormat" className="text-gray-700">
                Invoice Format <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={(field.value as string) || ""}
                  onChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="invoiceFormat" className="pl-10">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div>{format.label}</div>
                          <div className="text-xs text-gray-500">{format.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getFieldError("invoiceFormat") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("invoiceFormat")}</p>
              )}
            </div>
          )}
        />

        {/* Invoice Frequency */}
        <Controller
          name="invoiceFrequency"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="invoiceFrequency" className="text-gray-700">
                Invoice Frequency <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={(field.value as string) || ""}
                  onChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="invoiceFrequency" className="pl-10">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_FREQUENCIES.map((frequency) => (
                      <SelectItem key={frequency.value} value={frequency.value}>
                        <div>
                          <div>{frequency.label}</div>
                          <div className="text-xs text-gray-500">{frequency.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getFieldError("invoiceFrequency") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("invoiceFrequency")}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900">Invoice Delivery Information</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your invoices will be delivered according to the preferences selected above. 
              For EDI integrations, our support team will contact you to configure your system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export constants for use in validation and other components
export { DELIVERY_METHODS, INVOICE_FORMATS, INVOICE_FREQUENCIES }
