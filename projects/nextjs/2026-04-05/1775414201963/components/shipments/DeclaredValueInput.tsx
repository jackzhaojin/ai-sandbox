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
import { DollarSign, Shield, AlertTriangle, AlertCircle } from "lucide-react";

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
  /** Minimum allowed value (default: 1) */
  min?: number;
  /** Maximum allowed value (default: 100000) */
  max?: number;
  /** Threshold for insurance recommended warning (default: 2500) */
  insuranceRecommendedThreshold?: number;
  /** Threshold for insurance required warning (default: 5000) */
  insuranceRequiredThreshold?: number;
}

/**
 * DeclaredValueInput - Declared value input with currency selector and validation
 *
 * Provides input for package declared value with:
 * - Currency selection (USD, CAD, MXN)
 * - Range validation ($1-$100,000)
 * - Warning at $2,500+ (insurance recommended)
 * - Warning at $5,000+ (insurance required)
 * - Real-time currency formatting
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
  insuranceRecommendedThreshold = 2500,
  insuranceRequiredThreshold = 5000,
}: DeclaredValueInputProps) {
  // Get currency symbol and formatting
  const currencyInfo = React.useMemo(() => {
    return currencyOptions.find((c) => c.value === currency) || currencyOptions[0];
  }, [currency]);

  // Format number as currency string
  const formatCurrency = React.useCallback(
    (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [currency]
  );

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

  // Validate value and determine validation state
  const validationState = React.useMemo(() => {
    if (value === undefined) {
      return { error: undefined, warning: null };
    }

    // Range validation
    if (value < min) {
      return {
        error: `Declared value must be at least ${currencyInfo.symbol}${min}`,
        warning: null,
      };
    }
    if (value > max) {
      return {
        error: `Declared value must not exceed ${currencyInfo.symbol}${max.toLocaleString()}`,
        warning: null,
      };
    }

    // Insurance warnings
    if (value >= insuranceRequiredThreshold) {
      return {
        error: undefined,
        warning: {
          type: "required" as const,
          message: `Insurance required for values ${currencyInfo.symbol}${insuranceRequiredThreshold.toLocaleString()}+`,
        },
      };
    }
    if (value >= insuranceRecommendedThreshold) {
      return {
        error: undefined,
        warning: {
          type: "recommended" as const,
          message: `Insurance recommended for values ${currencyInfo.symbol}${insuranceRecommendedThreshold.toLocaleString()}+`,
        },
      };
    }

    return { error: undefined, warning: null };
  }, [value, min, max, currencyInfo.symbol, insuranceRecommendedThreshold, insuranceRequiredThreshold]);

  const displayError = error || validationState.error;

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
          helpText={`Range: ${currencyInfo.symbol}${min} - ${currencyInfo.symbol}${max.toLocaleString()}`}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              {currencyInfo.symbol}
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
              className={cn(
                "pl-8",
                validationState.warning?.type === "required" && "border-amber-500 focus-visible:ring-amber-500/20",
                validationState.warning?.type === "recommended" && "border-blue-400 focus-visible:ring-blue-400/20"
              )}
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

      {/* Insurance Warnings */}
      {validationState.warning && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg p-3",
            validationState.warning.type === "required"
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
          )}
        >
          {validationState.warning.type === "required" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
          )}
          <div className="space-y-1">
            <p
              className={cn(
                "text-xs font-medium",
                validationState.warning.type === "required" ? "text-amber-800" : "text-blue-800"
              )}
            >
              {validationState.warning.type === "required" ? "Insurance Required" : "Insurance Recommended"}
            </p>
            <p
              className={cn(
                "text-xs",
                validationState.warning.type === "required" ? "text-amber-700" : "text-blue-700"
              )}
            >
              {validationState.warning.message}
              {value !== undefined && (
                <>
                  {" "}
                  Current value: <strong>{formatCurrency(value)}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Insurance Info */}
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
        <Shield className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium">Insurance Coverage</p>
          <p className="text-xs text-muted-foreground">
            Declared value determines insurance coverage. Maximum coverage is {currencyInfo.symbol}
            {max.toLocaleString()}. Items valued over {currencyInfo.symbol}
            {insuranceRequiredThreshold.toLocaleString()} require additional insurance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeclaredValueInput;
