"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaymentMethodType } from "@/types/database";
import {
  FileText,
  Truck,
  Users,
  Clock,
  Building2,
  Star,
  Check,
} from "lucide-react";

export type PaymentMethodOption =
  | "purchase_order"
  | "bill_of_lading"
  | "third_party_billing"
  | "net_terms"
  | "corporate_account";

export interface PaymentMethodConfig {
  id: PaymentMethodOption;
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ReactNode;
  fee: {
    amount: number;
    type: "flat" | "percentage";
  } | null;
  isPopular?: boolean;
  badge?: string;
}

export interface PaymentMethodSelectorProps {
  /** Currently selected payment method */
  value?: PaymentMethodOption;
  /** Callback when selection changes */
  onChange?: (value: PaymentMethodOption) => void;
  /** Total shipment amount (for validation/fee calculation) */
  shipmentTotal?: number;
  /** Currency code */
  currency?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Available payment methods (defaults to all) */
  availableMethods?: PaymentMethodOption[];
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "purchase_order",
    type: "purchase_order",
    name: "Purchase Order",
    description: "Pay using your company purchase order number",
    icon: <FileText className="h-5 w-5" />,
    fee: null,
    isPopular: true,
  },
  {
    id: "bill_of_lading",
    type: "billing_account",
    name: "Bill of Lading",
    description: "Charge to your carrier account with BOL number",
    icon: <Truck className="h-5 w-5" />,
    fee: { amount: 2.5, type: "flat" },
  },
  {
    id: "third_party_billing",
    type: "third_party",
    name: "Third-Party Billing",
    description: "Bill to another company's account",
    icon: <Users className="h-5 w-5" />,
    fee: { amount: 5.0, type: "flat" },
  },
  {
    id: "net_terms",
    type: "net_terms",
    name: "Net Terms",
    description: "Pay within 15, 30, or 60 days",
    icon: <Clock className="h-5 w-5" />,
    fee: null,
  },
  {
    id: "corporate_account",
    type: "corporate_account",
    name: "Corporate Account",
    description: "Charge to your corporate shipping account",
    icon: <Building2 className="h-5 w-5" />,
    fee: null,
  },
];

function formatFee(
  fee: { amount: number; type: "flat" | "percentage" } | null,
  currency: string = "USD"
): string {
  if (!fee) return "No fee";
  if (fee.type === "flat") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(fee.amount);
  }
  return `${fee.amount}%`;
}

/**
 * PaymentMethodSelector - Selectable payment method cards
 *
 * Displays 5 payment method options as selectable cards with icons,
 * descriptions, and fee indicators. Supports radio selection behavior
 * and reveals method-specific forms when selected.
 */
export function PaymentMethodSelector({
  value,
  onChange,
  shipmentTotal = 0,
  currency = "USD",
  className,
  disabled = false,
  availableMethods,
}: PaymentMethodSelectorProps) {
  const methods = React.useMemo(() => {
    if (!availableMethods) return DEFAULT_PAYMENT_METHODS;
    return DEFAULT_PAYMENT_METHODS.filter((m) =>
      availableMethods.includes(m.id)
    );
  }, [availableMethods]);

  const handleValueChange = (newValue: string) => {
    onChange?.(newValue as PaymentMethodOption);
  };

  return (
    <RadioGroup
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
      className={cn("grid gap-4", className)}
    >
      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          selected={value === method.id}
          currency={currency}
          disabled={disabled}
        />
      ))}
    </RadioGroup>
  );
}

interface PaymentMethodCardProps {
  method: PaymentMethodConfig;
  selected: boolean;
  currency: string;
  disabled?: boolean;
}

function PaymentMethodCard({
  method,
  selected,
  currency,
  disabled,
}: PaymentMethodCardProps) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        selected && "ring-2 ring-primary border-primary shadow-lg bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed hover:shadow-none"
      )}
    >
      <RadioGroupItem
        value={method.id}
        id={`payment-${method.id}`}
        className="sr-only"
        disabled={disabled}
      />
      <Label
        htmlFor={`payment-${method.id}`}
        className="cursor-pointer block"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            {/* Icon Container */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {method.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{method.name}</h3>
                {method.isPopular && (
                  <Badge
                    variant="default"
                    className="h-5 px-1.5 text-xs bg-warning-500 hover:bg-warning-500"
                  >
                    <Star className="h-3 w-3 mr-0.5 fill-current" />
                    Most Popular
                  </Badge>
                )}
                {selected && (
                  <Badge variant="default" className="h-5 px-1.5 text-xs">
                    <Check className="h-3 w-3 mr-0.5" />
                    Selected
                  </Badge>
                )}
              </div>

              <p className="mt-0.5 text-sm text-muted-foreground">
                {method.description}
              </p>

              {/* Fee Indicator */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    method.fee ? "text-muted-foreground" : "text-success-600"
                  )}
                >
                  {method.fee ? (
                    <>
                      Fee: {formatFee(method.fee, currency)}
                      {method.fee.type === "percentage" && " of total"}
                    </>
                  ) : (
                    "No additional fee"
                  )}
                </span>
              </div>
            </div>

            {/* Radio Indicator */}
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {selected && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </Label>
    </Card>
  );
}

export default PaymentMethodSelector;
