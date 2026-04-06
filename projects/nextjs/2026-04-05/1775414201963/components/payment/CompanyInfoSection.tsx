"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Building2,
  Store,
  Briefcase,
  Factory,
  Package,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type BusinessType =
  | "corporation"
  | "llc"
  | "partnership"
  | "sole_proprietorship"
  | "nonprofit"
  | "government"
  | "other";

export type Industry =
  | "technology"
  | "healthcare"
  | "manufacturing"
  | "retail"
  | "logistics"
  | "financial"
  | "education"
  | "construction"
  | "energy"
  | "other";

export type AnnualShippingVolume =
  | "under_100"
  | "100_to_500"
  | "500_to_1000"
  | "1000_to_5000"
  | "over_5000";

export interface CompanyInfo {
  legalName: string;
  dba?: string;
  businessType: BusinessType;
  industry: Industry;
  annualShippingVolume: AnnualShippingVolume;
}

export interface CompanyInfoSectionProps {
  /** Form field prefix (e.g., "companyInfo") */
  name?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Label for the section */
  label?: string;
}

// ============================================
// CONSTANTS
// ============================================

const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "Limited Liability Company (LLC)" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "nonprofit", label: "Non-Profit Organization" },
  { value: "government", label: "Government Entity" },
  { value: "other", label: "Other" },
];

const INDUSTRY_OPTIONS: { value: Industry; label: string }[] = [
  { value: "technology", label: "Technology & Software" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "financial", label: "Financial Services" },
  { value: "education", label: "Education" },
  { value: "construction", label: "Construction" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "other", label: "Other" },
];

const SHIPPING_VOLUME_OPTIONS: {
  value: AnnualShippingVolume;
  label: string;
}[] = [
  { value: "under_100", label: "Under 100 shipments/year" },
  { value: "100_to_500", label: "100 - 500 shipments/year" },
  { value: "500_to_1000", label: "500 - 1,000 shipments/year" },
  { value: "1000_to_5000", label: "1,000 - 5,000 shipments/year" },
  { value: "over_5000", label: "Over 5,000 shipments/year" },
];

// ============================================
// COMPONENT
// ============================================

/**
 * CompanyInfoSection - Reusable company information section
 *
 * Fields:
 * - Legal Name: Required
 * - DBA (Doing Business As): Optional
 * - Business Type: Required select
 * - Industry: Required select
 * - Annual Shipping Volume: Required select
 *
 * @example
 * <CompanyInfoSection name="companyInfo" />
 */
export function CompanyInfoSection({
  name = "companyInfo",
  className,
  disabled = false,
  label = "Company Information",
}: CompanyInfoSectionProps) {
  const { control } = useFormContext();

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        {label}
      </h3>

      {/* Legal Name */}
      <Controller
        name={`${name}.legalName`}
        control={control}
        rules={{
          required: "Legal name is required",
          minLength: {
            value: 2,
            message: "Legal name must be at least 2 characters",
          },
          maxLength: {
            value: 200,
            message: "Legal name must be 200 characters or less",
          },
        }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Legal Name
              </span>
              <span className="text-error-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Official registered company name"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Your company&apos;s legal registered name
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* DBA (Doing Business As) */}
      <Controller
        name={`${name}.dba`}
        control={control}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5" />
                DBA (Doing Business As)
              </span>
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Trading name, if different from legal name"
                disabled={disabled}
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Also known as trade name or fictitious business name
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Business Type and Industry Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Type */}
        <Controller
          name={`${name}.businessType`}
          control={control}
          rules={{ required: "Business type is required" }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" />
                  Business Type
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Industry */}
        <Controller
          name={`${name}.industry`}
          control={control}
          rules={{ required: "Industry is required" }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Factory className="h-3.5 w-3.5" />
                  Industry
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Annual Shipping Volume */}
      <Controller
        name={`${name}.annualShippingVolume`}
        control={control}
        rules={{ required: "Annual shipping volume is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5" />
                Annual Shipping Volume
              </span>
              <span className="text-error-500 ml-1">*</span>
            </FormLabel>
            <Select
              disabled={disabled}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping volume" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SHIPPING_VOLUME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Estimated number of shipments per year
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default CompanyInfoSection;
