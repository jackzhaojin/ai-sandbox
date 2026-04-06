"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Truck,
  Users,
  Hand,
  Package,
  Check,
  Info,
  Container,
  Forklift,
  ArrowUpFromLine,
  DoorOpen,
  HardHat,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FeeBadge } from "@/components/shared";

// ============================================
// TYPES & ENUMS
// ============================================

export type EquipmentType =
  | "standard_dolly"
  | "two_person_team"
  | "pallet_jack"
  | "forklift"
  | "liftgate"
  | "inside_pickup"
  | "pallet_shrink_wrap";

export type LoadingAssistanceType =
  | "customer"
  | "driver_assist"
  | "full_service";

export interface EquipmentOption {
  id: EquipmentType;
  label: string;
  description: string;
  fee: number;
  icon: React.ReactNode;
  requiresLiftgate?: boolean;
}

export interface LoadingAssistanceOption {
  value: LoadingAssistanceType;
  label: string;
  description: string;
  fee: number;
  icon: React.ReactNode;
}

export interface PickupEquipmentFormData {
  equipment: EquipmentType[];
  loadingAssistance: LoadingAssistanceType;
}

export interface PickupEquipmentSelectorProps {
  /** Initial form values */
  defaultValues?: Partial<PickupEquipmentFormData>;
  /** Callback when form is submitted */
  onSubmit?: (data: PickupEquipmentFormData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<PickupEquipmentFormData>, isValid: boolean) => void;
  /** Callback when total fee changes */
  onFeeChange?: (totalFee: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  {
    id: "standard_dolly",
    label: "Standard Dolly",
    description: "Basic hand truck for boxes and small items",
    fee: 0,
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    id: "two_person_team",
    label: "Two-Person Team",
    description: "Additional handler for heavy or bulky items",
    fee: 45,
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "pallet_jack",
    label: "Pallet Jack",
    description: "Manual pallet jack for moving palletized freight",
    fee: 0,
    icon: <Container className="h-5 w-5" />,
  },
  {
    id: "forklift",
    label: "Forklift Service",
    description: "Powered forklift for heavy palletized items",
    fee: 35,
    icon: <Forklift className="h-5 w-5" />,
  },
  {
    id: "liftgate",
    label: "Liftgate Service",
    description: "Hydraulic lift for items over 100 lbs or no dock",
    fee: 25,
    icon: <ArrowUpFromLine className="h-5 w-5" />,
  },
  {
    id: "inside_pickup",
    label: "Inside Pickup",
    description: "Driver will enter building to retrieve packages",
    fee: 15,
    icon: <DoorOpen className="h-5 w-5" />,
  },
  {
    id: "pallet_shrink_wrap",
    label: "Shrink Wrapping",
    description: "Professional pallet wrapping service",
    fee: 20,
    icon: <Package className="h-5 w-5" />,
  },
];

const LOADING_ASSISTANCE_OPTIONS: LoadingAssistanceOption[] = [
  {
    value: "customer",
    label: "Customer Loading",
    description: "You or your team will load the packages",
    fee: 0,
    icon: <Hand className="h-5 w-5" />,
  },
  {
    value: "driver_assist",
    label: "Driver Assistance",
    description: "Driver will assist with loading (+$25)",
    fee: 25,
    icon: <Truck className="h-5 w-5" />,
  },
  {
    value: "full_service",
    label: "Full Service Loading",
    description: "Driver handles all loading (+$65)",
    fee: 65,
    icon: <HardHat className="h-5 w-5" />,
  },
];

// ============================================
// ZOD SCHEMA
// ============================================

const pickupEquipmentSchema = z.object({
  equipment: z.array(z.string()).default([]),
  loadingAssistance: z.enum(["customer", "driver_assist", "full_service"]),
});

type PickupEquipmentSchemaType = z.infer<typeof pickupEquipmentSchema>;

// ============================================
// EQUIPMENT CARD COMPONENT
// ============================================

interface EquipmentCardProps {
  option: EquipmentOption;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function EquipmentCard({
  option,
  isSelected,
  onToggle,
  disabled,
}: EquipmentCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected && [
          "border-primary bg-primary/5",
          "hover:bg-primary/10",
        ],
        !isSelected && "border-border",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={() => !disabled && onToggle()}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="mt-0.5 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      />
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {option.icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`equipment-${option.id}`}
            className="text-sm font-semibold cursor-pointer"
          >
            {option.label}
          </Label>
          {option.fee > 0 ? (
            <FeeBadge amount={option.fee} label="+" size="sm" />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400">
              <Check className="h-3 w-3" />
              Included
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {option.description}
        </p>
      </div>
    </div>
  );
}

// ============================================
// LOADING ASSISTANCE CARD COMPONENT
// ============================================

interface LoadingAssistanceCardProps {
  option: LoadingAssistanceOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function LoadingAssistanceCard({
  option,
  isSelected,
  onSelect,
  disabled,
}: LoadingAssistanceCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer text-center",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected && [
          "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2",
          "hover:bg-primary/10",
        ],
        !isSelected && "border-border",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={() => !disabled && onSelect()}
    >
      <RadioGroupItem
        value={option.value}
        id={`loading-${option.value}`}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {option.icon}
      </div>
      <div>
        <Label
          htmlFor={`loading-${option.value}`}
          className={cn(
            "text-sm font-semibold cursor-pointer block",
            isSelected && "text-primary"
          )}
        >
          {option.label}
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          {option.description}
        </p>
        <div className="mt-2">
          {option.fee > 0 ? (
            <FeeBadge amount={option.fee} label="Fee" size="sm" />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400">
              <Check className="h-3 w-3" />
              No additional fee
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// FEE SUMMARY COMPONENT
// ============================================

interface FeeSummaryProps {
  equipmentFees: number;
  loadingFee: number;
  totalFee: number;
}

function FeeSummary({ equipmentFees, loadingFee, totalFee }: FeeSummaryProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-semibold mb-3">Fee Summary</h4>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Equipment Fees:</span>
        <span>
          {equipmentFees > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(equipmentFees)
            : "Free"}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Loading Assistance:</span>
        <span>
          {loadingFee > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(loadingFee)
            : "Free"}
        </span>
      </div>
      <Separator className="my-2" />
      <div className="flex justify-between font-semibold">
        <span>Total Additional Fees:</span>
        <span
          className={cn(
            totalFee > 0 ? "text-primary" : "text-success-600"
          )}
        >
          {totalFee > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalFee)
            : "Free"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PickupEquipmentSelector - Component for selecting pickup equipment and loading assistance
 *
 * Features:
 * - Equipment checkboxes with fees:
 *   - Standard Dolly (free)
 *   - Two-Person Team (+$45)
 *   - Pallet Jack (free)
 *   - Forklift Service (+$35)
 *   - Liftgate Service (+$25)
 *   - Inside Pickup (+$15)
 *   - Shrink Wrapping (+$20)
 * - Loading Assistance radio options:
 *   - Customer Loading (free)
 *   - Driver Assistance (+$25)
 *   - Full Service Loading (+$65)
 * - Real-time fee calculation and summary
 *
 * Uses React Hook Form with Zod validation.
 *
 * @example
 * <PickupEquipmentSelector
 *   onChange={(data, isValid) => console.log('Equipment updated:', data)}
 *   onFeeChange={(fee) => console.log('Total fee:', fee)}
 * />
 */
export function PickupEquipmentSelector({
  defaultValues,
  onSubmit,
  onChange,
  onFeeChange,
  className,
  disabled = false,
}: PickupEquipmentSelectorProps) {
  const form = useForm<PickupEquipmentSchemaType>({
    resolver: zodResolver(pickupEquipmentSchema),
    defaultValues: {
      equipment: defaultValues?.equipment ?? ["standard_dolly"],
      loadingAssistance: defaultValues?.loadingAssistance ?? "customer",
    },
    mode: "onChange",
  });

  const selectedEquipment = form.watch("equipment");
  const selectedLoadingAssistance = form.watch("loadingAssistance");

  // Calculate fees
  const equipmentFees = React.useMemo(() => {
    return EQUIPMENT_OPTIONS.filter((opt) =>
      selectedEquipment.includes(opt.id)
    ).reduce((sum, opt) => sum + opt.fee, 0);
  }, [selectedEquipment]);

  const loadingFee = React.useMemo(() => {
    const option = LOADING_ASSISTANCE_OPTIONS.find(
      (opt) => opt.value === selectedLoadingAssistance
    );
    return option?.fee || 0;
  }, [selectedLoadingAssistance]);

  const totalFee = equipmentFees + loadingFee;

  // Notify fee changes
  React.useEffect(() => {
    onFeeChange?.(totalFee);
  }, [totalFee, onFeeChange]);

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<PickupEquipmentFormData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: PickupEquipmentSchemaType) => {
    onSubmit?.(data as PickupEquipmentFormData);
  };

  const toggleEquipment = (id: EquipmentType, checked: boolean) => {
    const current = form.getValues("equipment") || [];
    let updated: EquipmentType[];
    if (checked) {
      updated = [...current, id];
    } else {
      updated = current.filter((item) => item !== id);
    }
    form.setValue("equipment", updated, { shouldValidate: true });
  };

  const handleLoadingAssistanceChange = (value: string) => {
    form.setValue("loadingAssistance", value as LoadingAssistanceType, {
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
          {/* Equipment Selection Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Equipment & Services
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <p>
                      Select any special equipment needed for your pickup. Some
                      services may incur additional fees.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="equipment"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {EQUIPMENT_OPTIONS.map((option) => (
                        <EquipmentCard
                          key={option.id}
                          option={option}
                          isSelected={selectedEquipment.includes(option.id)}
                          onToggle={() =>
                            toggleEquipment(
                              option.id,
                              !selectedEquipment.includes(option.id)
                            )
                          }
                          disabled={disabled}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Loading Assistance Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hand className="h-5 w-5 text-primary" />
                Loading Assistance
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <p>
                      Choose who will load the packages onto the truck. Driver
                      assistance is available for an additional fee.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="loadingAssistance"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={handleLoadingAssistanceChange}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                        disabled={disabled}
                      >
                        {LOADING_ASSISTANCE_OPTIONS.map((option) => (
                          <LoadingAssistanceCard
                            key={option.value}
                            option={option}
                            isSelected={field.value === option.value}
                            onSelect={() =>
                              handleLoadingAssistanceChange(option.value)
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
            </CardContent>
          </Card>

          {/* Fee Summary */}
          <FeeSummary
            equipmentFees={equipmentFees}
            loadingFee={loadingFee}
            totalFee={totalFee}
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
    </TooltipProvider>
  );
}

export default PickupEquipmentSelector;
