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
import { packageTypeConfigs, type PackageTypeConfig } from "@/lib/data/shipment-presets";
import { Ruler, Info, AlertTriangle } from "lucide-react";
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
  /** Currently selected package type (for max dimension validation) */
  packageType?: PackageTypeConfig["value"];
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
  /** Pre-calculated dimensional weight (if passed from parent) */
  dimensionalWeight?: number | null;
  /** Error messages */
  errors?: {
    length?: string;
    width?: string;
    height?: string;
  };
}

/**
 * DimensionsInput - Package dimensions input with unit toggle and validation
 *
 * Provides inputs for length, width, and height with real-time
 * unit conversion between inches and centimeters.
 * 
 * Features:
 * - Max dimension validation per package type
 * - Real-time dimensional weight calculation (L×W×H/166)
 * - Unit toggle with automatic value conversion
 * - Visual warnings for oversized dimensions
 */
export function DimensionsInput({
  length,
  width,
  height,
  unit,
  packageType,
  onChange,
  className,
  disabled = false,
  showDimensionalWeight = true,
  dimensionalWeight: externalDimensionalWeight,
  errors,
}: DimensionsInputProps) {
  // Get max dimensions for the selected package type
  const maxDimensions = React.useMemo(() => {
    if (!packageType) return null;
    const config = packageTypeConfigs.find(c => c.value === packageType);
    return config?.maxDimensions || null;
  }, [packageType]);

  // Calculate dimensional weight using the standard divisor (166 for international, 139 for domestic)
  // Use external value if provided, otherwise calculate internally
  const calculatedDimensionalWeight = React.useMemo(() => {
    if (!length || !width || !height) return null;
    return calculateDimensionalWeight(length, width, height, unit);
  }, [length, width, height, unit]);

  const dimensionalWeight = externalDimensionalWeight ?? calculatedDimensionalWeight;

  // Check if dimensions exceed max for package type
  const dimensionWarnings = React.useMemo(() => {
    if (!maxDimensions || unit !== "in") return { length: false, width: false, height: false };
    
    return {
      length: length ? length > maxDimensions.length : false,
      width: width ? width > maxDimensions.width : false,
      height: height ? height > maxDimensions.height : false,
    };
  }, [length, width, height, maxDimensions, unit]);

  const hasDimensionWarning = dimensionWarnings.length || dimensionWarnings.width || dimensionWarnings.height;

  // Handle unit toggle with automatic conversion
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
  const maxDimsText = maxDimensions && unit === "in" 
    ? `Max: ${maxDimensions.length}" × ${maxDimensions.width}" × ${maxDimensions.height}"`
    : maxDimensions && unit === "cm"
    ? `Max: ${Math.round(maxDimensions.length * 2.54)} × ${Math.round(maxDimensions.width * 2.54)} × ${Math.round(maxDimensions.height * 2.54)} cm`
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Dimensions</label>
          {hasDimensionWarning && (
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Dimension warning" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {maxDimsText && (
            <span className="text-xs text-muted-foreground">{maxDimsText}</span>
          )}
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
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField 
          label="Length" 
          error={errors?.length || (dimensionWarnings.length ? `Max ${maxDimensions?.length}${unitLabel}` : undefined)}
        >
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={length ?? ""}
              onChange={(e) => handleDimensionChange("length", e.target.value)}
              disabled={disabled}
              className={cn(
                "pr-10",
                dimensionWarnings.length && "border-amber-500 focus-visible:ring-amber-500/20"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </FormField>

        <FormField 
          label="Width" 
          error={errors?.width || (dimensionWarnings.width ? `Max ${maxDimensions?.width}${unitLabel}` : undefined)}
        >
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={width ?? ""}
              onChange={(e) => handleDimensionChange("width", e.target.value)}
              disabled={disabled}
              className={cn(
                "pr-10",
                dimensionWarnings.width && "border-amber-500 focus-visible:ring-amber-500/20"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </FormField>

        <FormField 
          label="Height" 
          error={errors?.height || (dimensionWarnings.height ? `Max ${maxDimensions?.height}${unitLabel}` : undefined)}
        >
          <div className="relative">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.0"
              value={height ?? ""}
              onChange={(e) => handleDimensionChange("height", e.target.value)}
              disabled={disabled}
              className={cn(
                "pr-10",
                dimensionWarnings.height && "border-amber-500 focus-visible:ring-amber-500/20"
              )}
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
            <span className="text-sm font-semibold">{dimensionalWeight.toFixed(1)} lbs</span>
          </div>
          {maxDimensions && unit === "in" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Max allowed: {maxDimensions.length}" × {maxDimensions.width}" × {maxDimensions.height}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DimensionsInput;
