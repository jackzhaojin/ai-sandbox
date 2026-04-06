"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle, Building2, User, Phone, Mail, Lock } from "lucide-react";

// ============================================
// ZOD SCHEMA & TYPES
// ============================================

export interface ThirdPartyBillingFormData {
  accountNumber: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  authorizationCode?: string;
}

export interface ThirdPartyBillingFormProps {
  /** Initial form values */
  defaultValues?: Partial<ThirdPartyBillingFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: ThirdPartyBillingFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<ThirdPartyBillingFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Shipment total for fee calculation */
  shipmentTotal?: number;
  /** Currency code */
  currency?: string;
}

// Phone number regex for US format: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXXXXXXXXX
const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

const thirdPartyBillingSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account Number is required")
    .min(4, "Account Number must be at least 4 characters")
    .max(50, "Account Number must be 50 characters or less")
    .regex(
      /^[A-Z0-9\-]+$/i,
      "Account Number can only contain letters, numbers, and hyphens"
    ),
  companyName: z
    .string()
    .min(1, "Company Name is required")
    .min(2, "Company Name must be at least 2 characters")
    .max(100, "Company Name must be 100 characters or less"),
  contactName: z
    .string()
    .min(1, "Contact Name is required")
    .min(2, "Contact Name must be at least 2 characters")
    .max(100, "Contact Name must be 100 characters or less"),
  contactPhone: z
    .string()
    .min(1, "Contact Phone is required")
    .regex(phoneRegex, "Please enter a valid 10-digit phone number"),
  contactEmail: z
    .string()
    .min(1, "Contact Email is required")
    .email("Please enter a valid email address")
    .max(100, "Contact Email must be 100 characters or less"),
  authorizationCode: z
    .string()
    .max(50, "Authorization Code must be 50 characters or less")
    .optional()
    .or(z.literal("")),
});

type ThirdPartyBillingSchemaType = z.infer<typeof thirdPartyBillingSchema>;

// ============================================
// COMPONENT
// ============================================

/**
 * ThirdPartyBillingForm - Form for Third-Party Billing payment method
 *
 * Fields:
 * - Account Number: Required, alphanumeric
 * - Company Name: Required, name of billing company
 * - Contact Name: Required, person responsible
 * - Contact Phone: Required, valid phone number
 * - Contact Email: Required, valid email
 * - Authorization Code: Optional, billing authorization
 *
 * Includes a 2.5% fee warning.
 * Uses React Hook Form with Zod validation.
 */
export function ThirdPartyBillingForm({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
  shipmentTotal = 0,
  currency = "USD",
}: ThirdPartyBillingFormProps) {
  const form = useForm<ThirdPartyBillingSchemaType>({
    resolver: zodResolver(thirdPartyBillingSchema),
    defaultValues: {
      accountNumber: defaultValues?.accountNumber ?? "",
      companyName: defaultValues?.companyName ?? "",
      contactName: defaultValues?.contactName ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      authorizationCode: defaultValues?.authorizationCode ?? "",
    },
    mode: "onBlur",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<ThirdPartyBillingFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: ThirdPartyBillingSchemaType) => {
    onSubmit?.(data as ThirdPartyBillingFormData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Calculate fee (2.5% of shipment total)
  const feeAmount = shipmentTotal * 0.025;

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-5", className)}
      >
        {/* Fee Warning */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-medium">Fee Notice:</span> A 2.5% processing fee
            {shipmentTotal > 0 && (
              <span> ({formatCurrency(feeAmount)})</span>
            )}{" "}
            will be added to your shipment total for third-party billing.
          </AlertDescription>
        </Alert>

        {/* Account Number */}
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Account Number
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., TP-12345-AB"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value.toUpperCase());
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Third-party billing account number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Name */}
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Company Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., ABC Logistics Inc."
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Name of the company being billed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Name */}
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., John Smith"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Primary contact person at the billing company
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Phone */}
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact Phone
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="(555) 123-4567"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Phone number for billing inquiries
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Email */}
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contact Email
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="billing@example.com"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Email address for billing notifications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authorization Code */}
        <FormField
          control={form.control}
          name="authorizationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authorization Code</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., AUTH-12345 (optional)"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                    value={field.value || ""}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Optional authorization code for this billing arrangement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button (optional - can be controlled externally) */}
        {onSubmit && (
          <div className="pt-4">
            <Button
              type="submit"
              disabled={disabled || !form.formState.isValid}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

export default ThirdPartyBillingForm;
