"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { shipmentPresets, type ShipmentPreset } from "@/lib/data/shipment-presets";
import {
  FileText,
  Cpu,
  Wrench,
  Stethoscope,
  Presentation,
  Check,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Cpu,
  Wrench,
  Stethoscope,
  Presentation,
};

export interface PresetSelectorProps {
  /** Currently selected preset ID */
  selectedPresetId?: string;
  /** Callback when a preset is selected */
  onSelect: (preset: ShipmentPreset) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all interactions */
  disabled?: boolean;
}

/**
 * PresetSelector - Quick selection cards for common shipment types
 *
 * Displays 5 preset cards that automatically fill the form with
 * appropriate defaults for common B2B shipping scenarios.
 */
export function PresetSelector({
  selectedPresetId,
  onSelect,
  className,
  disabled = false,
}: PresetSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Quick Start Presets</h3>
        <p className="text-sm text-muted-foreground">
          Select a preset to quickly fill in common shipment details
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {shipmentPresets.map((preset) => {
          const Icon = iconMap[preset.icon] || FileText;
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => !disabled && onSelect(preset)}
              disabled={disabled}
              className={cn(
                "relative text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${preset.name} preset`}
            >
              <Card
                className={cn(
                  "h-full cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-sm font-medium">
                    {preset.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {preset.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {preset.data.packages?.map((pkg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {pkg.packageType === "box" && "Box"}
                        {pkg.packageType === "envelope" && "Envelope"}
                        {pkg.packageType === "tube" && "Tube"}
                        {pkg.packageType === "pallet" && "Pallet"}
                        {" "}• {pkg.weight} {pkg.weightUnit}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PresetSelector;
