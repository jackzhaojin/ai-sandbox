"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  Flame,
  Thermometer,
  PenTool,
  UserCheck,
  Store,
  CalendarClock,
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
}

/**
 * SpecialHandlingSelector - Multi-select checkboxes for special handling options
 *
 * Displays 7 special handling options with fee badges and optional
 * instruction fields for options that require additional details.
 */
export function SpecialHandlingSelector({
  value,
  onChange,
  className,
  disabled = false,
}: SpecialHandlingSelectorProps) {
  // Get current selection state
  const getSelection = React.useCallback(
    (type: SpecialHandlingType) => {
      return value.find((h) => h.type === type) || { type, isSelected: false, instructions: "" };
    },
    [value]
  );

  // Handle checkbox toggle
  const handleToggle = React.useCallback(
    (type: SpecialHandlingType, checked: boolean) => {
      const newValue = value.map((h) =>
        h.type === type ? { ...h, isSelected: checked } : h
      );
      // Add if not exists
      if (!value.some((h) => h.type === type)) {
        newValue.push({ type, isSelected: checked, instructions: "" });
      }
      onChange(newValue);
    },
    [value, onChange]
  );

  // Handle instruction change
  const handleInstructionChange = React.useCallback(
    (type: SpecialHandlingType, instructions: string) => {
      const newValue = value.map((h) =>
        h.type === type ? { ...h, instructions } : h
      );
      onChange(newValue);
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Special Handling</label>
        <p className="text-xs text-muted-foreground">
          Select any special handling requirements for your shipment
        </p>
      </div>

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
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        config.fee > 0
                          ? "bg-warning-100 text-warning-800"
                          : "bg-success-100 text-success-800"
                      )}
                    >
                      {config.fee > 0 ? `+$${config.fee.toFixed(2)}` : "Free"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>

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
    </div>
  );
}

export default SpecialHandlingSelector;
