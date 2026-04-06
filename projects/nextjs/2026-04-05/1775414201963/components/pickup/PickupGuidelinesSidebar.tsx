"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getServiceAreaZone,
  getServiceAreaConfig,
  calculatePickupFees,
  PickupFees,
} from "@/lib/pickup/availability";

// ============================================
// TYPES
// ============================================

export interface PickupGuidelinesSidebarProps {
  zipCode: string;
  selectedDate?: string;
  selectedTimeSlot?: string;
  serviceLevel?: "standard" | "premium" | "enterprise";
  className?: string;
}

interface GuidelineItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tooltip?: string;
}

interface FeeItem {
  label: string;
  amount: number;
  isPremium?: boolean;
  description?: string;
}

// ============================================
// CONSTANTS
// ============================================

const SAME_DAY_CUTOFF_HOUR = 14;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getSameDayCutoffTime(): string {
  const hour = SAME_DAY_CUTOFF_HOUR > 12 
    ? SAME_DAY_CUTOFF_HOUR - 12 
    : SAME_DAY_CUTOFF_HOUR;
  const ampm = SAME_DAY_CUTOFF_HOUR >= 12 ? "PM" : "AM";
  return `${hour}:00 ${ampm}`;
}

function isSameDayAvailable(): boolean {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(SAME_DAY_CUTOFF_HOUR, 0, 0, 0);
  return now < cutoff;
}

function getDaysUntilPickup(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(dateString + "T00:00:00");
  const diffTime = pickupDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PickupGuidelinesSidebar({
  zipCode,
  selectedDate,
  selectedTimeSlot,
  serviceLevel = "standard",
  className,
}: PickupGuidelinesSidebarProps) {
  const serviceArea = React.useMemo(() => {
    if (!zipCode || zipCode.length < 5) {
      return null;
    }
    const zone = getServiceAreaZone(zipCode);
    const config = getServiceAreaConfig(zone);
    return { zone, config };
  }, [zipCode]);

  const fees = React.useMemo<PickupFees | null>(() => {
    if (!selectedDate || !selectedTimeSlot) {
      return null;
    }
    return calculatePickupFees(selectedDate, selectedTimeSlot, zipCode, serviceLevel);
  }, [selectedDate, selectedTimeSlot, zipCode, serviceLevel]);

  const guidelines = React.useMemo<GuidelineItem[]>(() => {
    if (!serviceArea) return [];

    const { config, zone } = serviceArea;
    const items: GuidelineItem[] = [
      {
        id: "lead-time",
        icon: <Clock className="h-5 w-5" />,
        title: "Lead Time Required",
        description: `${config.minLeadTimeDays} business days minimum`,
        tooltip: "Pickup must be scheduled at least this many business days in advance",
      },
      {
        id: "same-day",
        icon: <Calendar className="h-5 w-5" />,
        title: "Same-Day Pickup",
        description: isSameDayAvailable()
          ? `Available until ${getSameDayCutoffTime()}`
          : `Cutoff passed (${getSameDayCutoffTime()})`,
        tooltip: "Orders placed after the cutoff time will be scheduled for the next business day",
      },
      {
        id: "service-area",
        icon: <MapPin className="h-5 w-5" />,
        title: "Service Area",
        description: config.description,
        tooltip: `Zone: ${zone.toUpperCase()}`,
      },
    ];

    if (config.weekendPickupAvailable) {
      items.push({
        id: "weekend",
        icon: <Calendar className="h-5 w-5" />,
        title: "Weekend Pickup",
        description: "Available (+ fee)",
        tooltip: `Weekend pickup available with ${formatCurrency(config.weekendFee)} surcharge`,
      });
    } else {
      items.push({
        id: "weekend",
        icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
        title: "Weekend Pickup",
        description: "Not available",
        tooltip: "Weekend pickup is not available in your service area",
      });
    }

    if (config.eveningPickupAvailable) {
      items.push({
        id: "evening",
        icon: <Clock className="h-5 w-5" />,
        title: "Evening Service",
        description: "Until 7:00 PM",
        tooltip: `Evening pickup available with ${formatCurrency(config.eveningFee)} surcharge`,
      });
    }

    return items;
  }, [serviceArea]);

  const feeItems = React.useMemo<FeeItem[]>(() => {
    if (!fees) return [];

    const items: FeeItem[] = [
      {
        label: "Base Pickup Fee",
        amount: 0,
        description: "Free with your shipment",
      },
    ];

    if (fees.weekendFee > 0) {
      items.push({
        label: "Weekend Premium",
        amount: fees.weekendFee,
        isPremium: true,
        description: "Saturday/Sunday pickup",
      });
    }

    if (fees.eveningFee > 0) {
      items.push({
        label: "Evening Premium",
        amount: fees.eveningFee,
        isPremium: true,
        description: "5:00 PM - 7:00 PM",
      });
    }

    if (fees.remoteAreaFee > 0) {
      items.push({
        label: "Remote Area Fee",
        amount: fees.remoteAreaFee,
        isPremium: true,
        description: "Extended service area",
      });
    }

    return items;
  }, [fees]);

  const selectedDateInfo = React.useMemo(() => {
    if (!selectedDate) return null;
    const daysUntil = getDaysUntilPickup(selectedDate);
    const date = new Date(selectedDate + "T00:00:00");
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const isWeekend = dayName === "Saturday" || dayName === "Sunday";

    return { daysUntil, dayName, isWeekend, date };
  }, [selectedDate]);

  const timeSlotLabel = React.useMemo(() => {
    switch (selectedTimeSlot) {
      case "morning":
        return "Morning (8:00 AM - 12:00 PM)";
      case "afternoon":
        return "Afternoon (12:00 PM - 5:00 PM)";
      case "evening":
        return "Evening (5:00 PM - 7:00 PM)";
      default:
        return null;
    }
  }, [selectedTimeSlot]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("space-y-4", className)}>
        {/* Service Area Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-primary" />
              Service Area Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!serviceArea ? (
              <div className="text-sm text-muted-foreground">
                Enter your ZIP code to see service area information.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Service Zone</span>
                  <Badge variant="secondary" className="capitalize">
                    {serviceArea.zone}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {guidelines.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px]">
                                <p>{item.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Time Slot Fees Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              Time Slot Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Morning (8AM-12PM)
                </span>
                <span className="font-medium text-success-600">Free</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Afternoon (12PM-5PM)
                </span>
                <span className="font-medium text-success-600">Free</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Evening (5PM-7PM)
                </span>
                <span className="font-medium">
                  {serviceArea ? formatCurrency(serviceArea.config.eveningFee) : "$25.00"}
                </span>
              </div>
            </div>

            {serviceArea?.config.weekendPickupAvailable && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Weekend Surcharge
                  </span>
                  <span className="font-medium">
                    +{formatCurrency(serviceArea.config.weekendFee)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Equipment Availability Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-primary" />
              Equipment Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceArea?.zone === "remote" ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Limited equipment available in remote areas. Standard dolly and pallet jack included.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>Standard Dolly (Free)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>Pallet Jack (Free)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>Liftgate Service (+$25)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>Two-Person Team (+$45)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>Forklift Service (+$35)</span>
                </div>
                {serviceArea?.config.eveningPickupAvailable && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Evening equipment available</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Pickup Summary Card */}
        {(selectedDateInfo || selectedTimeSlot) && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Selected Pickup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateInfo && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {selectedDateInfo.date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {selectedDateInfo.isWeekend && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Weekend
                      </Badge>
                    )}
                  </span>
                </div>
              )}

              {timeSlotLabel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time Window</span>
                  <span className="font-medium">{timeSlotLabel}</span>
                </div>
              )}

              {selectedDateInfo && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lead Time</span>
                  <span className={cn(
                    "font-medium",
                    selectedDateInfo.daysUntil < (serviceArea?.config.minLeadTimeDays || 3)
                      ? "text-warning-600"
                      : "text-success-600"
                  )}>
                    {selectedDateInfo.daysUntil} day{selectedDateInfo.daysUntil !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {feeItems.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    {feeItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className={cn(
                          "text-muted-foreground",
                          item.isPremium && "flex items-center gap-1"
                        )}>
                          {item.label}
                          {item.description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{item.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        <span className={cn(
                          "font-medium",
                          item.amount === 0 ? "text-success-600" : item.isPremium && "text-primary"
                        )}>
                          {item.amount === 0 ? "Free" : formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Estimated Pickup Fee</span>
                    <span className="text-primary">
                      {fees ? formatCurrency(fees.totalFee) : "Free"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 px-1">
          <p>* Fees shown are estimates. Final fees confirmed at booking.</p>
          <p>* Weekend and evening availability varies by service area.</p>
          <p>* Cancellation must be made 24 hours in advance.</p>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default PickupGuidelinesSidebar;
