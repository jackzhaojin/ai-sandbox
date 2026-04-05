"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { specialHandlingConfigs } from "@/lib/data/shipment-presets";
import type { SpecialHandlingFormData, SpecialHandlingType } from "@/lib/validation/shipment-details-schema";
import {
  AlertTriangle,
  Flame,
  Thermometer,
  PenTool,
  UserCheck,
  Store,
  CalendarClock,
  Snowflake,
  Package,
  DollarSign,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  Flame,
  Thermometer,
  PenTool,
  UserCheck,
  Store,
  CalendarClock,
  Snowflake,
};

export interface SpecialHandlingSelectorProps {
  /** Current special handling selections */
  value: SpecialHandlingFormData[];
  /** Callback when selections change */
  onChange: (handling: SpecialHandlingFormData[]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Callback when hazmat selection changes (for showing HazmatForm) */
  onHazmatToggle?: (isSelected: boolean) => void;
}

/**
 * SpecialHandlingSelector - Multi-select checkboxes for special handling options
 *
 * Displays 8 special handling options with:
 * - Fee badges for each option
 * - Running total of selected fees
 * - Multi-select checkbox behavior
 * - Conditional HazmatForm placeholder when Hazardous Materials selected
 */
export function SpecialHandlingSelector({
  value,
  onChange,
  className,
  disabled = false,
  onHazmatToggle,
}: SpecialHandlingSelectorProps) {
  // Get current selection state
  const getSelection = React.useCallback(
    (type: SpecialHandlingType) => {
      return value.find((h) => h.type === type) || { type, isSelected: false, instructions: "" };
    },
    [value]
  );

  // Check if hazardous materials is selected
  const isHazmatSelected = React.useMemo(() => {
    const hazmatSelection = value.find((h) => h.type === "hazardous");
    return hazmatSelection?.isSelected || false;
  }, [value]);

  // Calculate total fees for selected options
  const totalFees = React.useMemo(() => {
    return value.reduce((total, handling) => {
      if (!handling.isSelected) return total;
      const config = specialHandlingConfigs.find((c) => c.value === handling.type);
      return total + (config?.fee || 0);
    }, 0);
  }, [value]);

  // Handle checkbox toggle
  const handleToggle = React.useCallback(
    (type: SpecialHandlingType, checked: boolean) => {
      const existingIndex = value.findIndex((h) => h.type === type);
      let newValue: SpecialHandlingFormData[];

      if (existingIndex >= 0) {
        // Update existing
        newValue = value.map((h, index) =>
          index === existingIndex ? { ...h, isSelected: checked } : h
        );
      } else {
        // Add new
        newValue = [...value, { type, isSelected: checked, instructions: "" }];
      }

      onChange(newValue);

      // Notify parent if hazmat toggle changes
      if (type === "hazardous" && onHazmatToggle) {
        onHazmatToggle(checked);
      }
    },
    [value, onChange, onHazmatToggle]
  );

  // Handle instruction change
  const handleInstructionChange = React.useCallback(
    (type: SpecialHandlingType, instructions: string) => {
      const existingIndex = value.findIndex((h) => h.type === type);

      if (existingIndex >= 0) {
        onChange(
          value.map((h, index) => (index === existingIndex ? { ...h, instructions } : h))
        );
      } else {
        onChange([...value, { type, isSelected: true, instructions }]);
      }
    },
    [value, onChange]
  );

  // Count selected options
  const selectedCount = React.useMemo(() => {
    return value.filter((h) => h.isSelected).length;
  }, [value]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with count and total */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-sm font-medium">Special Handling</label>
          <p className="text-xs text-muted-foreground">
            Select any special handling requirements for your shipment
          </p>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>
          </div>
        )}
      </div>

      {/* Special Handling Options Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {specialHandlingConfigs.map((config) => {
          const Icon = iconMap[config.icon] || AlertTriangle;
          const selection = getSelection(config.value as SpecialHandlingType);
          const isSelected = selection.isSelected;

          return (
            <div
              key={config.value}
              className={cn(
                "rounded-lg border p-3 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                disabled && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`handling-${config.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleToggle(config.value as SpecialHandlingType, checked === true)
                  }
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <label
                      htmlFor={`handling-${config.value}`}
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {config.label}
                    </label>
                    <Badge
                      variant={config.fee > 0 ? "secondary" : "outline"}
                      className={cn(
                        "shrink-0 text-xs",
                        config.fee > 0
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                          : "text-muted-foreground"
                      )}
                    >
                      {config.fee > 0 ? `+$${config.fee.toFixed(2)}` : "Free"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>

                  {/* Instructions input when selected */}
                  {isSelected && config.requiresInstructions && (
                    <div className="pt-2">
                      <Input
                        placeholder={`Enter ${config.label.toLowerCase()} instructions...`}
                        value={selection.instructions || ""}
                        onChange={(e) =>
                          handleInstructionChange(
                            config.value as SpecialHandlingType,
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Running Total of Fees */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Special Handling Fees:</span>
          </div>
          <span
            className={cn(
              "text-sm font-bold",
              totalFees > 0 ? "text-amber-600" : "text-muted-foreground"
            )}
          >
            {totalFees > 0 ? `+$${totalFees.toFixed(2)}` : "Free"}
          </span>
        </div>
      )}

      {/* Hazmat Placeholder - shown when Hazardous Materials is selected */}
      {isHazmatSelected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-amber-800">
                  Hazardous Materials Documentation Required
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  This shipment contains hazardous materials and requires additional documentation.
                  Please complete the HazmatForm with the required UN number, proper shipping name,
                  and emergency contact information.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-700 bg-amber-100/50"
                >
                  <Flame className="h-3 w-3 mr-1" />
                  Hazmat Fee: +$25.00
                </Badge>
                <span className="text-xs text-amber-600">
                  HazmatForm placeholder - Step 5 will implement full form
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecialHandlingSelector;
