"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { packageTypeConfigs, type PackageTypeConfig } from "@/lib/data/shipment-presets";
import { Mail, Package, Container, Boxes, Check } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Package,
  Container,
  Boxes,
};

export interface PackageTypeSelectorProps {
  /** Currently selected package type */
  selectedType?: PackageTypeConfig["value"];
  /** Callback when a type is selected */
  onSelect: (type: PackageTypeConfig["value"]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all interactions */
  disabled?: boolean;
}

/**
 * PackageTypeSelector - Visual card selector for package types
 *
 * Displays 7 package type cards with icons, descriptions, and
 * weight/dimension limits for easy selection.
 * 
 * Package types: Envelope, Small Box, Medium Box, Large Box, Pallet, Crate, Multiple Pieces
 */
export function PackageTypeSelector({
  selectedType,
  onSelect,
  className,
  disabled = false,
}: PackageTypeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Package Type</label>
        <p className="text-xs text-muted-foreground">
          Select the type of packaging for your shipment
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {packageTypeConfigs.map((config) => {
          const Icon = iconMap[config.icon] || Package;
          const isSelected = selectedType === config.value;

          return (
            <button
              key={config.value}
              type="button"
              onClick={() => !disabled && onSelect(config.value)}
              disabled={disabled}
              className={cn(
                "relative text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-pressed={isSelected}
              aria-label={`Select ${config.label} package type`}
            >
              <Card
                className={cn(
                  "h-full cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-medium text-sm">{config.label}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {config.description}
                      </p>
                    </div>

                    <div className="mt-3 w-full space-y-1 border-t pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Max Weight:</span>
                        <span className="font-medium">{config.maxWeight} lbs</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="font-medium">
                          {config.maxDimensions.length}" × {config.maxDimensions.width}" × {config.maxDimensions.height}"
                        </span>
                      </div>
                    </div>
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

export default PackageTypeSelector;
