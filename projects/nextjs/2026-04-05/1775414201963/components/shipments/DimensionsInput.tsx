"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  calculateDimensionalWeight,
  convertDimensions,
  type DimensionsUnit,
} from "@/lib/validation/shipment-details-schema";
import { Ruler, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DimensionsInputProps {
  /** Current length value */
  length?: number;
  /** Current width value */
  width?: number;
  /** Current height value */
  height?: number;
  /** Current unit */
  unit: DimensionsUnit;
  /** Callback when dimensions change */
  onChange: (dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit: DimensionsUnit;
  }) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Show dimensional weight calculation */
  showDimensionalWeight?: boolean;
  /** Pre-calculated dimensional weight to display */
  dimensionalWeight?: number | null;
  /** Error messages */
  errors?: {
    length?: string;
    width?: string;
    height?: string;
  };
}

/**
 * DimensionsInput - Package dimensions input with unit toggle
 *
 * Provides inputs for length, width, and height with real-time
 * unit conversion between inches and centimeters.
 */
export function DimensionsInput({
  length,
  width,
  height,
  unit,
  onChange,
  className,
  disabled = false,
  showDimensionalWeight = true,
  errors,
}: DimensionsInputProps) {
  // Calculate dimensional weight
  const dimensionalWeight = React.useMemo(() => {
    if (!length || !width || !height) return null;
    return calculateDimensionalWeight(length, width, height, unit);
  }, [length, width, height, unit]);

  // Handle unit toggle
  const handleUnitChange = React.useCallback(
    (newUnit: DimensionsUnit) => {
      if (newUnit === unit) return;

      // Convert existing values to new unit
      onChange({
        length: length ? convertDimensions(length, unit, newUnit) : undefined,
        width: width ? convertDimensions(width, unit, newUnit) : undefined,
        height: height ? convertDimensions(height, unit, newUnit) : undefined,
        unit: newUnit,
      });
    },
    [length, width, height, unit, onChange]
  );

  // Handle dimension input changes
  const handleDimensionChange = React.useCallback(
    (field: "length" | "width" | "height", value: string) => {
      const numValue = value === "" ? undefined : parseFloat(value);
      onChange({
        length: field === "length" ? numValue : length,
        width: field === "width" ? numValue : width,
        height: field === "height" ? numValue : height,
        unit,
      });
    },
    [length, width, height, unit, onChange]
  );

  const unitLabel = unit === "in" ? "in" : "cm";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Dimensions</label>
        </div>
        <ToggleGroup
          type="single"
          value={unit}
          onValueChange={(value) => value && handleUnitChange(value as DimensionsUnit)}
          disabled={disabled}
          className="h-8"
        >
          <ToggleGroupItem value="in" aria-label="Inches" className="text-xs px-3">
            in
          </ToggleGroupItem>
          <ToggleGroupItem value="cm" aria-label="Centimeters" className="text-xs px-3">
            cm
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Length" error={errors?.length}>
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={length ?? ""}
              onChange={(e) => handleDimensionChange("length", e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </FormField>

        <FormField label="Width" error={errors?.width}>
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={width ?? ""}
              onChange={(e) => handleDimensionChange("width", e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </FormField>

        <FormField label="Height" error={errors?.height}>
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={height ?? ""}
              onChange={(e) => handleDimensionChange("height", e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </FormField>
      </div>

      {showDimensionalWeight && dimensionalWeight !== null && (
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dimensional Weight:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Dimensional weight is calculated using (L × W × H) / 139. 
                      Carriers charge based on the greater of actual or dimensional weight.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-semibold">{dimensionalWeight} lbs</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DimensionsInput;
