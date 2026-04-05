"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { deliveryPreferenceConfigs } from "@/lib/data/shipment-presets";
import type { DeliveryPreferencesFormData } from "@/lib/validation/shipment-details-schema";
import {
  Calendar,
  Sun,
  PenTool,
  UserCheck,
  DoorOpen,
  Building,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Sun,
  PenTool,
  UserCheck,
  DoorOpen,
  Building,
};

type DeliveryPreferenceKey = keyof DeliveryPreferencesFormData;

export interface DeliveryPreferencesSelectorProps {
  /** Current delivery preferences */
  value: DeliveryPreferencesFormData;
  /** Callback when preferences change */
  onChange: (preferences: DeliveryPreferencesFormData) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
}

/**
 * DeliveryPreferencesSelector - Delivery option checkboxes with fees
 *
 * Displays 6 delivery preference options including weekend delivery,
 * signature requirements, and hold options.
 */
export function DeliveryPreferencesSelector({
  value,
  onChange,
  className,
  disabled = false,
}: DeliveryPreferencesSelectorProps) {
  // Handle checkbox toggle
  const handleToggle = React.useCallback(
    (key: DeliveryPreferenceKey, checked: boolean) => {
      onChange({
        ...value,
        [key]: checked,
      });
    },
    [value, onChange]
  );

  // Handle instructions change
  const handleInstructionsChange = React.useCallback(
    (instructions: string) => {
      onChange({
        ...value,
        deliveryInstructions: instructions,
      });
    },
    [value, onChange]
  );

  // Map config values to form keys
  const getPreferenceKey = (configValue: string): DeliveryPreferenceKey => {
    const keyMap: Record<string, DeliveryPreferenceKey> = {
      saturdayDelivery: "saturdayDelivery",
      sundayDelivery: "sundayDelivery",
      signatureRequired: "signatureRequired",
      adultSignatureRequired: "adultSignatureRequired",
      leaveWithoutSignature: "leaveWithoutSignature",
      holdAtFacility: "holdAtFacility",
    };
    return keyMap[configValue] || "saturdayDelivery";
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Delivery Preferences</label>
        <p className="text-xs text-muted-foreground">
          Customize how your shipment should be delivered
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {deliveryPreferenceConfigs.map((config) => {
          const Icon = iconMap[config.icon] || Calendar;
          const key = getPreferenceKey(config.value);
          const isSelected = value[key] as boolean;

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
                  id={`delivery-${config.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleToggle(key, checked === true)
                  }
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <label
                      htmlFor={`delivery-${config.value}`}
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery Instructions</label>
        <p className="text-xs text-muted-foreground">
          Add any special instructions for the delivery driver
        </p>
        <Input
          placeholder="e.g., Ring doorbell, leave at side door, etc."
          value={value.deliveryInstructions || ""}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default DeliveryPreferencesSelector;
