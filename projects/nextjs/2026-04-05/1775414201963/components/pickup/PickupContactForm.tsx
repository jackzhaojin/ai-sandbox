"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  Phone,
  Mail,
  Contact,
  Shield,
  Signature,
  IdCard,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// TYPES & ENUMS
// ============================================

export type PreferredContactMethod = "email" | "phone" | "sms";

export interface PrimaryContactData {
  name: string;
  jobTitle: string;
  mobilePhone: string;
  altPhone: string;
  email: string;
  preferredContactMethod: PreferredContactMethod;
}

export interface BackupContactData {
  name: string;
  phone: string;
  email: string;
}

export interface AuthorizedPersonData {
  id: string;
  name: string;
}

export interface SpecialAuthorizationData {
  idVerificationRequired: boolean;
  signatureRequired: boolean;
  photoIdMatching: boolean;
}

export interface PickupContactFormData {
  primaryContact: PrimaryContactData;
  backupContact: BackupContactData;
  authorizedPersonnel: AuthorizedPersonData[];
  specialAuthorization: SpecialAuthorizationData;
}

export interface PickupContactFormProps {
  /** Initial form values */
  defaultValues?: Partial<PickupContactFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: PickupContactFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<PickupContactFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Declared value of shipment - triggers special authorization if > $5,000 */
  declaredValue?: number;
  /** Threshold for special authorization (default: 5000) */
  specialAuthorizationThreshold?: number;
}

// ============================================
// CONSTANTS
// ============================================

const PREFERRED_CONTACT_METHODS: Array<{
  value: PreferredContactMethod;
  label: string;
  description: string;
}> = [
  {
    value: "email",
    label: "Email",
    description: "Send notifications via email",
  },
  {
    value: "phone",
    label: "Phone Call",
    description: "Call for important updates",
  },
  {
    value: "sms",
    label: "SMS/Text",
    description: "Text messages for quick updates",
  },
];

const MAX_AUTHORIZED_PERSONNEL = 5;

// ============================================
// ZOD SCHEMA
// ============================================

const primaryContactSchema = z.object({
  name: z.string().min(1, "Primary contact name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  mobilePhone: z
    .string()
    .min(10, "Mobile phone must be at least 10 digits")
    .regex(
      /^[\d\s\-\(\)\+\.]+$/,
      "Please enter a valid phone number"
    ),
  altPhone: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  preferredContactMethod: z.enum(["email", "phone", "sms"]),
});

const backupContactSchema = z.object({
  name: z.string().min(1, "Backup contact name is required"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(
      /^[\d\s\-\(\)\+\.]+$/,
      "Please enter a valid phone number"
    ),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

const authorizedPersonSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
});

const specialAuthorizationSchema = z.object({
  idVerificationRequired: z.boolean().default(false),
  signatureRequired: z.boolean().default(false),
  photoIdMatching: z.boolean().default(false),
});

const pickupContactSchema = z.object({
  primaryContact: primaryContactSchema,
  backupContact: backupContactSchema,
  authorizedPersonnel: z.array(authorizedPersonSchema).default([]),
  specialAuthorization: specialAuthorizationSchema,
});

type PickupContactSchemaType = z.infer<typeof pickupContactSchema>;

// ============================================
// AUTHORIZED PERSONNEL ROW COMPONENT
// ============================================

interface AuthorizedPersonRowProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  canRemove: boolean;
}

function AuthorizedPersonRow({
  index,
  value,
  onChange,
  onRemove,
  disabled,
  canRemove,
}: AuthorizedPersonRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
        {index + 1}
      </div>
      <Input
        placeholder="Full name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled || !canRemove}
        className={cn(
          "flex-shrink-0",
          !canRemove && "opacity-0 pointer-events-none"
        )}
        aria-label={`Remove authorized person ${index + 1}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PickupContactForm - Form for collecting pickup contact information
 *
 * Features:
 * - Primary Contact fields (Name, Job Title, Mobile Phone, Alt Phone, Email, Preferred Contact Method)
 * - Backup Contact fields (Name, Phone, Email)
 * - Authorized Personnel list with add/remove functionality
 * - Special Authorization section (conditional when declared value > threshold)
 *   - ID verification required
 *   - Signature required
 *   - Photo ID matching
 *
 * Uses React Hook Form with Zod validation.
 *
 * @example
 * <PickupContactForm
 *   declaredValue={7500}
 *   onChange={(data, isValid) => console.log('Form updated:', data)}
 * />
 */
export function PickupContactForm({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
  declaredValue = 0,
  specialAuthorizationThreshold = 5000,
}: PickupContactFormProps) {
  const form = useForm<PickupContactSchemaType>({
    resolver: zodResolver(pickupContactSchema),
    defaultValues: {
      primaryContact: {
        name: defaultValues?.primaryContact?.name ?? "",
        jobTitle: defaultValues?.primaryContact?.jobTitle ?? "",
        mobilePhone: defaultValues?.primaryContact?.mobilePhone ?? "",
        altPhone: defaultValues?.primaryContact?.altPhone ?? "",
        email: defaultValues?.primaryContact?.email ?? "",
        preferredContactMethod:
          defaultValues?.primaryContact?.preferredContactMethod ?? "email",
      },
      backupContact: {
        name: defaultValues?.backupContact?.name ?? "",
        phone: defaultValues?.backupContact?.phone ?? "",
        email: defaultValues?.backupContact?.email ?? "",
      },
      authorizedPersonnel: defaultValues?.authorizedPersonnel?.length
        ? defaultValues.authorizedPersonnel
        : [{ id: crypto.randomUUID(), name: "" }],
      specialAuthorization: {
        idVerificationRequired:
          defaultValues?.specialAuthorization?.idVerificationRequired ?? false,
        signatureRequired:
          defaultValues?.specialAuthorization?.signatureRequired ?? false,
        photoIdMatching:
          defaultValues?.specialAuthorization?.photoIdMatching ?? false,
      },
    },
    mode: "onBlur",
  });

  // Field array for authorized personnel
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "authorizedPersonnel",
  });

  // Check if special authorization is required
  const showSpecialAuthorization = declaredValue > specialAuthorizationThreshold;

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<PickupContactFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: PickupContactSchemaType) => {
    onSubmit?.(data as PickupContactFormData);
  };

  const addAuthorizedPerson = () => {
    if (fields.length < MAX_AUTHORIZED_PERSONNEL) {
      append({ id: crypto.randomUUID(), name: "" });
    }
  };

  const removeAuthorizedPerson = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const toggleSpecialAuthorization = (
    field: keyof SpecialAuthorizationData,
    checked: boolean
  ) => {
    form.setValue(`specialAuthorization.${field}`, checked, {
      shouldValidate: true,
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn("space-y-6", className)}
        >
          {/* Primary Contact Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Primary Contact
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px]">
                    <p>
                      The main contact person who will coordinate the pickup
                      and be available on the scheduled date.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="primaryContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Smith"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Title */}
                <FormField
                  control={form.control}
                  name="primaryContact.jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Job Title
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Shipping Manager"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Phone */}
                <FormField
                  control={form.control}
                  name="primaryContact.mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Mobile Phone
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Primary phone for pickup day contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alt Phone */}
                <FormField
                  control={form.control}
                  name="primaryContact.altPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Alternative Phone
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 987-6543 (optional)"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Office or backup number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="primaryContact.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.smith@company.com"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For confirmations and notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Contact Method */}
              <FormField
                control={form.control}
                name="primaryContact.preferredContactMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Contact className="h-4 w-4" />
                        Preferred Contact Method
                      </span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                        disabled={disabled}
                      >
                        {PREFERRED_CONTACT_METHODS.map((method) => (
                          <div
                            key={method.value}
                            className={cn(
                              "flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              field.value === method.value
                                ? "border-primary bg-primary/5"
                                : "border-input hover:bg-accent/50"
                            )}
                            onClick={() =>
                              !disabled && field.onChange(method.value)
                            }
                          >
                            <RadioGroupItem
                              value={method.value}
                              className="mt-1"
                            />
                            <div className="space-y-1">
                              <Label
                                className="font-medium cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  !disabled && field.onChange(method.value);
                                }}
                              >
                                {method.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Backup Contact Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Backup Contact
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px]">
                    <p>
                      A secondary contact in case the primary contact is
                      unavailable on pickup day.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="backupContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="backupContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 234-5678"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="backupContact.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jane.doe@company.com (optional)"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Authorized Personnel Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Authorized Personnel
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px]">
                    <p>
                      Additional people authorized to release the shipment to
                      the driver. IDs may be verified for high-value shipments.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormDescription>
                List all individuals authorized to release the shipment to our
                driver (up to {MAX_AUTHORIZED_PERSONNEL})
              </FormDescription>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`authorizedPersonnel.${index}.name`}
                    render={({ field: nameField }) => (
                      <FormItem>
                        <FormControl>
                          <AuthorizedPersonRow
                            index={index}
                            value={nameField.value}
                            onChange={nameField.onChange}
                            onRemove={() => removeAuthorizedPerson(index)}
                            disabled={disabled}
                            canRemove={fields.length > 1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {fields.length < MAX_AUTHORIZED_PERSONNEL && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAuthorizedPerson}
                  disabled={disabled}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Special Authorization Section (Conditional) */}
          {showSpecialAuthorization && (
            <Card className="border-warning-500/50 bg-warning-50/30 dark:bg-warning-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-warning-600" />
                  Special Authorization Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="warning" className="bg-warning-100/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Due to the high declared value of{" "}
                    <strong>${declaredValue.toLocaleString()}</strong>,
                    additional security measures are required for this pickup.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 pt-2">
                  {/* ID Verification Required */}
                  <FormField
                    control={form.control}
                    name="specialAuthorization.idVerificationRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              toggleSpecialAuthorization(
                                "idVerificationRequired",
                                checked as boolean
                              )
                            }
                            disabled={disabled}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2 cursor-pointer">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            Government-issued ID Verification Required
                          </FormLabel>
                          <FormDescription>
                            Driver will verify a valid government-issued photo
                            ID
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Signature Required */}
                  <FormField
                    control={form.control}
                    name="specialAuthorization.signatureRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              toggleSpecialAuthorization(
                                "signatureRequired",
                                checked as boolean
                              )
                            }
                            disabled={disabled}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2 cursor-pointer">
                            <Signature className="h-4 w-4 text-muted-foreground" />
                            Direct Signature Required
                          </FormLabel>
                          <FormDescription>
                            An authorized person must provide a handwritten
                            signature
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Photo ID Matching */}
                  <FormField
                    control={form.control}
                    name="specialAuthorization.photoIdMatching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              toggleSpecialAuthorization(
                                "photoIdMatching",
                                checked as boolean
                              )
                            }
                            disabled={disabled}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2 cursor-pointer">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            Photo ID Must Match Authorized Personnel List
                          </FormLabel>
                          <FormDescription>
                            The person releasing the shipment must be on the
                            authorized personnel list above
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
    </TooltipProvider>
  );
}

export default PickupContactForm;
