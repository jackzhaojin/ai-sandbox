"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hazmatClassDescriptions } from "@/lib/data/shipment-presets";
import type { HazmatFormData, HazmatClass } from "@/lib/validation/shipment-details-schema";
import { AlertTriangle, Flame, Phone, User } from "lucide-react";

export interface HazmatFormProps {
  /** Current hazmat data */
  value: HazmatFormData;
  /** Callback when data changes */
  onChange: (data: HazmatFormData) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Error messages */
  errors?: {
    hazmatClass?: string;
    unNumber?: string;
    properShippingName?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
}

/**
 * HazmatForm - Hazardous materials declaration form
 *
 * Conditional form that appears when hazardous materials handling
 * is selected. Collects required hazmat information.
 */
export function HazmatForm({
  value,
  onChange,
  className,
  disabled = false,
  errors,
}: HazmatFormProps) {
  // Handle isHazmat toggle
  const handleToggle = React.useCallback(
    (checked: boolean) => {
      onChange({
        ...value,
        isHazmat: checked,
      });
    },
    [value, onChange]
  );

  // Handle field changes
  const handleChange = React.useCallback(
    (field: keyof HazmatFormData, fieldValue: string | boolean | undefined) => {
      onChange({
        ...value,
        [field]: fieldValue,
      });
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "rounded-lg border p-4 transition-all duration-200",
          value.isHazmat
            ? "border-warning-200 bg-warning-50/50"
            : "border-border"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id="is-hazmat"
            checked={value.isHazmat}
            onCheckedChange={(checked) => handleToggle(checked === true)}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <label
                htmlFor="is-hazmat"
                className="flex cursor-pointer items-center gap-2 text-sm font-medium"
              >
                <Flame className="h-4 w-4 text-warning-600" />
                This shipment contains hazardous materials
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Hazardous materials require special handling and documentation.
              Additional fees may apply.
            </p>
          </div>
        </div>
      </div>

      {value.isHazmat && (
        <div className="space-y-4 rounded-lg border border-warning-200 bg-warning-50/30 p-4">
          <div className="flex items-center gap-2 text-warning-800">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="font-medium">Hazardous Materials Declaration</h4>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Hazmat Class"
              error={errors?.hazmatClass}
              required
            >
              <Select
                value={value.hazmatClass || ""}
                onValueChange={(val) =>
                  handleChange("hazmatClass", val as HazmatClass)
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hazmat class" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(hazmatClassDescriptions).map(
                    ([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {description}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="UN Number"
              error={errors?.unNumber}
              required
              helpText="Format: UN#### or NA####"
            >
              <Input
                placeholder="e.g., UN1203"
                value={value.unNumber || ""}
                onChange={(e) => handleChange("unNumber", e.target.value)}
                disabled={disabled}
              />
            </FormField>
          </div>

          <FormField
            label="Proper Shipping Name"
            error={errors?.properShippingName}
            required
            helpText="Official shipping name as it appears on the Safety Data Sheet"
          >
            <Input
              placeholder="Enter proper shipping name"
              value={value.properShippingName || ""}
              onChange={(e) =>
                handleChange("properShippingName", e.target.value)
              }
              disabled={disabled}
            />
          </FormField>

          <div className="border-t border-warning-200 pt-4">
            <h5 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Emergency Contact Information
            </h5>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Contact Name"
                error={errors?.emergencyContactName}
              >
                <Input
                  placeholder="Emergency contact name"
                  value={value.emergencyContactName || ""}
                  onChange={(e) =>
                    handleChange("emergencyContactName", e.target.value)
                  }
                  disabled={disabled}
                />
              </FormField>

              <FormField
                label="Contact Phone"
                error={errors?.emergencyContactPhone}
              >
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={value.emergencyContactPhone || ""}
                    onChange={(e) =>
                      handleChange("emergencyContactPhone", e.target.value)
                    }
                    disabled={disabled}
                    className="pl-10"
                  />
                </div>
              </FormField>
            </div>
          </div>

          <div className="rounded-md bg-warning-100 p-3 text-xs text-warning-800">
            <p className="font-medium">Important Notice:</p>
            <p className="mt-1">
              Hazardous materials shipments require proper packaging, labeling,
              and documentation. Failure to declare hazardous materials can
              result in fines up to $75,000 per violation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HazmatForm;
