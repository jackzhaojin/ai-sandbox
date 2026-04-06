"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAfter, startOfDay, parseISO } from "date-fns";
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

// ============================================
// ZOD SCHEMA & TYPES
// ============================================

export interface PurchaseOrderFormData {
  poNumber: string;
  poAmount: number;
  expirationDate: string;
  approvalContact: string;
  department: string;
}

export interface PurchaseOrderFormProps {
  /** Minimum PO amount (typically the shipment total) */
  minAmount?: number;
  /** Currency code */
  currency?: string;
  /** Initial form values */
  defaultValues?: Partial<PurchaseOrderFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: PurchaseOrderFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<PurchaseOrderFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

// Base schema - minAmount validation will be done manually
const purchaseOrderSchema = z.object({
  poNumber: z
    .string()
    .min(1, "PO Number is required")
    .min(3, "PO Number must be at least 3 characters")
    .max(50, "PO Number must be 50 characters or less")
    .regex(
      /^[A-Z0-9\-]+$/i,
      "PO Number can only contain letters, numbers, and hyphens"
    ),
  poAmount: z
    .number()
    .min(0.01, "PO Amount must be greater than 0")
    .max(999999999.99, "PO Amount is too large"),
  expirationDate: z
    .string()
    .min(1, "Expiration date is required")
    .refine((date) => {
      const selectedDate = parseISO(date);
      const today = startOfDay(new Date());
      return isAfter(startOfDay(selectedDate), today);
    }, "Expiration date must be in the future"),
  approvalContact: z
    .string()
    .min(1, "Approval contact is required")
    .min(2, "Approval contact must be at least 2 characters")
    .max(100, "Approval contact must be 100 characters or less"),
  department: z
    .string()
    .min(1, "Department is required")
    .min(2, "Department must be at least 2 characters")
    .max(100, "Department must be 100 characters or less"),
});

// ============================================
// COMPONENT
// ============================================

/**
 * PurchaseOrderForm - Form for Purchase Order payment method
 *
 * Fields:
 * - PO Number: Required, alphanumeric with hyphens
 * - PO Amount: Required, currency, must be >= shipment total
 * - Expiration Date: Required date picker, must be in the future
 * - Approval Contact: Required, name of approver
 * - Department: Required, department name
 *
 * Uses React Hook Form with Zod validation.
 */
export function PurchaseOrderForm({
  minAmount = 0,
  currency = "USD",
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
}: PurchaseOrderFormProps) {
  // Get tomorrow's date for min attribute
  const tomorrow = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }, []);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      poNumber: defaultValues?.poNumber ?? "",
      poAmount: defaultValues?.poAmount ?? minAmount,
      expirationDate: defaultValues?.expirationDate ?? "",
      approvalContact: defaultValues?.approvalContact ?? "",
      department: defaultValues?.department ?? "",
    },
    mode: "onBlur",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<PurchaseOrderFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: PurchaseOrderFormData) => {
    // Additional validation for minAmount
    if (data.poAmount < minAmount) {
      form.setError("poAmount", {
        type: "manual",
        message: `PO Amount must be at least ${formatCurrency(minAmount)}`,
      });
      return;
    }
    onSubmit?.(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Check if PO Amount is valid against minAmount
  const poAmount = form.watch("poAmount");
  const poAmountError =
    poAmount !== undefined && poAmount < minAmount
      ? `PO Amount must be at least ${formatCurrency(minAmount)}`
      : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-5", className)}
      >
        {/* PO Number */}
        <FormField
          control={form.control}
          name="poNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                PO Number
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., PO-2024-001"
                  disabled={disabled}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value.toUpperCase());
                  }}
                />
              </FormControl>
              <FormDescription>
                Your company's purchase order reference number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PO Amount */}
        <FormField
          control={form.control}
          name="poAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                PO Amount
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={minAmount}
                    placeholder="0.00"
                    disabled={disabled}
                    className="pl-7"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value));
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Minimum amount required: {formatCurrency(minAmount)}
              </FormDescription>
              <FormMessage />
              {poAmountError && !form.formState.errors.poAmount && (
                <p className="text-sm font-medium text-error-600">
                  {poAmountError}
                </p>
              )}
            </FormItem>
          )}
        />

        {/* Expiration Date */}
        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Expiration Date
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={tomorrow}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                PO must be valid for at least one more day
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Approval Contact */}
        <FormField
          control={form.control}
          name="approvalContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Approval Contact
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., John Smith"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Name of the person who approved this purchase order
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Department */}
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Department
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Procurement"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Department responsible for this purchase
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
              disabled={disabled || !form.formState.isValid || !!poAmountError}
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

export default PurchaseOrderForm;
