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
import { Scale, Info } from "lucide-react";
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
  /** Show billable weight calculation */
  showBillableWeight?: boolean;
  /** Error message */
  error?: string;
}

/**
 * WeightInput - Package weight input with unit toggle
 *
 * Provides input for package weight with real-time unit
 * conversion between pounds and kilograms.
 */
export function WeightInput({
  weight,
  unit,
  dimensionalWeight,
  onChange,
  className,
  disabled = false,
  showBillableWeight = true,
  error,
}: WeightInputProps) {
  // Calculate billable weight
  const billableWeight = React.useMemo(() => {
    if (!weight) return null;
    return calculateBillableWeight(weight, dimensionalWeight || 0, unit);
  }, [weight, dimensionalWeight, unit]);

  // Handle unit toggle
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

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Weight</label>
        </div>
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

      <FormField
        label="Package Weight"
        error={error}
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
            className="pr-12"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unitLabel}
          </span>
        </div>
      </FormField>

      {showBillableWeight && billableWeight !== null && (
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Billable Weight:</span>
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
            <span className="text-sm font-semibold">{billableWeight.toFixed(1)} lbs</span>
          </div>
          {dimensionalWeight && dimensionalWeight > (weight || 0) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Based on dimensional weight ({dimensionalWeight.toFixed(1)} lbs)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default WeightInput;
