"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  MapPin,
  Building,
  Home,
  Hash,
  Globe,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface BillingAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingAddressSectionProps {
  /** Form field prefix (e.g., "billingAddress") */
  name?: string;
  /** Origin address to use when "Same as Origin" is checked */
  originAddress?: BillingAddress;
  /** Additional CSS classes */
  className?: string;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Label for the section */
  label?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * BillingAddressSection - Reusable billing address section
 *
 * Features:
 * - All standard address fields (street, city, state, postal code, country)
 * - "Same as Origin" checkbox to copy from origin address
 * - Pre-filled and editable
 *
 * @example
 * <BillingAddressSection
 *   name="billingAddress"
 *   originAddress={shipmentOriginAddress}
 * />
 */
export function BillingAddressSection({
  name = "billingAddress",
  originAddress,
  className,
  disabled = false,
  label = "Billing Address",
}: BillingAddressSectionProps) {
  const { control, setValue, watch } = useFormContext();
  const [sameAsOrigin, setSameAsOrigin] = React.useState(false);

  // Watch the address fields
  const currentAddress = watch(name);

  // Handle "Same as Origin" toggle
  const handleSameAsOriginChange = (checked: boolean) => {
    setSameAsOrigin(checked);
    if (checked && originAddress) {
      setValue(name, originAddress, { shouldValidate: true });
    }
  };

  // Update address when origin changes and "same as origin" is checked
  React.useEffect(() => {
    if (sameAsOrigin && originAddress) {
      setValue(name, originAddress, { shouldValidate: true });
    }
  }, [sameAsOrigin, originAddress, setValue, name]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {label}
        </h3>
      </div>

      {/* Same as Origin Checkbox */}
      {originAddress && (
        <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id={`${name}-same-as-origin`}
            checked={sameAsOrigin}
            onCheckedChange={handleSameAsOriginChange}
            disabled={disabled}
          />
          <div className="space-y-1 leading-none">
            <label
              htmlFor={`${name}-same-as-origin`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Same as Origin Address
            </label>
            <p className="text-xs text-muted-foreground">
              Use the shipment origin address as the billing address
            </p>
          </div>
        </div>
      )}

      {/* Street Address Line 1 */}
      <Controller
        name={`${name}.street1`}
        control={control}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              Street Address
              <span className="text-error-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="123 Main Street"
                  disabled={disabled || sameAsOrigin}
                  className="pl-10"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Street Address Line 2 */}
      <Controller
        name={`${name}.street2`}
        control={control}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Apartment, Suite, etc. (Optional)</FormLabel>
            <FormControl>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suite 100"
                  disabled={disabled || sameAsOrigin}
                  className="pl-10"
                  {...field}
                  value={field.value || ""}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* City, State, Postal Code Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <Controller
          name={`${name}.city`}
          control={control}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                City
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="City"
                  disabled={disabled || sameAsOrigin}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* State */}
        <Controller
          name={`${name}.state`}
          control={control}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                State/Province
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="CA"
                  disabled={disabled || sameAsOrigin}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Postal Code */}
        <Controller
          name={`${name}.postalCode`}
          control={control}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                <span className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5" />
                  Postal Code
                </span>
                <span className="text-error-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="12345"
                  disabled={disabled || sameAsOrigin}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Country */}
      <Controller
        name={`${name}.country`}
        control={control}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                Country
              </span>
              <span className="text-error-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="United States"
                disabled={disabled || sameAsOrigin}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default BillingAddressSection;
