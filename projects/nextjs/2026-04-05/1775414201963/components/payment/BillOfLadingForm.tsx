"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAfter, startOfDay, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Truck, AlertCircle, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// ============================================
// ZOD SCHEMA & TYPES
// ============================================

export type FreightTerm = "prepaid" | "collect" | "prepaid_add";

export interface BillOfLadingFormData {
  bolNumber: string;
  bolDate: string;
  shipperReference: string;
  freightTerms: FreightTerm;
}

export interface BillOfLadingFormProps {
  /** Initial form values */
  defaultValues?: Partial<BillOfLadingFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: BillOfLadingFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<BillOfLadingFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Shipment total for validation context */
  shipmentTotal?: number;
  /** Currency code */
  currency?: string;
}

// BOL Number format: BOL-YYYY-XXXXXX
const bolNumberRegex = /^BOL-\d{4}-\d{6}$/;

const billOfLadingSchema = z.object({
  bolNumber: z
    .string()
    .min(1, "BOL Number is required")
    .regex(
      bolNumberRegex,
      "BOL Number must be in format BOL-YYYY-XXXXXX (e.g., BOL-2024-123456)"
    ),
  bolDate: z
    .string()
    .min(1, "BOL Date is required")
    .refine((date) => {
      const selectedDate = parseISO(date);
      const today = startOfDay(new Date());
      return !isAfter(startOfDay(selectedDate), today);
    }, "BOL Date cannot be in the future"),
  shipperReference: z
    .string()
    .max(50, "Shipper Reference must be 50 characters or less")
    .optional(),
  freightTerms: z.enum(["prepaid", "collect", "prepaid_add"]),
});

type BillOfLadingSchemaType = z.infer<typeof billOfLadingSchema>;

// ============================================
// COMPONENT
// ============================================

/**
 * BillOfLadingForm - Form for Bill of Lading payment method
 *
 * Fields:
 * - BOL Number: Required, format BOL-YYYY-XXXXXX
 * - BOL Date: Required date picker, must be <= today
 * - Shipper Reference: Optional reference number
 * - Freight Terms: Required select (Prepaid, Collect, Prepaid & Add)
 *
 * Uses React Hook Form with Zod validation.
 */
export function BillOfLadingForm({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
  shipmentTotal = 0,
  currency = "USD",
}: BillOfLadingFormProps) {
  const form = useForm<BillOfLadingSchemaType>({
    resolver: zodResolver(billOfLadingSchema),
    defaultValues: {
      bolNumber: defaultValues?.bolNumber ?? "",
      bolDate: defaultValues?.bolDate ?? format(new Date(), "yyyy-MM-dd"),
      shipperReference: defaultValues?.shipperReference ?? "",
      freightTerms: defaultValues?.freightTerms ?? "prepaid",
    },
    mode: "onBlur",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<BillOfLadingFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: BillOfLadingSchemaType) => {
    onSubmit?.(data as BillOfLadingFormData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Calculate fee (2.5% of shipment total)
  const feeAmount = shipmentTotal * 0.025;

  // Freight terms options
  const freightTermOptions: { value: FreightTerm; label: string; description: string }[] = [
    {
      value: "prepaid",
      label: "Prepaid",
      description: "Shipper pays freight charges",
    },
    {
      value: "collect",
      label: "Collect",
      description: "Consignee pays freight charges",
    },
    {
      value: "prepaid_add",
      label: "Prepaid & Add",
      description: "Shipper pays and adds to invoice",
    },
  ];

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
            will be added to your shipment total for Bill of Lading processing.
          </AlertDescription>
        </Alert>

        {/* BOL Number */}
        <FormField
          control={form.control}
          name="bolNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                BOL Number
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., BOL-2024-123456"
                    disabled={disabled}
                    className="pl-10"
                    {...field}
                    onChange={(e) => {
                      // Auto-format to uppercase
                      field.onChange(e.target.value.toUpperCase());
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Format: BOL-YYYY-XXXXXX (e.g., BOL-2024-123456)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* BOL Date */}
        <FormField
          control={form.control}
          name="bolDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                BOL Date
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(parseISO(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    disabled={(date) => isAfter(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Date of the Bill of Lading (cannot be in the future)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Shipper Reference */}
        <FormField
          control={form.control}
          name="shipperReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipper Reference</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., REF-12345"
                  disabled={disabled}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional reference number for your records
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Freight Terms */}
        <FormField
          control={form.control}
          name="freightTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Freight Terms
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select freight terms" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {freightTermOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Who is responsible for paying the freight charges
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

export default BillOfLadingForm;
