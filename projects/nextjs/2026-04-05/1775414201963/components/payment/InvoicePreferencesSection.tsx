"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

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
  FileText,
  Mail,
  Download,
  Calendar,
  Clock,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type InvoiceDeliveryMethod = "email" | "portal" | "both";
export type InvoiceFormat = "pdf" | "xml" | "edi" | "csv";
export type InvoiceFrequency = "immediate" | "daily" | "weekly" | "monthly";

export interface InvoicePreferences {
  deliveryMethod: InvoiceDeliveryMethod;
  format: InvoiceFormat;
  frequency: InvoiceFrequency;
}

export interface InvoicePreferencesSectionProps {
  /** Form field prefix (e.g., "invoicePreferences") */
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

const DELIVERY_METHOD_OPTIONS: {
  value: InvoiceDeliveryMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "email",
    label: "Email Only",
    description: "Invoices sent to billing contact email",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    value: "portal",
    label: "Customer Portal Only",
    description: "Access invoices through online portal",
    icon: <Download className="h-4 w-4" />,
  },
  {
    value: "both",
    label: "Email & Portal",
    description: "Receive via email and access in portal",
    icon: <FileText className="h-4 w-4" />,
  },
];

const INVOICE_FORMAT_OPTIONS: {
  value: InvoiceFormat;
  label: string;
  description: string;
}[] = [
  { value: "pdf", label: "PDF", description: "Standard document format" },
  { value: "xml", label: "XML", description: "Structured data format" },
  { value: "edi", label: "EDI", description: "Electronic Data Interchange" },
  { value: "csv", label: "CSV", description: "Comma-separated values" },
];

const INVOICE_FREQUENCY_OPTIONS: {
  value: InvoiceFrequency;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "immediate",
    label: "Per Shipment",
    description: "Invoice generated immediately after shipment",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "daily",
    label: "Daily Summary",
    description: "Consolidated daily invoice",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    value: "weekly",
    label: "Weekly Summary",
    description: "Consolidated weekly invoice every Monday",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    value: "monthly",
    label: "Monthly Summary",
    description: "Consolidated monthly invoice on the 1st",
    icon: <Calendar className="h-4 w-4" />,
  },
];

// ============================================
// COMPONENT
// ============================================

/**
 * InvoicePreferencesSection - Reusable invoice preferences section
 *
 * Fields:
 * - Delivery Method: Email, Portal, or Both
 * - Format: PDF, XML, EDI, CSV
 * - Frequency: Immediate, Daily, Weekly, Monthly
 *
 * @example
 * <InvoicePreferencesSection name="invoicePreferences" />
 */
export function InvoicePreferencesSection({
  name = "invoicePreferences",
  className,
  disabled = false,
  label = "Invoice Preferences",
}: InvoicePreferencesSectionProps) {
  const { control } = useFormContext();

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        {label}
      </h3>

      {/* Delivery Method */}
      <Controller
        name={`${name}.deliveryMethod`}
        control={control}
        rules={{ required: "Delivery method is required" }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Delivery Method
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
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DELIVERY_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {field.value
                ? DELIVERY_METHOD_OPTIONS.find((o) => o.value === field.value)
                    ?.description
                : "How you want to receive your invoices"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Format and Frequency Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice Format */}
        <Controller
          name={`${name}.format`}
          control={control}
          rules={{ required: "Invoice format is required" }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Format
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
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INVOICE_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value
                  ? INVOICE_FORMAT_OPTIONS.find((o) => o.value === field.value)
                      ?.description
                  : "File format for your invoices"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Frequency */}
        <Controller
          name={`${name}.frequency`}
          control={control}
          rules={{ required: "Invoice frequency is required" }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Frequency
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
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INVOICE_FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value
                  ? INVOICE_FREQUENCY_OPTIONS.find((o) => o.value === field.value)
                      ?.description
                  : "How often invoices are generated"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default InvoicePreferencesSection;
