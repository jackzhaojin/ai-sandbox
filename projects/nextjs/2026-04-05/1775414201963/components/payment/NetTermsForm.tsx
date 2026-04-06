"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

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
import {
  Clock,
  AlertCircle,
  Upload,
  FileText,
  X,
  Plus,
  Building2,
  User,
  Phone,
  Mail,
  Hash,
  DollarSign,
  Loader2,
  Check,
} from "lucide-react";

// ============================================
// ZOD SCHEMA & TYPES
// ============================================

export type PaymentPeriod = 15 | 30 | 45 | 60;

export type AnnualRevenueRange =
  | "under_1m"
  | "1m_to_5m"
  | "5m_to_10m"
  | "10m_to_50m"
  | "over_50m";

export interface TradeReference {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  accountNumber: string;
}

export interface NetTermsFormData {
  paymentPeriod: PaymentPeriod;
  annualRevenue: AnnualRevenueRange;
  creditApplicationFile: string | null; // File path in Supabase Storage
  tradeReferences: TradeReference[];
}

export interface NetTermsFormProps {
  /** Initial form values */
  defaultValues?: Partial<NetTermsFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: NetTermsFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<NetTermsFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Shipment total for fee calculation */
  shipmentTotal?: number;
  /** Currency code */
  currency?: string;
  /** Supabase storage bucket name for credit applications */
  storageBucket?: string;
  /** Organization ID for file upload path */
  organizationId?: string;
}

// Phone number regex for US format
const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

// Trade reference schema
const tradeReferenceSchema = z.object({
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
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(phoneRegex, "Please enter a valid 10-digit phone number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be 100 characters or less"),
  accountNumber: z
    .string()
    .min(1, "Account Number is required")
    .min(3, "Account Number must be at least 3 characters")
    .max(50, "Account Number must be 50 characters or less"),
});

// Main form schema
const netTermsSchema = z.object({
  paymentPeriod: z.number().refine(
    (val) => [15, 30, 45, 60].includes(val),
    "Please select a valid payment period"
  ),
  annualRevenue: z.enum([
    "under_1m",
    "1m_to_5m",
    "5m_to_10m",
    "10m_to_50m",
    "over_50m",
  ]),
  creditApplicationFile: z.string().nullable(),
  tradeReferences: z
    .array(tradeReferenceSchema)
    .min(3, "At least 3 trade references are required"),
});

type NetTermsSchemaType = z.infer<typeof netTermsSchema>;

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_PERIOD_OPTIONS: { value: PaymentPeriod; label: string }[] = [
  { value: 15, label: "Net 15" },
  { value: 30, label: "Net 30" },
  { value: 45, label: "Net 45" },
  { value: 60, label: "Net 60" },
];

const ANNUAL_REVENUE_OPTIONS: { value: AnnualRevenueRange; label: string }[] = [
  { value: "under_1m", label: "Under $1 million" },
  { value: "1m_to_5m", label: "$1 million - $5 million" },
  { value: "5m_to_10m", label: "$5 million - $10 million" },
  { value: "10m_to_50m", label: "$10 million - $50 million" },
  { value: "over_50m", label: "Over $50 million" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = ["application/pdf"];

// ============================================
// COMPONENT
// ============================================

/**
 * NetTermsForm - Form for Net Terms payment method with trade references
 *
 * Fields:
 * - Payment Period: Required select (Net 15/30/45/60)
 * - Credit Application: PDF file upload (max 10MB) to Supabase Storage
 * - Annual Revenue: Required select
 * - Trade References: Repeater with min 3 references, each containing:
 *   - Company Name
 *   - Contact Name
 *   - Phone
 *   - Email
 *   - Account Number
 *
 * Includes a 1.5% cost-of-capital fee notice.
 * Uses React Hook Form with Zod validation.
 */
export function NetTermsForm({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
  shipmentTotal = 0,
  currency = "USD",
  storageBucket = "credit-applications",
  organizationId = "default",
}: NetTermsFormProps) {
  const [uploadStatus, setUploadStatus] = React.useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(
    defaultValues?.creditApplicationFile
      ? defaultValues.creditApplicationFile.split("/").pop() || null
      : null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<NetTermsSchemaType>({
    resolver: zodResolver(netTermsSchema),
    defaultValues: {
      paymentPeriod: defaultValues?.paymentPeriod ?? 30,
      annualRevenue: defaultValues?.annualRevenue ?? "1m_to_5m",
      creditApplicationFile: defaultValues?.creditApplicationFile ?? null,
      tradeReferences:
        defaultValues?.tradeReferences &&
        defaultValues.tradeReferences.length >= 3
          ? defaultValues.tradeReferences
          : [
              {
                companyName: "",
                contactName: "",
                phone: "",
                email: "",
                accountNumber: "",
              },
              {
                companyName: "",
                contactName: "",
                phone: "",
                email: "",
                accountNumber: "",
              },
              {
                companyName: "",
                contactName: "",
                phone: "",
                email: "",
                accountNumber: "",
              },
            ],
    },
    mode: "onBlur",
  });

  // Use field array for trade references
  const {
    fields: referenceFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "tradeReferences",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<NetTermsFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: NetTermsSchemaType) => {
    onSubmit?.(data as NetTermsFormData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // Calculate fee (1.5% of shipment total)
  const feeAmount = shipmentTotal * 0.015;

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

  // Handle file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError("Only PDF files are allowed");
      setUploadStatus("error");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 10MB");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const supabase = createBrowserClient();
      const filePath = `${organizationId}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      form.setValue("creditApplicationFile", filePath);
      setUploadedFileName(file.name);
      setUploadStatus("success");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload file"
      );
      setUploadStatus("error");
      form.setValue("creditApplicationFile", null);
    }
  };

  // Handle file removal
  const handleRemoveFile = async () => {
    const filePath = form.getValues("creditApplicationFile");
    if (!filePath) return;

    try {
      const supabase = createBrowserClient();
      await supabase.storage.from(storageBucket).remove([filePath as string]);
    } catch (err) {
      console.error("Error removing file:", err);
    }

    form.setValue("creditApplicationFile", null);
    setUploadedFileName(null);
    setUploadStatus("idle");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add a new trade reference
  const handleAddReference = () => {
    append({
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      accountNumber: "",
    });
  };

  // Remove a trade reference
  const handleRemoveReference = (index: number) => {
    if (referenceFields.length <= 3) {
      // Don't allow removing below minimum
      return;
    }
    remove(index);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        {/* Fee Notice */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <span className="font-medium">Cost of Capital Fee:</span> A 1.5%
            fee
            {shipmentTotal > 0 && (
              <span> ({formatCurrency(feeAmount)})</span>
            )}{" "}
            will be added to your shipment total for Net Terms processing.
          </AlertDescription>
        </Alert>

        {/* Payment Period */}
        <FormField
          control={form.control}
          name="paymentPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Payment Period
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={(value) => value && field.onChange(parseInt(value, 10))}
                defaultValue={field.value?.toString() ?? "30"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_PERIOD_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Number of days before payment is due
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Annual Revenue */}
        <FormField
          control={form.control}
          name="annualRevenue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Annual Revenue
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select annual revenue range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ANNUAL_REVENUE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Your company's annual revenue range
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Credit Application Upload */}
        <FormItem>
          <FormLabel>
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Credit Application
            </span>
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              {uploadedFileName ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm truncate">
                    {uploadedFileName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={disabled || uploadStatus === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Check className="h-4 w-4 text-success-600" />
                </div>
              ) : (
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    uploadStatus === "error"
                      ? "border-error-300 bg-error-50"
                      : "border-muted-foreground/25 hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={disabled || uploadStatus === "uploading"}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {uploadStatus === "uploading" ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="text-sm font-medium">
                      {uploadStatus === "uploading"
                        ? "Uploading..."
                        : "Upload credit application"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PDF only, max 10MB
                    </div>
                  </div>
                </div>
              )}
              {uploadError && (
                <p className="text-sm font-medium text-error-600">{uploadError}</p>
              )}
            </div>
          </FormControl>
          <FormDescription>
            Upload your completed credit application (PDF format)
          </FormDescription>
        </FormItem>

        {/* Trade References Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Trade References
                <span className="text-error-500">*</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Minimum 3 trade references required
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddReference}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Reference
            </Button>
          </div>

          {/* Trade Reference Count Validation */}
          {form.formState.errors.tradeReferences?.root && (
            <Alert className="bg-error-50 border-error-200">
              <AlertCircle className="h-4 w-4 text-error-600" />
              <AlertDescription className="text-error-800">
                {form.formState.errors.tradeReferences.root.message}
              </AlertDescription>
            </Alert>
          )}
          {form.formState.errors.tradeReferences &&
            !Array.isArray(form.formState.errors.tradeReferences) && (
              <Alert className="bg-error-50 border-error-200">
                <AlertCircle className="h-4 w-4 text-error-600" />
                <AlertDescription className="text-error-800">
                  {form.formState.errors.tradeReferences.message}
                </AlertDescription>
              </Alert>
            )}

          {/* Trade Reference Cards */}
          <div className="space-y-4">
            {referenceFields.map((field, index) => (
              <div
                key={field.id}
                className="relative p-4 border rounded-lg bg-card"
              >
                {/* Reference Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Reference #{index + 1}
                  </h4>
                  {referenceFields.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveReference(index)}
                      disabled={disabled}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Reference Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name={`tradeReferences.${index}.companyName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Company Name
                          <span className="text-error-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Company name"
                              disabled={disabled}
                              className="pl-8 h-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Name */}
                  <FormField
                    control={form.control}
                    name={`tradeReferences.${index}.contactName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Contact Name
                          <span className="text-error-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Contact person"
                              disabled={disabled}
                              className="pl-8 h-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name={`tradeReferences.${index}.phone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Phone
                          <span className="text-error-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="(555) 123-4567"
                              disabled={disabled}
                              className="pl-8 h-9"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(
                                  e.target.value
                                );
                                field.onChange(formatted);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name={`tradeReferences.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Email
                          <span className="text-error-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="contact@company.com"
                              disabled={disabled}
                              className="pl-8 h-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Number */}
                  <FormField
                    control={form.control}
                    name={`tradeReferences.${index}.accountNumber`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs">
                          Account Number
                          <span className="text-error-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Your account number with this vendor"
                              disabled={disabled}
                              className="pl-8 h-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Reference Count Indicator */}
          <div className="flex items-center justify-between text-sm">
            <span
              className={cn(
                referenceFields.length >= 3
                  ? "text-success-600"
                  : "text-error-600"
              )}
            >
              {referenceFields.length} of minimum 3 references
            </span>
            {referenceFields.length < 3 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleAddReference}
                disabled={disabled}
                className="text-primary"
              >
                Add {3 - referenceFields.length} more
              </Button>
            )}
          </div>
        </div>

        {/* Submit Button (optional - can be controlled externally) */}
        {onSubmit && (
          <div className="pt-4">
            <Button
              type="submit"
              disabled={
                disabled ||
                !form.formState.isValid ||
                uploadStatus === "uploading"
              }
              className="w-full"
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

export default NetTermsForm;
