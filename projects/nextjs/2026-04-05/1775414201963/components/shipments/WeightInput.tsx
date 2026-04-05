"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  calculateBillableWeight,
  convertWeight,
  type WeightUnit,
} from "@/lib/validation/shipment-details-schema";
import { Scale, Info, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface WeightInputProps {
  /** Current weight value */
  weight?: number;
  /** Current unit */
  unit: WeightUnit;
  /** Dimensional weight (in lbs) for billable weight calculation */
  dimensionalWeight?: number | null;
  /** Callback when weight changes */
  onChange: (weight: { weight?: number; unit: WeightUnit }) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Show weight comparison section */
  showWeightComparison?: boolean;
  /** Error message */
  error?: string;
  /** Max weight allowed (in lbs) */
  maxWeight?: number;
}

/**
 * WeightInput - Package weight input with unit toggle and billable weight display
 *
 * Provides input for package weight with real-time unit
 * conversion between pounds and kilograms.
 * 
 * Features:
 * - Displays Actual Weight, Dimensional Weight, and Billable Weight
 * - Warning when dimensional weight exceeds actual weight
 * - Unit toggle with automatic value conversion
 * - Max weight validation
 */
export function WeightInput({
  weight,
  unit,
  dimensionalWeight,
  onChange,
  className,
  disabled = false,
  showWeightComparison = true,
  error,
  maxWeight,
}: WeightInputProps) {
  // Calculate billable weight (max of actual or dimensional)
  const billableWeight = React.useMemo(() => {
    if (!weight) return null;
    return calculateBillableWeight(weight, dimensionalWeight || 0, unit);
  }, [weight, dimensionalWeight, unit]);

  // Check if dimensional weight exceeds actual weight
  const dimWeightExceedsActual = React.useMemo(() => {
    if (!weight || !dimensionalWeight) return false;
    const actualInLbs = unit === "kg" ? weight / 0.453592 : weight;
    return dimensionalWeight > actualInLbs;
  }, [weight, dimensionalWeight, unit]);

  // Check if weight exceeds max
  const weightExceedsMax = React.useMemo(() => {
    if (!weight || !maxWeight) return false;
    const weightInLbs = unit === "kg" ? weight / 0.453592 : weight;
    return weightInLbs > maxWeight;
  }, [weight, maxWeight, unit]);

  // Handle unit toggle with automatic conversion
  const handleUnitChange = React.useCallback(
    (newUnit: WeightUnit) => {
      if (newUnit === unit) return;

      // Convert existing value to new unit
      onChange({
        weight: weight ? convertWeight(weight, unit, newUnit) : undefined,
        unit: newUnit,
      });
    },
    [weight, unit, onChange]
  );

  // Handle weight input change
  const handleWeightChange = React.useCallback(
    (value: string) => {
      const numValue = value === "" ? undefined : parseFloat(value);
      onChange({
        weight: numValue,
        unit,
      });
    },
    [unit, onChange]
  );

  const unitLabel = unit === "lbs" ? "lbs" : "kg";
  const maxWeightText = maxWeight ? `Max: ${maxWeight} lbs` : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Weight</label>
          {dimWeightExceedsActual && (
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Dimensional weight exceeds actual weight" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {maxWeightText && (
            <span className="text-xs text-muted-foreground">{maxWeightText}</span>
          )}
          <ToggleGroup
            type="single"
            value={unit}
            onValueChange={(value) => value && handleUnitChange(value as WeightUnit)}
            disabled={disabled}
            className="h-8"
          >
            <ToggleGroupItem value="lbs" aria-label="Pounds" className="text-xs px-3">
              lbs
            </ToggleGroupItem>
            <ToggleGroupItem value="kg" aria-label="Kilograms" className="text-xs px-3">
              kg
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <FormField
        label="Package Weight"
        error={error || (weightExceedsMax ? `Maximum weight is ${maxWeight} lbs` : undefined)}
        required
      >
        <div className="relative">
          <Input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="0.0"
            value={weight ?? ""}
            onChange={(e) => handleWeightChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "pr-12",
              weightExceedsMax && "border-amber-500 focus-visible:ring-amber-500/20"
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unitLabel}
          </span>
        </div>
      </FormField>

      {showWeightComparison && (weight !== undefined || dimensionalWeight !== null) && (
        <div className={cn(
          "rounded-lg p-3 space-y-2",
          dimWeightExceedsActual ? "bg-amber-50 border border-amber-200" : "bg-muted"
        )}>
          {/* Weight comparison header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Weight Comparison</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Billable weight is the greater of actual weight or dimensional weight.
                      This is what carriers use to calculate shipping costs.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Actual Weight */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Actual Weight:</span>
            <span className={cn(
              "font-medium",
              !weight && "text-muted-foreground italic"
            )}>
              {weight ? `${weight.toFixed(1)} ${unitLabel}` : "Not specified"}
            </span>
          </div>

          {/* Dimensional Weight */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dimensional Weight:</span>
            <span className={cn(
              "font-medium",
              !dimensionalWeight && "text-muted-foreground italic"
            )}>
              {dimensionalWeight ? `${dimensionalWeight.toFixed(1)} lbs` : "Calculate from dimensions"}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Billable Weight */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Billable Weight:</span>
            <span className="text-sm font-bold text-primary">
              {billableWeight ? `${billableWeight.toFixed(1)} lbs` : "—"}
            </span>
          </div>

          {/* Warning when DIM weight exceeds actual */}
          {dimWeightExceedsActual && (
            <div className="flex items-start gap-2 rounded-md bg-amber-100 p-2 text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">
                <strong>Dimensional weight applies:</strong> Your package will be charged based on 
                dimensional weight ({dimensionalWeight?.toFixed(1)} lbs) instead of actual weight.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeightInput;
