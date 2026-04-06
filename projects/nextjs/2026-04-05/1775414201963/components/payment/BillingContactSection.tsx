"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  User,
  Briefcase,
  Phone,
  Mail,
  Building2,
  Hash,
  Receipt,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface BillingContact {
  name: string;
  title: string;
  phone: string;
  email: string;
  department: string;
  glCode: string;
  taxId: string;
}

export interface BillingContactSectionProps {
  /** Form field prefix (e.g., "billingContact") */
  name?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Label for the section */
  label?: string;
  /** Pre-filled contact data */
  defaultContact?: Partial<BillingContact>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
    6,
    10
  )}`;
};

// ============================================
// COMPONENT
// ============================================

/**
 * BillingContactSection - Reusable billing contact section
 *
 * Fields:
 * - Name: Required
 * - Title: Required
 * - Phone: Required, formatted
 * - Email: Required
 * - Department: Required
 * - GL Code: Required
 * - Tax ID: Required
 *
 * @example
 * <BillingContactSection
 *   name="billingContact"
 *   defaultContact={userProfile}
 * />
 */
export function BillingContactSection({
  name = "billingContact",
  className,
  disabled = false,
  label = "Billing Contact",
  defaultContact,
}: BillingContactSectionProps) {
  const { control, setValue } = useFormContext();

  // Pre-fill contact data on mount
  React.useEffect(() => {
    if (defaultContact) {
      Object.entries(defaultContact).forEach(([key, value]) => {
        if (value) {
          setValue(`${name}.${key}`, value, { shouldValidate: false });
        }
      });
    }
  }, [defaultContact, setValue, name]);

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <User className="h-5 w-5" />
        {label}
      </h3>

      {/* Name and Title Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <Controller
          name={`${name}.name`}
          control={control}
          rules={{
            required: "Contact name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
            maxLength: {
              value: 100,
              message: "Name must be 100 characters or less",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Name
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Full name"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <Controller
          name={`${name}.title`}
          control={control}
          rules={{
            required: "Title is required",
            minLength: {
              value: 2,
              message: "Title must be at least 2 characters",
            },
            maxLength: {
              value: 100,
              message: "Title must be 100 characters or less",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" />
                  Title
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Accounts Payable Manager"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Phone and Email Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <Controller
          name={`${name}.phone`}
          control={control}
          rules={{
            required: "Phone number is required",
            pattern: {
              value: /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
              message: "Please enter a valid 10-digit phone number",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  disabled={disabled}
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <Controller
          name={`${name}.email`}
          control={control}
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
            maxLength: {
              value: 100,
              message: "Email must be 100 characters or less",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="billing@company.com"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Department */}
      <Controller
        name={`${name}.department`}
        control={control}
        rules={{
          required: "Department is required",
          minLength: {
            value: 2,
            message: "Department must be at least 2 characters",
          },
          maxLength: {
            value: 100,
            message: "Department must be 100 characters or less",
          },
        }}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Department
              </span>
              <span className="text-error-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Finance, Procurement"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* GL Code and Tax ID Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GL Code */}
        <Controller
          name={`${name}.glCode`}
          control={control}
          rules={{
            required: "GL Code is required",
            minLength: {
              value: 3,
              message: "GL Code must be at least 3 characters",
            },
            maxLength: {
              value: 50,
              message: "GL Code must be 50 characters or less",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" />
                  GL Code
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 6100-TRAVEL"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>General Ledger account code</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax ID */}
        <Controller
          name={`${name}.taxId`}
          control={control}
          rules={{
            required: "Tax ID is required",
            pattern: {
              value: /^[0-9\-]{9,15}$/,
              message: "Please enter a valid Tax ID (9-15 characters)",
            },
          }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  Tax ID
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="XX-XXXXXXX"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>Business tax identification number</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default BillingContactSection;
