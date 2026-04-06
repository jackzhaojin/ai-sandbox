"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  ArrowRight,
  Truck,
  Clock,
  Calendar,
  DollarSign,
  Package,
  Route,
} from "lucide-react";
import type { Address, Carrier, ServiceType } from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface ShipmentSummaryCardProps {
  /** Origin address */
  origin: Address;
  /** Destination address */
  destination: Address;
  /** Selected carrier */
  carrier: Carrier;
  /** Selected service type */
  serviceType: ServiceType;
  /** Total shipping cost */
  totalCost: number;
  /** Currency code */
  currency?: string;
  /** Pickup date (ISO string) */
  pickupDate: string;
  /** Pickup time window */
  pickupTimeWindow: {
    start: string;
    end: string;
    label: string;
  };
  /** Estimated delivery date (ISO string) */
  estimatedDelivery: string;
  /** Distance in miles/km */
  distance?: {
    value: number;
    unit: "mi" | "km";
  };
  /** Transit time in days */
  transitDays?: {
    min: number;
    max: number;
  };
  /** Additional CSS classes */
  className?: string;
}

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAddressShort(address: Address): string {
  const parts = [address.city, address.state, address.postal_code].filter(
    Boolean
  );
  return parts.join(", ");
}

function getTransitTimeLabel(minDays: number, maxDays: number): string {
  if (minDays === maxDays) {
    return `${minDays} business day${minDays !== 1 ? "s" : ""}`;
  }
  return `${minDays}-${maxDays} business days`;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface RouteVisualizationProps {
  origin: Address;
  destination: Address;
  distance?: ShipmentSummaryCardProps["distance"];
}

function RouteVisualization({
  origin,
  destination,
  distance,
}: RouteVisualizationProps) {
  return (
    <div className="relative">
      {/* Route Line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-border" />

      <div className="space-y-6">
        {/* Origin */}
        <div className="flex items-start gap-4">
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {origin.recipient_name || origin.city}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {formatAddressShort(origin)}
            </p>
          </div>
        </div>

        {/* Distance Badge (if available) */}
        {distance && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
              <Route className="h-3 w-3 text-muted-foreground" />
              <span>
                {distance.value} {distance.unit}
              </span>
            </div>
          </div>
        )}

        {/* Destination */}
        <div className="flex items-start gap-4">
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {destination.recipient_name || destination.city}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {formatAddressShort(destination)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ServiceInfoProps {
  carrier: Carrier;
  serviceType: ServiceType;
  transitDays?: ShipmentSummaryCardProps["transitDays"];
}

function ServiceInfo({ carrier, serviceType, transitDays }: ServiceInfoProps) {
  const transitLabel = transitDays
    ? getTransitTimeLabel(transitDays.min, transitDays.max)
    : serviceType.min_delivery_days && serviceType.max_delivery_days
    ? getTransitTimeLabel(
        serviceType.min_delivery_days,
        serviceType.max_delivery_days
      )
    : null;

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Truck className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{carrier.display_name}</span>
          <Badge variant="secondary" className="text-xs">
            {serviceType.display_name}
          </Badge>
        </div>
        {transitLabel && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5" />
            {transitLabel}
          </p>
        )}
      </div>
    </div>
  );
}

interface PickupInfoProps {
  pickupDate: string;
  pickupTimeWindow: ShipmentSummaryCardProps["pickupTimeWindow"];
}

function PickupInfo({ pickupDate, pickupTimeWindow }: PickupInfoProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/50">
        <Package className="h-5 w-5 text-secondary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDate(pickupDate)}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock className="h-3.5 w-3.5" />
          {pickupTimeWindow.label} ({pickupTimeWindow.start} -{" "}
          {pickupTimeWindow.end})
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * ShipmentSummaryCard - Always-visible summary card for Step 5 (Review)
 *
 * Displays:
 * - Route visualization (origin → destination with distance)
 * - Selected service (carrier + service name + transit time)
 * - Total cost (prominent display)
 * - Pickup date and time window
 * - Estimated delivery date
 */
export function ShipmentSummaryCard({
  origin,
  destination,
  carrier,
  serviceType,
  totalCost,
  currency = "USD",
  pickupDate,
  pickupTimeWindow,
  estimatedDelivery,
  distance,
  transitDays,
  className,
}: ShipmentSummaryCardProps) {
  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Shipment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Section */}
        <RouteVisualization
          origin={origin}
          destination={destination}
          distance={distance}
        />

        <Separator />

        {/* Service & Cost Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Service Info */}
          <ServiceInfo
            carrier={carrier}
            serviceType={serviceType}
            transitDays={transitDays}
          />

          {/* Total Cost - Prominent */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {formatCurrency(totalCost, currency)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Pickup & Delivery Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pickup Info */}
          <PickupInfo
            pickupDate={pickupDate}
            pickupTimeWindow={pickupTimeWindow}
          />

          {/* Delivery Estimate */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-50">
              <ArrowRight className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Delivery</p>
              <p className="font-medium">{formatDate(estimatedDelivery)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SKELETON COMPONENT
// ============================================

export function ShipmentSummaryCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="h-px bg-muted" />

        {/* Service & Cost Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
              <div className="h-8 bg-muted rounded w-28 animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ShipmentSummaryCard;
