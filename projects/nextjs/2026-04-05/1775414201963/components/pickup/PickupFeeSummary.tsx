"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  MapPin,
  Package,
  Hand,
  Shield,
  Info,
  Calculator,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getServiceAreaZone,
  getServiceAreaConfig,
  calculatePickupFees,
  PickupFees,
} from "@/lib/pickup/availability";

// ============================================
// TYPES
// ============================================

export type LoadingAssistanceType = "customer" | "driver_assist" | "full_service";
export type EquipmentType = 
  | "standard_dolly" 
  | "two_person_team" 
  | "pallet_jack" 
  | "forklift" 
  | "liftgate" 
  | "inside_pickup" 
  | "pallet_shrink_wrap";

export interface EquipmentFee {
  type: EquipmentType;
  label: string;
  fee: number;
  quantity?: number;
}

export interface AccessRequirementFee {
  type: string;
  label: string;
  fee: number;
}

export interface PickupFeeSummaryProps {
  /** ZIP code for location-based fees */
  zipCode: string;
  /** Selected date (YYYY-MM-DD) */
  selectedDate?: string;
  /** Selected time slot */
  selectedTimeSlot?: "morning" | "afternoon" | "evening";
  /** Selected equipment with fees */
  selectedEquipment?: EquipmentFee[];
  /** Loading assistance type */
  loadingAssistance?: LoadingAssistanceType;
  /** Access requirements with fees */
  accessRequirements?: AccessRequirementFee[];
  /** Service level */
  serviceLevel?: "standard" | "premium" | "enterprise";
  /** Whether to show the compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when fees change */
  onFeesChange?: (fees: PickupFeeBreakdown) => void;
}

export interface PickupFeeBreakdown {
  timeSlotFee: number;
  locationSurcharge: number;
  equipmentFees: number;
  loadingAssistanceFee: number;
  accessRequirementsFee: number;
  weekendPremium: number;
  eveningPremium: number;
  remoteAreaFee: number;
  subtotal: number;
  total: number;
  itemCount: number;
}

interface FeeLineItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  amount: number;
  description?: string;
  tooltip?: string;
  isPremium?: boolean;
  quantity?: number;
}

// ============================================
// CONSTANTS
// ============================================

const LOADING_ASSISTANCE_FEES: Record<LoadingAssistanceType, { label: string; fee: number }> = {
  customer: { label: "Customer Loading", fee: 0 },
  driver_assist: { label: "Driver Assistance", fee: 25 },
  full_service: { label: "Full Service Loading", fee: 65 },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function isWeekend(dateString: string): boolean {
  const date = new Date(dateString + "T00:00:00");
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PickupFeeSummary({
  zipCode,
  selectedDate,
  selectedTimeSlot,
  selectedEquipment = [],
  loadingAssistance = "customer",
  accessRequirements = [],
  serviceLevel = "standard",
  compact = false,
  className,
  onFeesChange,
}: PickupFeeSummaryProps) {
  // Get service area information
  const serviceArea = React.useMemo(() => {
    if (!zipCode || zipCode.length < 5) return null;
    const zone = getServiceAreaZone(zipCode);
    const config = getServiceAreaConfig(zone);
    return { zone, config };
  }, [zipCode]);

  // Calculate base pickup fees
  const baseFees = React.useMemo<PickupFees | null>(() => {
    if (!selectedDate || !selectedTimeSlot) return null;
    return calculatePickupFees(selectedDate, selectedTimeSlot, zipCode, serviceLevel);
  }, [selectedDate, selectedTimeSlot, zipCode, serviceLevel]);

  // Calculate complete fee breakdown
  const feeBreakdown = React.useMemo<PickupFeeBreakdown>(() => {
    const timeSlotFee = baseFees?.baseFee || 0;
    const weekendPremium = baseFees?.weekendFee || 0;
    const eveningPremium = baseFees?.eveningFee || 0;
    const remoteAreaFee = baseFees?.remoteAreaFee || 0;
    
    // Calculate equipment fees
    const equipmentFees = selectedEquipment.reduce(
      (sum, item) => sum + item.fee * (item.quantity || 1),
      0
    );

    // Calculate loading assistance fee
    const loadingAssistanceFee = LOADING_ASSISTANCE_FEES[loadingAssistance]?.fee || 0;

    // Calculate access requirements fee
    const accessRequirementsFee = accessRequirements.reduce(
      (sum, item) => sum + item.fee,
      0
    );

    // Location surcharge includes weekend, evening, and remote area fees
    const locationSurcharge = weekendPremium + eveningPremium + remoteAreaFee;

    // Calculate totals
    const subtotal = timeSlotFee + locationSurcharge + equipmentFees + loadingAssistanceFee + accessRequirementsFee;
    const total = subtotal;

    // Count items
    const itemCount = selectedEquipment.length + accessRequirements.length + 
      (loadingAssistance !== "customer" ? 1 : 0);

    return {
      timeSlotFee,
      locationSurcharge,
      equipmentFees,
      loadingAssistanceFee,
      accessRequirementsFee,
      weekendPremium,
      eveningPremium,
      remoteAreaFee,
      subtotal,
      total,
      itemCount,
    };
  }, [baseFees, selectedEquipment, loadingAssistance, accessRequirements]);

  // Notify parent of fee changes
  React.useEffect(() => {
    onFeesChange?.(feeBreakdown);
  }, [feeBreakdown, onFeesChange]);

  // Build line items for display
  const lineItems = React.useMemo<FeeLineItem[]>(() => {
    const items: FeeLineItem[] = [];

    // Time slot fee (always included)
    if (feeBreakdown.timeSlotFee > 0 || selectedTimeSlot === "evening") {
      items.push({
        id: "time-slot",
        icon: <Clock className="h-4 w-4" />,
        label: "Time Slot Fee",
        amount: feeBreakdown.timeSlotFee,
        description: selectedTimeSlot === "evening" ? "Evening pickup" : undefined,
        isPremium: selectedTimeSlot === "evening",
      });
    }

    // Weekend premium
    if (feeBreakdown.weekendPremium > 0) {
      items.push({
        id: "weekend",
        icon: <Clock className="h-4 w-4" />,
        label: "Weekend Premium",
        amount: feeBreakdown.weekendPremium,
        description: selectedDate && isWeekend(selectedDate) ? "Saturday/Sunday service" : undefined,
        isPremium: true,
      });
    }

    // Remote area fee
    if (feeBreakdown.remoteAreaFee > 0) {
      items.push({
        id: "remote",
        icon: <MapPin className="h-4 w-4" />,
        label: "Remote Area Fee",
        amount: feeBreakdown.remoteAreaFee,
        description: "Extended service area",
        isPremium: true,
      });
    }

    // Equipment fees
    if (feeBreakdown.equipmentFees > 0) {
      selectedEquipment.forEach((equipment, index) => {
        if (equipment.fee > 0) {
          items.push({
            id: `equipment-${index}`,
            icon: <Package className="h-4 w-4" />,
            label: equipment.label,
            amount: equipment.fee * (equipment.quantity || 1),
            quantity: equipment.quantity,
            isPremium: true,
          });
        }
      });
    }

    // Loading assistance fee
    if (feeBreakdown.loadingAssistanceFee > 0) {
      const loadingLabel = LOADING_ASSISTANCE_FEES[loadingAssistance]?.label;
      items.push({
        id: "loading",
        icon: <Hand className="h-4 w-4" />,
        label: loadingLabel || "Loading Assistance",
        amount: feeBreakdown.loadingAssistanceFee,
        isPremium: true,
      });
    }

    // Access requirements fees
    if (feeBreakdown.accessRequirementsFee > 0) {
      accessRequirements.forEach((req, index) => {
        if (req.fee > 0) {
          items.push({
            id: `access-${index}`,
            icon: <Shield className="h-4 w-4" />,
            label: req.label,
            amount: req.fee,
            isPremium: true,
          });
        }
      });
    }

    return items;
  }, [feeBreakdown, selectedEquipment, loadingAssistance, accessRequirements, selectedDate, selectedTimeSlot]);

  // Check if all required selections are made
  const isComplete = selectedDate && selectedTimeSlot;

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Card className={cn("border-l-4 border-l-primary", className)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-medium">Pickup Fee</span>
              </div>
              <span className="text-lg font-bold">
                {isComplete ? formatCurrency(feeBreakdown.total) : "—"}
              </span>
            </div>
            {isComplete && lineItems.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {lineItems.length} fee{lineItems.length !== 1 ? "s" : ""} applied
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Pickup Fee Summary
          </CardTitle>
          <CardDescription>
            Complete breakdown of your pickup fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isComplete ? (
            <Alert variant="default" className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a date and time slot to see pickup fees
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Base Pickup Fee (always free) */}
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  Base Pickup Fee
                </span>
                <span className="text-sm font-medium text-success-600">Free</span>
              </div>

              {lineItems.length > 0 && (
                <>
                  <Separator />
                  
                  {/* Line Items */}
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-muted-foreground",
                            item.isPremium && "text-primary"
                          )}>
                            {item.icon}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-sm",
                              item.isPremium && "text-primary"
                            )}>
                              {item.label}
                            </span>
                            {item.quantity && item.quantity > 1 && (
                              <Badge variant="outline" className="text-xs">
                                x{item.quantity}
                              </Badge>
                            )}
                            {item.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground focus:outline-none"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>{item.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          item.isPremium ? "text-primary" : "text-foreground"
                        )}>
                          {item.amount === 0 ? "Free" : `+${formatCurrency(item.amount)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {/* Subtotal */}
              {lineItems.length > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(feeBreakdown.subtotal)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">Total Pickup Fee</span>
                  {feeBreakdown.itemCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {feeBreakdown.itemCount} item{feeBreakdown.itemCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xl font-bold",
                  feeBreakdown.total === 0 ? "text-success-600" : "text-primary"
                )}>
                  {formatCurrency(feeBreakdown.total)}
                </span>
              </div>

              {/* Service Level Badge */}
              {serviceLevel !== "standard" && (
                <div className="pt-2">
                  <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      {serviceLevel === "premium" 
                        ? "Premium service: 50% discount on pickup fees applied"
                        : "Enterprise service: Custom rates apply"
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Service Area Info */}
              {serviceArea && (
                <div className="pt-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>Service Area: {serviceArea.config.description}</span>
                  </div>
                  {serviceArea.zone === "remote" && (
                    <div className="flex items-start gap-1.5 text-warning-600">
                      <AlertCircle className="h-3 w-3 mt-0.5" />
                      <span>Remote area: Extended lead times and additional fees apply</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default PickupFeeSummary;
