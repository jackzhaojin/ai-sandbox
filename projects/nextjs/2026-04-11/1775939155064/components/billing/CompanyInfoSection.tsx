"use client"

import { Control, Controller, FieldErrors } from "react-hook-form"
import { Building2, Tag, Truck, Factory, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Business types for dropdown
const BUSINESS_TYPES = [
  { value: "corporation", label: "Corporation (C-Corp, S-Corp)" },
  { value: "llc", label: "Limited Liability Company (LLC)" },
  { value: "partnership", label: "Partnership (LP, LLP)" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "nonprofit", label: "Non-Profit Organization" },
  { value: "government", label: "Government Entity" },
  { value: "cooperative", label: "Cooperative" },
  { value: "trust", label: "Trust/Estate" },
  { value: "other", label: "Other" },
] as const

// Industries for dropdown (40+ options)
const INDUSTRIES = [
  { value: "aerospace", label: "Aerospace & Defense" },
  { value: "agriculture", label: "Agriculture & Farming" },
  { value: "apparel", label: "Apparel & Fashion" },
  { value: "automotive", label: "Automotive" },
  { value: "biotechnology", label: "Biotechnology" },
  { value: "chemicals", label: "Chemicals" },
  { value: "construction", label: "Construction" },
  { value: "consulting", label: "Consulting & Professional Services" },
  { value: "consumer_goods", label: "Consumer Goods" },
  { value: "ecommerce", label: "E-commerce & Retail" },
  { value: "education", label: "Education" },
  { value: "electronics", label: "Electronics & Technology" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "entertainment", label: "Entertainment & Media" },
  { value: "financial", label: "Financial Services" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "healthcare", label: "Healthcare & Pharmaceuticals" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "insurance", label: "Insurance" },
  { value: "legal", label: "Legal Services" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "mining", label: "Mining & Metals" },
  { value: "nonprofit", label: "Non-Profit" },
  { value: "publishing", label: "Publishing & Printing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "renewable_energy", label: "Renewable Energy" },
  { value: "research", label: "Research & Development" },
  { value: "sports", label: "Sports & Recreation" },
  { value: "technology", label: "Technology & Software" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "textiles", label: "Textiles" },
  { value: "transportation", label: "Transportation & Warehousing" },
  { value: "utilities", label: "Utilities" },
  { value: "wholesale", label: "Wholesale & Distribution" },
  { value: "wine_spirits", label: "Wine & Spirits" },
  { value: "wood_paper", label: "Wood, Paper & Forestry" },
  { value: "other", label: "Other" },
] as const

// Annual shipping volume ranges
const SHIPPING_VOLUMES = [
  { value: "1-100", label: "1 - 100 shipments/year" },
  { value: "101-500", label: "101 - 500 shipments/year" },
  { value: "501-1000", label: "501 - 1,000 shipments/year" },
  { value: "1001-5000", label: "1,001 - 5,000 shipments/year" },
  { value: "5001-10000", label: "5,001 - 10,000 shipments/year" },
  { value: "10001-50000", label: "10,001 - 50,000 shipments/year" },
  { value: "50001+", label: "50,001+ shipments/year" },
] as const

interface CompanyInfoSectionProps {
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  disabled?: boolean
}

export function CompanyInfoSection({
  control,
  errors,
  disabled = false,
}: CompanyInfoSectionProps) {
  const getFieldError = (fieldName: string) => {
    return errors[fieldName]?.message as string | undefined
  }

  return (
    <div className={cn("space-y-6", disabled && "opacity-60")}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legal Company Name */}
        <Controller
          name="companyLegalName"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="companyLegalName" className="text-gray-700">
                Legal Company Name <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyLegalName"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., Acme Corporation Inc."
                  className="pl-10"
                  disabled={disabled}
                  aria-invalid={!!getFieldError("companyLegalName")}
                />
              </div>
              {getFieldError("companyLegalName") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("companyLegalName")}</p>
              )}
            </div>
          )}
        />

        {/* DBA (Doing Business As) */}
        <Controller
          name="companyDBA"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="companyDBA" className="text-gray-700">
                DBA (Doing Business As)
              </Label>
              <div className="relative mt-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyDBA"
                  {...field}
                  value={(field.value as string) || ""}
                  placeholder="e.g., Acme Shipping"
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
              {getFieldError("companyDBA") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("companyDBA")}</p>
              )}
            </div>
          )}
        />

        {/* Business Type */}
        <Controller
          name="companyBusinessType"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="companyBusinessType" className="text-gray-700">
                Business Type <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Factory className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={(field.value as string) || ""}
                  onChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="companyBusinessType" className="pl-10">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getFieldError("companyBusinessType") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("companyBusinessType")}</p>
              )}
            </div>
          )}
        />

        {/* Industry */}
        <Controller
          name="companyIndustry"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="companyIndustry" className="text-gray-700">
                Industry <span className="text-red-600">*</span>
              </Label>
              <div className="relative mt-1">
                <Factory className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={(field.value as string) || ""}
                  onChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="companyIndustry" className="pl-10">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getFieldError("companyIndustry") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("companyIndustry")}</p>
              )}
            </div>
          )}
        />

        {/* Annual Shipping Volume */}
        <Controller
          name="companyShippingVolume"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-2">
              <Label htmlFor="companyShippingVolume" className="text-gray-700">
                Annual Shipping Volume
              </Label>
              <div className="relative mt-1">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <BarChart3 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select
                  value={(field.value as string) || ""}
                  onChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="companyShippingVolume" className="pl-10 pr-10">
                    <SelectValue placeholder="Select annual shipping volume" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_VOLUMES.map((volume) => (
                      <SelectItem key={volume.value} value={volume.value}>
                        {volume.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getFieldError("companyShippingVolume") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("companyShippingVolume")}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This helps us provide appropriate service recommendations and pricing
              </p>
            </div>
          )}
        />
      </div>
    </div>
  )
}

// Export constants for use in validation and other components
export { BUSINESS_TYPES, INDUSTRIES, SHIPPING_VOLUMES }
