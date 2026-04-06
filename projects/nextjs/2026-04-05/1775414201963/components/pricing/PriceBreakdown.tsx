"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Calculator } from "lucide-react";
import type { QuotePricingBreakdown } from "@/types/api";

export interface PriceBreakdownProps {
  /** Pricing breakdown data */
  pricing: QuotePricingBreakdown;
  /** Calculation basis details */
  calculationBasis?: {
    distance: number;
    weight: number;
    dimWeight?: number;
    zone: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * PriceBreakdown - Expandable pricing details component
 *
 * Shows detailed breakdown of shipping costs including base rate,
 * surcharges, fees, taxes, and calculation basis.
 */
export function PriceBreakdown({
  pricing,
  calculationBasis,
  className,
  defaultExpanded = false,
}: PriceBreakdownProps) {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded);

  // Calculate percentages for display
  const fuelSurchargePercent = pricing.base_rate > 0
    ? ((pricing.fuel_surcharge / pricing.base_rate) * 100).toFixed(1)
    : "0";
  
  const insurancePercent = pricing.subtotal > 0
    ? ((pricing.insurance_cost / pricing.subtotal) * 100).toFixed(1)
    : "0";

  const taxPercent = pricing.subtotal > 0
    ? ((pricing.taxes / pricing.subtotal) * 100).toFixed(1)
    : "0";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: pricing.currency || "USD",
    }).format(amount);
  };

  const hasAdditionalFees = 
    pricing.residential_fee > 0 ||
    pricing.extended_area_fee > 0 ||
    pricing.delivery_confirmation_fee > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <span className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Price Breakdown
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="space-y-3 pt-2">
          {/* Base Rate */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base Rate</span>
            <span className="font-medium">{formatCurrency(pricing.base_rate)}</span>
          </div>

          {/* Weight & Zone Charges */}
          {(pricing.weight_charge > 0 || pricing.zone_charge > 0) && (
            <>
              {pricing.weight_charge > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weight Charge</span>
                  <span className="font-medium">{formatCurrency(pricing.weight_charge)}</span>
                </div>
              )}
              {pricing.zone_charge > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zone Charge</span>
                  <span className="font-medium">{formatCurrency(pricing.zone_charge)}</span>
                </div>
              )}
            </>
          )}

          {/* Fuel Surcharge */}
          {pricing.fuel_surcharge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Fuel Surcharge ({fuelSurchargePercent}%)
              </span>
              <span className="font-medium">{formatCurrency(pricing.fuel_surcharge)}</span>
            </div>
          )}

          {/* Insurance */}
          {pricing.insurance_cost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Insurance ({insurancePercent}%)
              </span>
              <span className="font-medium">{formatCurrency(pricing.insurance_cost)}</span>
            </div>
          )}

          {/* Special Handling Fees */}
          {pricing.handling_fees > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Special Handling</span>
              <span className="font-medium">{formatCurrency(pricing.handling_fees)}</span>
            </div>
          )}

          {/* Additional Fees */}
          {hasAdditionalFees && (
            <>
              {pricing.residential_fee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Residential Delivery</span>
                  <span className="font-medium">{formatCurrency(pricing.residential_fee)}</span>
                </div>
              )}
              {pricing.extended_area_fee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Extended Area</span>
                  <span className="font-medium">{formatCurrency(pricing.extended_area_fee)}</span>
                </div>
              )}
              {pricing.delivery_confirmation_fee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Confirmation</span>
                  <span className="font-medium">{formatCurrency(pricing.delivery_confirmation_fee)}</span>
                </div>
              )}
            </>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
          </div>

          {/* Taxes */}
          {pricing.taxes > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Taxes ({taxPercent}%)
              </span>
              <span className="font-medium">{formatCurrency(pricing.taxes)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(pricing.total)}</span>
          </div>

          {/* Calculation Basis */}
          {calculationBasis && (
            <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
              <p className="mb-2 font-medium text-muted-foreground">Calculation Basis</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Distance:</span>{" "}
                  <span className="font-medium">{calculationBasis.distance.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Zone:</span>{" "}
                  <span className="font-medium">{calculationBasis.zone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight:</span>{" "}
                  <span className="font-medium">{calculationBasis.weight.toFixed(1)} lbs</span>
                </div>
                {calculationBasis.dimWeight && calculationBasis.dimWeight > calculationBasis.weight && (
                  <div>
                    <span className="text-muted-foreground">DIM Weight:</span>{" "}
                    <span className="font-medium">{calculationBasis.dimWeight.toFixed(1)} lbs</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default PriceBreakdown;
