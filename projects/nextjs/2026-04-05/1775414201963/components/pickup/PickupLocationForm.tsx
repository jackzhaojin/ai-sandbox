"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Building,
  Home,
  Warehouse,
  HardHat,
  Package,
  Car,
  ClipboardList,
  Info,
  Phone,
  Shield,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export type LocationType =
  | "loading_dock"
  | "ground_level"
  | "residential"
  | "storage"
  | "construction"
  | "other";

export interface AccessRequirement {
  id: string;
  label: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

export interface PickupLocationFormData {
  locationType: LocationType;
  dockNumber?: string;
  accessRequirements: string[];
  gateCode?: string;
  parkingInstructions: string;
  packageLocation: string;
  driverInstructions: string;
}

export interface PickupLocationFormProps {
  /** Initial form values */
  defaultValues?: Partial<PickupLocationFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: PickupLocationFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<PickupLocationFormData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const LOCATION_TYPES: Array<{
  value: LocationType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "loading_dock",
    label: "Loading Dock",
    description: "Commercial dock with ramp access",
    icon: <Building className="h-5 w-5" />,
  },
  {
    value: "ground_level",
    label: "Ground Level",
    description: "Ground floor, no stairs or elevator",
    icon: <Package className="h-5 w-5" />,
  },
  {
    value: "residential",
    label: "Residential",
    description: "Home or apartment building",
    icon: <Home className="h-5 w-5" />,
  },
  {
    value: "storage",
    label: "Storage Facility",
    description: "Self-storage or warehouse facility",
    icon: <Warehouse className="h-5 w-5" />,
  },
  {
    value: "construction",
    label: "Construction Site",
    description: "Active construction or job site",
    icon: <HardHat className="h-5 w-5" />,
  },
  {
    value: "other",
    label: "Other",
    description: "Other location type",
    icon: <MapPin className="h-5 w-5" />,
  },
];

const ACCESS_REQUIREMENTS: AccessRequirement[] = [
  {
    id: "call_upon_arrival",
    label: "Call Upon Arrival",
    requiresInput: false,
  },
  {
    id: "security_checkin",
    label: "Security Check-in Required",
    requiresInput: false,
  },
  {
    id: "gate_code",
    label: "Gate Code Required",
    requiresInput: true,
    inputLabel: "Gate Code",
    inputPlaceholder: "Enter gate code",
  },
  {
    id: "buzzer_access",
    label: "Buzzer/Intercom Access",
    requiresInput: false,
  },
  {
    id: "appointment_required",
    label: "Appointment Required",
    requiresInput: false,
  },
  {
    id: "restricted_hours",
    label: "Restricted Delivery Hours",
    requiresInput: false,
  },
];

const MAX_PARKING_CHARS = 200;
const MAX_PACKAGE_LOCATION_CHARS = 100;
const MAX_DRIVER_INSTRUCTIONS_CHARS = 300;

// ============================================
// ZOD SCHEMA
// ============================================

const pickupLocationSchema = z.object({
  locationType: z.enum([
    "loading_dock",
    "ground_level",
    "residential",
    "storage",
    "construction",
    "other",
  ]),
  dockNumber: z.string().optional(),
  accessRequirements: z.array(z.string()).default([]),
  gateCode: z.string().optional(),
  parkingInstructions: z
    .string()
    .max(
      MAX_PARKING_CHARS,
      `Parking instructions must be ${MAX_PARKING_CHARS} characters or less`
    ),
  packageLocation: z
    .string()
    .max(
      MAX_PACKAGE_LOCATION_CHARS,
      `Package location must be ${MAX_PACKAGE_LOCATION_CHARS} characters or less`
    ),
  driverInstructions: z
    .string()
    .max(
      MAX_DRIVER_INSTRUCTIONS_CHARS,
      `Driver instructions must be ${MAX_DRIVER_INSTRUCTIONS_CHARS} characters or less`
    ),
});

type PickupLocationSchemaType = z.infer<typeof pickupLocationSchema>;

// ============================================
// CHARACTER COUNT TEXTAREA COMPONENT
// ============================================

interface CharacterCountTextareaProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
}

function CharacterCountTextarea({
  value,
  onChange,
  maxLength,
  placeholder,
  disabled,
  description,
}: CharacterCountTextareaProps) {
  const charCount = value?.length || 0;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="space-y-2">
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[80px] resize-y",
          isOverLimit && "border-error-500 focus-visible:ring-error-500/20"
        )}
        maxLength={maxLength}
      />
      <div className="flex items-center justify-between">
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
        <span
          className={cn(
            "text-xs ml-auto",
            isOverLimit
              ? "text-error-600 font-medium"
              : charCount > maxLength * 0.9
              ? "text-warning-600"
              : "text-muted-foreground"
          )}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}

// ============================================
// LOCATION TYPE CARD COMPONENT
// ============================================

interface LocationTypeCardProps {
  option: (typeof LOCATION_TYPES)[number];
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function LocationTypeCard({
  option,
  isSelected,
  onSelect,
  disabled,
}: LocationTypeCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected && [
          "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2",
          "hover:bg-primary/10",
        ],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={() => !disabled && onSelect()}
    >
      <RadioGroupItem
        value={option.value}
        id={`location-${option.value}`}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {option.icon}
      </div>
      <div className="flex-grow min-w-0">
        <Label
          htmlFor={`location-${option.value}`}
          className="text-base font-semibold cursor-pointer"
        >
          {option.label}
        </Label>
        <p className="text-sm text-muted-foreground mt-0.5">
          {option.description}
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PickupLocationForm - Form for collecting pickup location details
 *
 * Features:
 * - Location Type selection with radio cards (Loading Dock, Ground Level, Residential, etc.)
 * - Conditional Dock Number field (shown when Loading Dock selected)
 * - Access Requirements checkboxes (Call Upon Arrival, Security Check-in, Gate Code, etc.)
 * - Conditional Gate Code input (shown when Gate Code Required checked)
 * - Parking/Loading instructions textarea (max 200 chars)
 * - Package Location textarea (max 100 chars)
 * - Driver Instructions textarea (max 300 chars)
 *
 * Uses React Hook Form with Zod validation.
 *
 * @example
 * <PickupLocationForm
 *   onChange={(data, isValid) => console.log('Form updated:', data)}
 * />
 */
export function PickupLocationForm({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
}: PickupLocationFormProps) {
  const form = useForm<PickupLocationSchemaType>({
    resolver: zodResolver(pickupLocationSchema),
    defaultValues: {
      locationType: defaultValues?.locationType ?? "ground_level",
      dockNumber: defaultValues?.dockNumber ?? "",
      accessRequirements: defaultValues?.accessRequirements ?? [],
      gateCode: defaultValues?.gateCode ?? "",
      parkingInstructions: defaultValues?.parkingInstructions ?? "",
      packageLocation: defaultValues?.packageLocation ?? "",
      driverInstructions: defaultValues?.driverInstructions ?? "",
    },
    mode: "onBlur",
  });

  // Watch for conditional field visibility
  const locationType = form.watch("locationType");
  const accessRequirements = form.watch("accessRequirements");
  const showDockNumber = locationType === "loading_dock";
  const showGateCode = accessRequirements.includes("gate_code");

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<PickupLocationFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: PickupLocationSchemaType) => {
    onSubmit?.(data as PickupLocationFormData);
  };

  const handleLocationTypeChange = (value: string) => {
    form.setValue("locationType", value as LocationType, {
      shouldValidate: true,
    });
    // Clear dock number if not loading dock
    if (value !== "loading_dock") {
      form.setValue("dockNumber", "");
    }
  };

  const toggleAccessRequirement = (id: string, checked: boolean) => {
    const current = form.getValues("accessRequirements") || [];
    let updated: string[];
    if (checked) {
      updated = [...current, id];
    } else {
      updated = current.filter((item) => item !== id);
      // Clear gate code if unchecked
      if (id === "gate_code") {
        form.setValue("gateCode", "");
      }
    }
    form.setValue("accessRequirements", updated, { shouldValidate: true });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn("space-y-6", className)}
        >
          {/* Location Type Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Location Type
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
                      Select the type of location where the pickup will occur.
                      This helps us prepare the right equipment.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={handleLocationTypeChange}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        disabled={disabled}
                      >
                        {LOCATION_TYPES.map((option) => (
                          <LocationTypeCard
                            key={option.value}
                            option={option}
                            isSelected={field.value === option.value}
                            onSelect={() =>
                              handleLocationTypeChange(option.value)
                            }
                            disabled={disabled}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional Dock Number Field */}
              {showDockNumber && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FormField
                    control={form.control}
                    name="dockNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Dock Number
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Dock 5, Bay B"
                            disabled={disabled}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Specify the dock number or bay for the pickup
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Requirements Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Access Requirements
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
                      Let us know about any special access requirements so our
                      driver can prepare.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ACCESS_REQUIREMENTS.map((req) => (
                  <div key={req.id} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`access-${req.id}`}
                        checked={accessRequirements.includes(req.id)}
                        onCheckedChange={(checked) =>
                          toggleAccessRequirement(req.id, checked as boolean)
                        }
                        disabled={disabled}
                      />
                      <div className="space-y-1 leading-none">
                        <Label
                          htmlFor={`access-${req.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {req.label}
                        </Label>
                      </div>
                    </div>

                    {/* Conditional Gate Code Input */}
                    {req.id === "gate_code" && showGateCode && (
                      <div className="pl-7 animate-in fade-in slide-in-from-top-2 duration-300">
                        <FormField
                          control={form.control}
                          name="gateCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder={req.inputPlaceholder}
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Pickup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Parking/Loading Instructions */}
              <FormField
                control={form.control}
                name="parkingInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Parking / Loading Instructions
                      </span>
                    </FormLabel>
                    <FormControl>
                      <CharacterCountTextarea
                        value={field.value}
                        onChange={field.onChange}
                        maxLength={MAX_PARKING_CHARS}
                        placeholder="Describe where the driver should park, loading zone details, etc."
                        disabled={disabled}
                        description="e.g., Use visitor parking, loading dock is around back"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Package Location */}
              <FormField
                control={form.control}
                name="packageLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Package Location
                      </span>
                    </FormLabel>
                    <FormControl>
                      <CharacterCountTextarea
                        value={field.value}
                        onChange={field.onChange}
                        maxLength={MAX_PACKAGE_LOCATION_CHARS}
                        placeholder="Where will the packages be located?"
                        disabled={disabled}
                        description="e.g., Front desk, shipping room, suite 200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Driver Instructions */}
              <FormField
                control={form.control}
                name="driverInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Special Instructions for Driver
                      </span>
                    </FormLabel>
                    <FormControl>
                      <CharacterCountTextarea
                        value={field.value}
                        onChange={field.onChange}
                        maxLength={MAX_DRIVER_INSTRUCTIONS_CHARS}
                        placeholder="Any additional instructions for the driver"
                        disabled={disabled}
                        description="e.g., Ring bell for service, ask for Mike in receiving"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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

export default PickupLocationForm;
