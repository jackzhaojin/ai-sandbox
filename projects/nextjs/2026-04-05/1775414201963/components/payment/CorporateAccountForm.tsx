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
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================
// ZOD SCHEMA & TYPES
// ============================================

export interface CorporateBillingContact {
  name: string;
  email: string;
  phone: string;
}

export interface CorporateAccountFormData {
  accountNumber: string;
  accountPin: string;
  billingContact: CorporateBillingContact;
}

export interface CorporateAccountFormProps {
  /** Initial form values */
  defaultValues?: Partial<CorporateAccountFormData>;
  /** Pre-filled billing contact from user profile */
  prefilledContact?: Partial<CorporateBillingContact>;
  /** Callback when form is submitted */
  onSubmit?: (data: CorporateAccountFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<CorporateAccountFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

// Phone number regex for US format
const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

// Account PIN regex - 4-6 digits
const pinRegex = /^\d{4,6}$/;

// Main form schema
const corporateAccountSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account Number is required")
    .min(5, "Account Number must be at least 5 characters")
    .max(50, "Account Number must be 50 characters or less")
    .regex(
      /^[A-Z0-9\-]+$/i,
      "Account Number can only contain letters, numbers, and hyphens"
    ),
  accountPin: z
    .string()
    .min(1, "Account PIN is required")
    .regex(pinRegex, "Account PIN must be 4-6 digits"),
  billingContact: z.object({
    name: z
      .string()
      .min(1, "Contact name is required")
      .min(2, "Contact name must be at least 2 characters")
      .max(100, "Contact name must be 100 characters or less"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(100, "Email must be 100 characters or less"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(phoneRegex, "Please enter a valid 10-digit phone number"),
  }),
});

type CorporateAccountSchemaType = z.infer<typeof corporateAccountSchema>;

// ============================================
// COMPONENT
// ============================================

/**
 * CorporateAccountForm - Form for Corporate Account payment method
 *
 * Fields:
 * - Account Number: Required, alphanumeric with hyphens
 * - Account PIN: Required, 4-6 digits, password input with toggle
 * - Billing Contact: Pre-filled from profile, editable
 *   - Name
 *   - Email
 *   - Phone
 *
 * Uses React Hook Form with Zod validation.
 */
export function CorporateAccountForm({
  defaultValues,
  prefilledContact,
  onSubmit,
  onChange,
  className,
  disabled = false,
}: CorporateAccountFormProps) {
  const [showPin, setShowPin] = React.useState(false);

  const form = useForm<CorporateAccountSchemaType>({
    resolver: zodResolver(corporateAccountSchema),
    defaultValues: {
      accountNumber: defaultValues?.accountNumber ?? "",
      accountPin: defaultValues?.accountPin ?? "",
      billingContact: {
        name: prefilledContact?.name ?? defaultValues?.billingContact?.name ?? "",
        email: prefilledContact?.email ?? defaultValues?.billingContact?.email ?? "",
        phone: prefilledContact?.phone ?? defaultValues?.billingContact?.phone ?? "",
      },
    },
    mode: "onBlur",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<CorporateAccountFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: CorporateAccountSchemaType) => {
    onSubmit?.(data as CorporateAccountFormData);
  };

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

  // Check if contact was pre-filled
  const isContactPrefilled =
    prefilledContact &&
    (prefilledContact.name || prefilledContact.email || prefilledContact.phone);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        {/* Account Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Account Information
          </h3>

          {/* Account Number */}
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Account Number
                  <span className="text-error-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., CORP-12345"
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
                  Your corporate account number with us
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account PIN */}
          <FormField
            control={form.control}
            name="accountPin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Account PIN
                  </span>
                  <span className="text-error-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter 4-6 digit PIN"
                      disabled={disabled}
                      className="pl-10 pr-10"
                      maxLength={6}
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  4-6 digit PIN for account verification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Billing Contact Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Billing Contact
            </h3>
            {isContactPrefilled && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Pre-filled from profile
              </span>
            )}
          </div>

          {isContactPrefilled && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Contact information has been pre-filled from your profile. You
                can edit it if needed for this billing contact.
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Name */}
          <FormField
            control={form.control}
            name="billingContact.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contact Name
                  <span className="text-error-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Full name"
                      disabled={disabled}
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Email */}
          <FormField
            control={form.control}
            name="billingContact.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email Address
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

          {/* Contact Phone */}
          <FormField
            control={form.control}
            name="billingContact.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone Number
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
        </div>

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

export default CorporateAccountForm;
