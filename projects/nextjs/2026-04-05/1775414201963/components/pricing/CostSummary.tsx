"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Wallet, Truck, Clock, Users, FileText, Building2 } from "lucide-react";
import type { PaymentMethodOption } from "@/components/payment/PaymentMethodSelector";

// ============================================
// TYPES
// ============================================

export interface CostBreakdownItem {
  label: string;
  amount: number;
  percent?: number;
  tooltip?: string;
  highlight?: boolean;
}

export interface CostSummaryData {
  baseRate: number;
  fuelSurcharge: number;
  fuelSurchargePercent: number;
  insurance: number;
  insurancePercent: number;
  specialHandling: number;
  deliveryPreferences: number;
  taxes: number;
  taxPercent: number;
  subtotal: number;
  paymentMethodFee: number;
  total: number;
  currency: string;
}

export interface CostSummaryProps {
  /** Cost breakdown data */
  data: CostSummaryData;
  /** Currently selected payment method */
  selectedPaymentMethod?: PaymentMethodOption | null;
  /** Callback when payment method changes (for dynamic updates) */
  onPaymentMethodChange?: (method: PaymentMethodOption) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the summary is in a loading state */
  isLoading?: boolean;
  /** Whether to show tooltips for each item */
  showTooltips?: boolean;
}

// ============================================
// PAYMENT METHOD FEE CONFIGURATION
// ============================================

interface PaymentMethodConfig {
  id: PaymentMethodOption;
  name: string;
  icon: React.ReactNode;
  fee: {
    amount: number;
    type: "flat" | "percentage";
  } | null;
  description: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "purchase_order",
    name: "Purchase Order",
    icon: <FileText className="h-4 w-4" />,
    fee: null,
    description: "No additional fee",
  },
  {
    id: "bill_of_lading",
    name: "Bill of Lading",
    icon: <Truck className="h-4 w-4" />,
    fee: { amount: 2.5, type: "flat" },
    description: "$2.50 processing fee",
  },
  {
    id: "third_party_billing",
    name: "Third-Party Billing",
    icon: <Users className="h-4 w-4" />,
    fee: { amount: 5.0, type: "flat" },
    description: "$5.00 processing fee",
  },
  {
    id: "net_terms",
    name: "Net Terms",
    icon: <Clock className="h-4 w-4" />,
    fee: null,
    description: "No additional fee",
  },
  {
    id: "corporate_account",
    name: "Corporate Account",
    icon: <Building2 className="h-4 w-4" />,
    fee: null,
    description: "No additional fee",
  },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function calculatePaymentMethodFee(
  method: PaymentMethodOption | null | undefined,
  subtotal: number
): number {
  if (!method) return 0;
  
  const config = PAYMENT_METHODS.find((m) => m.id === method);
  if (!config?.fee) return 0;
  
  if (config.fee.type === "percentage") {
    return (subtotal * config.fee.amount) / 100;
  }
  
  return config.fee.amount;
}

function getPaymentMethodName(method: PaymentMethodOption | null | undefined): string {
  if (!method) return "Payment Method";
  return PAYMENT_METHODS.find((m) => m.id === method)?.name || "Payment Method";
}

function getPaymentMethodDescription(method: PaymentMethodOption | null | undefined): string {
  if (!method) return "Select a payment method";
  return PAYMENT_METHODS.find((m) => m.id === method)?.description || "";
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface CostLineItemProps {
  label: string;
  amount: number;
  percent?: number;
  currency: string;
  tooltip?: string;
  isHighlighted?: boolean;
  isNegative?: boolean;
  showTooltips?: boolean;
}

function CostLineItem({
  label,
  amount,
  percent,
  currency,
  tooltip,
  isHighlighted,
  isNegative,
  showTooltips = true,
}: CostLineItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 text-sm",
        isHighlighted && "font-medium"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("text-muted-foreground", isHighlighted && "text-foreground")}>
          {label}
        </span>
        {showTooltips && tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {percent !== undefined && percent > 0 && (
          <span className="text-xs text-muted-foreground/70">({percent.toFixed(1)}%)</span>
        )}
      </div>
      <span
        className={cn(
          "font-medium tabular-nums",
          isNegative && "text-success-600",
          isHighlighted && "text-foreground"
        )}
      >
        {isNegative && "-"}
        {formatCurrency(Math.abs(amount), currency)}
      </span>
    </div>
  );

  return content;
}

interface PaymentMethodIndicatorProps {
  method: PaymentMethodOption | null | undefined;
  fee: number;
  currency: string;
}

function PaymentMethodIndicator({ method, fee, currency }: PaymentMethodIndicatorProps) {
  const config = method ? PAYMENT_METHODS.find((m) => m.id === method) : null;
  
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {config?.icon || <Wallet className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{getPaymentMethodName(method)}</p>
          <p className="text-xs text-muted-foreground truncate">
            {getPaymentMethodDescription(method)}
          </p>
        </div>
      </div>
      {fee > 0 && (
        <div className="flex items-center justify-between text-sm pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Processing Fee</span>
          <span className="font-medium tabular-nums">{formatCurrency(fee, currency)}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * CostSummary - Sidebar component for displaying shipment cost breakdown
 *
 * Shows a detailed breakdown of shipping costs including:
 * - Base Rate
 * - Fuel Surcharge (with percentage)
 * - Insurance (with percentage)
 * - Special Handling
 * - Delivery Preferences
 * - Taxes (with percentage)
 * - Subtotal
 * - Payment Method Fee (dynamic based on selection)
 * - Total
 *
 * Updates dynamically when payment method changes.
 */
export function CostSummary({
  data,
  selectedPaymentMethod,
  className,
  isLoading = false,
  showTooltips = true,
}: CostSummaryProps) {
  // Calculate the actual payment method fee based on current selection
  const calculatedPaymentFee = React.useMemo(() => {
    return calculatePaymentMethodFee(selectedPaymentMethod, data.subtotal);
  }, [selectedPaymentMethod, data.subtotal]);

  // Recalculate total with the dynamic payment fee
  const calculatedTotal = React.useMemo(() => {
    return data.subtotal + calculatedPaymentFee + data.taxes;
  }, [data.subtotal, calculatedPaymentFee, data.taxes]);

  // Check if any optional fees are present
  const hasOptionalFees = 
    data.specialHandling > 0 || 
    data.deliveryPreferences > 0 || 
    data.insurance > 0;

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-8 bg-muted rounded w-full mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Costs */}
        <div className="space-y-1">
          <CostLineItem
            label="Base Rate"
            amount={data.baseRate}
            currency={data.currency}
            tooltip="Base shipping rate based on weight and dimensions"
            showTooltips={showTooltips}
          />
          
          {data.fuelSurcharge > 0 && (
            <CostLineItem
              label="Fuel Surcharge"
              amount={data.fuelSurcharge}
              percent={data.fuelSurchargePercent}
              currency={data.currency}
              tooltip="Variable fuel surcharge based on current fuel prices"
              showTooltips={showTooltips}
            />
          )}
        </div>

        {/* Optional Fees */}
        {hasOptionalFees && (
          <>
            <Separator />
            <div className="space-y-1">
              {data.insurance > 0 && (
                <CostLineItem
                  label="Insurance"
                  amount={data.insurance}
                  percent={data.insurancePercent}
                  currency={data.currency}
                  tooltip="Insurance coverage for declared value"
                  showTooltips={showTooltips}
                />
              )}
              
              {data.specialHandling > 0 && (
                <CostLineItem
                  label="Special Handling"
                  amount={data.specialHandling}
                  currency={data.currency}
                  tooltip="Additional fees for special handling requirements"
                  showTooltips={showTooltips}
                />
              )}
              
              {data.deliveryPreferences > 0 && (
                <CostLineItem
                  label="Delivery Preferences"
                  amount={data.deliveryPreferences}
                  currency={data.currency}
                  tooltip="Fees for Saturday/Sunday delivery or signature options"
                  showTooltips={showTooltips}
                />
              )}
            </div>
          </>
        )}

        {/* Subtotal */}
        <Separator />
        <CostLineItem
          label="Subtotal"
          amount={data.subtotal}
          currency={data.currency}
          isHighlighted
        />

        {/* Payment Method Section */}
        {selectedPaymentMethod && (
          <>
            <PaymentMethodIndicator
              method={selectedPaymentMethod}
              fee={calculatedPaymentFee}
              currency={data.currency}
            />
          </>
        )}

        {/* Taxes */}
        {data.taxes > 0 && (
          <CostLineItem
            label="Taxes"
            amount={data.taxes}
            percent={data.taxPercent}
            currency={data.currency}
            tooltip="Applicable taxes based on shipping origin/destination"
            showTooltips={showTooltips}
          />
        )}

        {/* Total */}
        <Separator />
        <div className="flex items-center justify-between py-2">
          <span className="text-sm sm:text-base font-semibold">Total</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums text-primary">
            {formatCurrency(calculatedTotal, data.currency)}
          </span>
        </div>

        {/* Payment Method Notice */}
        {!selectedPaymentMethod && (
          <div className="rounded-md bg-muted p-2.5 sm:p-3 text-xs sm:text-sm text-muted-foreground text-center">
            Select a payment method to see the final total
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// SKELETON COMPONENT
// ============================================

export function CostSummarySkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-px bg-muted my-3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-px bg-muted my-3" />
          <div className="h-8 bg-muted rounded w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook to calculate cost summary data from shipment and quote information
 */
export function useCostSummary(
  baseRate: number,
  fuelSurcharge: number,
  insurance: number,
  specialHandling: number,
  deliveryPreferences: number,
  taxes: number,
  paymentMethodFee: number,
  currency: string = "USD"
): CostSummaryData {
  return React.useMemo(() => {
    const fuelSurchargePercent = baseRate > 0 ? (fuelSurcharge / baseRate) * 100 : 0;
    const subtotalBeforeInsurance = baseRate + fuelSurcharge + specialHandling + deliveryPreferences;
    const insurancePercent = subtotalBeforeInsurance > 0 ? (insurance / subtotalBeforeInsurance) * 100 : 0;
    const subtotal = subtotalBeforeInsurance + insurance;
    const taxPercent = subtotal > 0 ? (taxes / subtotal) * 100 : 0;
    const total = subtotal + taxes + paymentMethodFee;

    return {
      baseRate,
      fuelSurcharge,
      fuelSurchargePercent,
      insurance,
      insurancePercent,
      specialHandling,
      deliveryPreferences,
      taxes,
      taxPercent,
      subtotal,
      paymentMethodFee,
      total,
      currency,
    };
  }, [
    baseRate,
    fuelSurcharge,
    insurance,
    specialHandling,
    deliveryPreferences,
    taxes,
    paymentMethodFee,
    currency,
  ]);
}

export default CostSummary;
