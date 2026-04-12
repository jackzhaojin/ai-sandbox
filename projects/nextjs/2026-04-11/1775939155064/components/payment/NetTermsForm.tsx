"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, DollarSign, Upload, Plus, Trash2, Building, User, Phone, Mail, AlertCircle, AlertTriangle, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  netTermsSchema,
  type NetTermsFormData,
  NET_TERMS_OPTIONS,
  type NetTermOption,
  tradeReferenceSchema,
} from "@/lib/validation"
import { z } from "zod"

interface NetTermsFormProps {
  value?: Partial<NetTermsFormData>
  onChange: (data: NetTermsFormData) => void
  disabled?: boolean
  className?: string
  errors?: Record<string, string>
  onFileChange?: (file: File | null) => void
}

export function NetTermsForm({
  value,
  onChange,
  disabled = false,
  className,
  errors = {},
  onFileChange,
}: NetTermsFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const {
    register,
    control,
    formState: { errors: formErrors },
    watch,
  } = useForm<NetTermsFormData>({
    resolver: zodResolver(netTermsSchema),
    defaultValues: {
      paymentPeriod: (value?.paymentPeriod as NetTermOption) || 30,
      creditApplicationUrl: value?.creditApplicationUrl || "",
      tradeReferences: value?.tradeReferences?.length
        ? value.tradeReferences
        : [
            { companyName: "", contactName: "", phone: "", email: "", relationship: "" },
            { companyName: "", contactName: "", phone: "", email: "", relationship: "" },
            { companyName: "", contactName: "", phone: "", email: "", relationship: "" },
          ],
      annualRevenue: value?.annualRevenue || 0,
    },
    mode: "onBlur",
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tradeReferences",
  })

  const watchedTradeRefs = watch("tradeReferences")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be 10MB or smaller")
        return
      }
      // Validate file type
      if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        alert("File must be PDF, JPEG, or PNG")
        return
      }
      setUploadedFile(file)
      onFileChange?.(file)
    }
  }

  const addTradeReference = () => {
    if (fields.length < 5) {
      append({ companyName: "", contactName: "", phone: "", email: "", relationship: "" })
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Net Terms Application</h4>
            <p className="text-sm text-amber-700">
              A 1.5% processing fee applies to net terms. Credit approval may take 1-2 business days.
              At least 3 trade references are required.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Period */}
        <div className="space-y-1.5">
          <label htmlFor="paymentPeriod" className="block text-sm font-medium text-gray-700">
            Payment Period <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              {...register("paymentPeriod", { valueAsNumber: true })}
              id="paymentPeriod"
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.paymentPeriod?.message || errors.paymentPeriod)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            >
              {NET_TERMS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Net {option} Days
                </option>
              ))}
            </select>
          </div>
          {(formErrors.paymentPeriod?.message || errors.paymentPeriod) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.paymentPeriod?.message || errors.paymentPeriod}
            </p>
          )}
        </div>

        {/* Annual Revenue */}
        <div className="space-y-1.5">
          <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700">
            Annual Revenue (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("annualRevenue", { valueAsNumber: true })}
              id="annualRevenue"
              type="number"
              min="0"
              step="1000"
              disabled={disabled}
              placeholder="e.g., 500000"
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:bg-gray-100 disabled:cursor-not-allowed",
                (formErrors.annualRevenue?.message || errors.annualRevenue)
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              )}
            />
          </div>
          {(formErrors.annualRevenue?.message || errors.annualRevenue) && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {formErrors.annualRevenue?.message || errors.annualRevenue}
            </p>
          )}
        </div>
      </div>

      {/* Credit Application Upload */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Credit Application
          <span className="text-gray-400 font-normal ml-1">(Optional - PDF, JPEG, PNG, max 10MB)</span>
        </label>
        <div className="relative">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              "hover:border-gray-400 cursor-pointer",
              uploadedFile ? "border-green-300 bg-green-50" : "border-gray-300"
            )}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            {uploadedFile ? (
              <>
                <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                <p className="text-xs text-green-600">Click to change file</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Click to upload credit application</p>
                <p className="text-xs text-gray-500">PDF, JPEG, or PNG up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trade References */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Trade References
            <span className="text-red-500 ml-1">*</span>
            <span className="text-gray-500 font-normal ml-1 text-sm">(minimum 3 required)</span>
          </h4>
          {fields.length < 5 && (
            <button
              type="button"
              onClick={addTradeReference}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Reference
            </button>
          )}
        </div>

        {fields.length < 3 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              At least 3 trade references are required. Please add {3 - fields.length} more.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700">Reference #{index + 1}</h5>
                {fields.length > 3 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      {...register(`tradeReferences.${index}.companyName`)}
                      type="text"
                      disabled={disabled}
                      placeholder="Company name"
                      className={cn(
                        "w-full pl-8 pr-2 py-1.5 border rounded text-sm",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "disabled:bg-gray-100",
                        formErrors.tradeReferences?.[index]?.companyName
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      )}
                    />
                  </div>
                </div>

                {/* Contact Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      {...register(`tradeReferences.${index}.contactName`)}
                      type="text"
                      disabled={disabled}
                      placeholder="Contact name"
                      className={cn(
                        "w-full pl-8 pr-2 py-1.5 border rounded text-sm",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "disabled:bg-gray-100",
                        formErrors.tradeReferences?.[index]?.contactName
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      )}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      {...register(`tradeReferences.${index}.phone`)}
                      type="tel"
                      disabled={disabled}
                      placeholder="Phone number"
                      className={cn(
                        "w-full pl-8 pr-2 py-1.5 border rounded text-sm",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "disabled:bg-gray-100",
                        formErrors.tradeReferences?.[index]?.phone
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      )}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      {...register(`tradeReferences.${index}.email`)}
                      type="email"
                      disabled={disabled}
                      placeholder="Email address"
                      className={cn(
                        "w-full pl-8 pr-2 py-1.5 border rounded text-sm",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "disabled:bg-gray-100",
                        formErrors.tradeReferences?.[index]?.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      )}
                    />
                  </div>
                </div>

                {/* Relationship */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      {...register(`tradeReferences.${index}.relationship`)}
                      type="text"
                      disabled={disabled}
                      placeholder="e.g., Supplier, Vendor, Client"
                      className={cn(
                        "w-full pl-8 pr-2 py-1.5 border rounded text-sm",
                        "focus:outline-none focus:ring-1 focus:ring-blue-500",
                        "disabled:bg-gray-100",
                        formErrors.tradeReferences?.[index]?.relationship
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
