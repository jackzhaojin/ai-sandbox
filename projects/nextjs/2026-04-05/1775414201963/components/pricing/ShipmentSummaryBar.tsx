"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Address } from "@/types/database";
import {
  MapPin,
  Package,
  ArrowRight,
  Edit3,
  AlertTriangle,
  Thermometer,
  Box,
  Shield,
  Clock,
  Scale,
  Ruler,
} from "lucide-react";

export interface PackageSummary {
  /** Package type */
  packageType: string;
  /** Number of packages */
  count: number;
  /** Total weight */
  weight: number;
  /** Weight unit */
  weightUnit: string;
  /** Dimensions */
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
}

export interface SpecialHandlingItem {
  /** Handling type code */
  type: string;
  /** Display label */
  label: string;
  /** Icon for the handling type */
  icon?: React.ReactNode;
}

export interface ShipmentSummaryBarProps {
  /** Origin address */
  origin: Address;
  /** Destination address */
  destination: Address;
  /** Package summary */
  packages: PackageSummary;
  /** Special handling items */
  specialHandling?: SpecialHandlingItem[];
  /** Declared value */
  declaredValue?: {
    amount: number;
    currency: string;
  };
  /** Callback when Edit button is clicked */
  onEdit?: () => void;
  /** Edit button href (if using Next.js Link) */
  editHref?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the sticky bar at bottom */
  sticky?: boolean;
}

/**
 * ShipmentSummaryBar - Displays shipment summary with route, packages, and special handling
 *
 * Features:
 * - Shows origin and destination addresses with visual route indicator
 * - Displays package summary (type, count, weight, dimensions)
 * - Lists special handling requirements
 * - Edit button to navigate back to Step 1
 * - Can be sticky at the bottom of the viewport
 */
export function ShipmentSummaryBar({
  origin,
  destination,
  packages,
  specialHandling = [],
  declaredValue,
  onEdit,
  editHref,
  className,
  sticky = false,
}: ShipmentSummaryBarProps) {
  // Format address for display
  const formatAddress = (address: Address) => {
    const cityState = [address.city, address.state_code].filter(Boolean).join(", ");
    const location = [cityState, address.postal_code, address.country_code]
      .filter(Boolean)
      .join(" ");
    return {
      name: address.contact_name || address.company_name || "Unknown",
      location,
      fullAddress: [address.street_address1, address.street_address2]
        .filter(Boolean)
        .join(", "),
    };
  };

  const originFormatted = formatAddress(origin);
  const destinationFormatted = formatAddress(destination);

  // Get special handling icon
  const getHandlingIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("hazmat") || lowerType.includes("dangerous")) {
      return <AlertTriangle className="h-3.5 w-3.5" />;
    }
    if (lowerType.includes("temp") || lowerType.includes("cold")) {
      return <Thermometer className="h-3.5 w-3.5" />;
    }
    if (lowerType.includes("fragile") || lowerType.includes("glass")) {
      return <Box className="h-3.5 w-3.5" />;
    }
    if (lowerType.includes("insurance") || lowerType.includes("declared")) {
      return <Shield className="h-3.5 w-3.5" />;
    }
    if (lowerType.includes("expedite") || lowerType.includes("rush")) {
      return <Clock className="h-3.5 w-3.5" />;
    }
    return <AlertTriangle className="h-3.5 w-3.5" />;
  };

  const content = (
    <Card
      className={cn(
        "border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        sticky && "shadow-lg",
        className
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Route Section */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                {/* Origin */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm sm:text-base">{originFormatted.location}</p>
                  <p className="truncate text-xs text-muted-foreground hidden sm:block">
                    {originFormatted.name}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center sm:justify-center py-0.5 sm:py-0">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground sm:mx-2 rotate-90 sm:rotate-0" />
                </div>

                {/* Destination */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm sm:text-base">{destinationFormatted.location}</p>
                  <p className="truncate text-xs text-muted-foreground hidden sm:block">
                    {destinationFormatted.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Summary - Border on desktop, separator line on mobile */}
          <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t sm:pt-0 sm:border-t-0 lg:border-l lg:border-border lg:pl-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/50">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base truncate">
                {packages.count > 1 ? `${packages.count} Packages` : packages.packageType}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {packages.weight.toFixed(1)} {packages.weightUnit}
                </span>
                {packages.dimensions && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">
                      {packages.dimensions.length}×{packages.dimensions.width}×{packages.dimensions.height} {packages.dimensions.unit}
                    </span>
                    <span className="sm:hidden">
                      {packages.dimensions.length}×{packages.dimensions.width}×{packages.dimensions.height}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Special Handling - Collapsible on mobile if many items */}
          {specialHandling.length > 0 && (
            <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t sm:pt-0 sm:border-t-0 lg:border-l lg:border-border lg:pl-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-warning-50">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning-600" />
              </div>
              <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                {specialHandling.slice(0, 2).map((handling, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 text-[10px] sm:text-xs font-normal py-0.5 px-1.5"
                  >
                    <span className="shrink-0">{handling.icon || getHandlingIcon(handling.type)}</span>
                    <span className="truncate">{handling.label}</span>
                  </Badge>
                ))}
                {specialHandling.length > 2 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-normal">
                    +{specialHandling.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Declared Value - Hidden on smallest screens */}
          {declaredValue && declaredValue.amount > 0 && (
            <div className="hidden sm:flex items-start gap-3 pt-2 border-t sm:pt-0 sm:border-t-0 lg:border-l lg:border-border lg:pl-4">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-success-50">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Declared Value</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: declaredValue.currency,
                  }).format(declaredValue.amount)}
                </p>
              </div>
            </div>
          )}

          {/* Edit Button */}
          <div className="flex items-center justify-end pt-2 border-t sm:pt-0 sm:border-t-0 sm:justify-start lg:border-l lg:border-border lg:pl-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              asChild={!!editHref}
              className="gap-2 h-9 sm:h-10"
            >
              {editHref ? (
                <a href={editHref}>
                  <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </a>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (sticky) {
    return (
      <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-background/80 p-4 backdrop-blur">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * ShipmentSummaryBarSkeleton - Loading state for ShipmentSummaryBar
 */
export function ShipmentSummaryBarSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Route Skeleton */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Package Skeleton */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Edit Button Skeleton */}
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ShipmentSummaryBar;
