"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencyOptions } from "@/lib/data/shipment-presets";
import { DollarSign, Shield } from "lucide-react";

export interface DeclaredValueInputProps {
  /** Current declared value */
  value?: number;
  /** Current currency */
  currency: "USD" | "CAD" | "MXN";
  /** Callback when value changes */
  onChange: (value: { declaredValue?: number; currency: "USD" | "CAD" | "MXN" }) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable all inputs */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
}

/**
 * DeclaredValueInput - Declared value input with currency selector
 *
 * Provides input for package declared value with currency selection
 * and range validation ($1-$100,000).
 */
export function DeclaredValueInput({
  value,
  currency,
  onChange,
  className,
  disabled = false,
  error,
  min = 1,
  max = 100000,
}: DeclaredValueInputProps) {
  // Get currency symbol
  const currencySymbol = React.useMemo(() => {
    return currencyOptions.find((c) => c.value === currency)?.symbol || "$";
  }, [currency]);

  // Handle value change
  const handleValueChange = React.useCallback(
    (inputValue: string) => {
      const numValue = inputValue === "" ? undefined : parseFloat(inputValue);
      onChange({
        declaredValue: numValue,
        currency,
      });
    },
    [currency, onChange]
  );

  // Handle currency change
  const handleCurrencyChange = React.useCallback(
    (newCurrency: string | null) => {
      if (!newCurrency) return;
      onChange({
        declaredValue: value,
        currency: newCurrency as "USD" | "CAD" | "MXN",
      });
    },
    [value, onChange]
  );

  // Validate value
  const validationError = React.useMemo(() => {
    if (value === undefined) return undefined;
    if (value < min) return `Declared value must be at least ${currencySymbol}${min}`;
    if (value > max) return `Declared value must not exceed ${currencySymbol}${max.toLocaleString()}`;
    return undefined;
  }, [value, min, max, currencySymbol]);

  const displayError = error || validationError;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Declared Value</label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          label="Value"
          error={displayError}
          className="sm:col-span-2"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              min={min}
              max={max}
              step="0.01"
              placeholder="0.00"
              value={value ?? ""}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={disabled}
              className="pl-8"
            />
          </div>
        </FormField>

        <FormField label="Currency">
          <Select
            value={currency}
            onValueChange={handleCurrencyChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
        <Shield className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium">Insurance Coverage</p>
          <p className="text-xs text-muted-foreground">
            Declared value determines insurance coverage. Maximum coverage is {currencySymbol}
            {max.toLocaleString()}. Items valued over {currencySymbol}
            {max.toLocaleString()} require special handling.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeclaredValueInput;
