"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ShipmentDetailsFormData } from "@/lib/validation/shipment-details-schema";
import { specialHandlingConfigs, deliveryPreferenceConfigs } from "@/lib/data/shipment-presets";
import {
  Package,
  MapPin,
  Scale,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Truck,
  Shield,
} from "lucide-react";

export interface PackageSummaryProps {
  /** Current form data */
  data: ShipmentDetailsFormData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PackageSummary - Running totals and optimization tips
 *
 * Displays a summary of the current shipment configuration
 * with running totals and helpful optimization tips.
 */
export function PackageSummary({ data, className }: PackageSummaryProps) {
  // Calculate totals
  const totals = React.useMemo(() => {
    const packageCount = data.packages.length;
    const totalWeight = data.packages.reduce(
      (sum, pkg) => sum + (pkg.weight || 0),
      0
    );
    const totalValue = data.packages.reduce(
      (sum, pkg) => sum + (pkg.declaredValue || 0),
      0
    );

    // Calculate special handling fees
    const handlingFees = data.specialHandling
      .filter((h) => h.isSelected)
      .reduce((sum, h) => {
        const config = specialHandlingConfigs.find((c) => c.value === h.type);
        return sum + (config?.fee || 0);
      }, 0);

    // Calculate delivery preference fees
    const deliveryFees = Object.entries(data.deliveryPreferences).reduce(
      (sum, [key, value]) => {
        if (typeof value === "boolean" && value) {
          const config = deliveryPreferenceConfigs.find((c) => c.value === key);
          return sum + (config?.fee || 0);
        }
        return sum;
      },
      0
    );

    const estimatedFees = handlingFees + deliveryFees;

    return {
      packageCount,
      totalWeight,
      totalValue,
      handlingFees,
      deliveryFees,
      estimatedFees,
    };
  }, [data]);

  // Generate optimization tips
  const tips = React.useMemo(() => {
    const tips: { type: "info" | "warning" | "success"; message: string }[] =
      [];

    // Check for high value
    if (totals.totalValue > 5000) {
      tips.push({
        type: "info",
        message: "High-value shipment - consider additional insurance coverage",
      });
    }

    // Check for very heavy packages (150+ lbs) - suggest pallet
    const veryHeavyPackages = data.packages.filter((p) => (p.weight || 0) > 150);
    if (veryHeavyPackages.length > 0) {
      tips.push({
        type: "warning",
        message: `Package weight exceeds 150 lbs - switching to Pallet may reduce shipping costs`,
      });
    }

    // Check for heavy packages (50+ lbs)
    const heavyPackages = data.packages.filter((p) => {
      const weight = p.weight || 0;
      return weight > 50 && weight <= 150;
    });
    if (heavyPackages.length > 0) {
      tips.push({
        type: "info",
        message: `${heavyPackages.length} package(s) exceed 50 lbs - freight shipping may be more cost-effective`,
      });
    }

    // Check for multiple packages
    if (data.packages.length > 1) {
      tips.push({
        type: "success",
        message: `Multi-piece shipment - consolidated tracking available`,
      });
    }

    // Check for hazmat
    if (data.hazmat.isHazmat) {
      tips.push({
        type: "warning",
        message: "Hazmat shipment - ensure proper documentation and labeling",
      });
    }

    // Check for signature requirements
    const hasSignature = data.specialHandling.some(
      (h) => h.isSelected && (h.type === "signature_required" || h.type === "adult_signature")
    );
    if (!hasSignature && totals.totalValue > 500) {
      tips.push({
        type: "info",
        message: "Consider adding signature required for valuable items",
      });
    }

    return tips;
  }, [data, totals]);

  const currencySymbol = data.currency === "USD" ? "$" : data.currency === "CAD" ? "C$" : "Mex$";

  return (
    <Card className={cn("lg:sticky lg:top-4", className)}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          Shipment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Package Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Packages</span>
          </div>
          <span className="font-medium text-sm sm:text-base">{totals.packageCount}</span>
        </div>

        {/* Total Weight */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total Weight</span>
          </div>
          <span className="font-medium text-sm sm:text-base">
            {totals.totalWeight.toFixed(1)} lbs
          </span>
        </div>

        {/* Declared Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Declared Value</span>
          </div>
          <span className="font-medium text-sm sm:text-base">
            {currencySymbol}
            {totals.totalValue.toLocaleString()}
          </span>
        </div>

        {/* Estimated Fees */}
        {totals.estimatedFees > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Est. Extra Fees</span>
            </div>
            <span className="font-medium">
              +{currencySymbol}
              {totals.estimatedFees.toFixed(2)}
            </span>
          </div>
        )}

        {/* Special Handling Summary */}
        {data.specialHandling.some((h) => h.isSelected) && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Special Handling
            </p>
            <div className="flex flex-wrap gap-1">
              {data.specialHandling
                .filter((h) => h.isSelected)
                .map((h) => {
                  const config = specialHandlingConfigs.find(
                    (c) => c.value === h.type
                  );
                  return (
                    <Badge key={h.type} variant="secondary" className="text-xs">
                      {config?.label || h.type}
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}

        {/* Delivery Preferences Summary */}
        {Object.entries(data.deliveryPreferences).some(
          ([key, value]) => typeof value === "boolean" && value
        ) && (
          <div className="border-t pt-3">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Delivery Options
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.deliveryPreferences)
                .filter(([key, value]) => typeof value === "boolean" && value)
                .map(([key]) => {
                  const config = deliveryPreferenceConfigs.find(
                    (c) => c.value === key
                  );
                  return (
                    <Badge key={key} variant="outline" className="text-xs">
                      {config?.label || key}
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}

        {/* Hazmat Warning */}
        {data.hazmat.isHazmat && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 rounded-md bg-warning-50 p-2 text-warning-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Hazmat Shipment</span>
            </div>
          </div>
        )}

        {/* Optimization Tips */}
        {tips.length > 0 && (
          <div className="border-t pt-3">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Tips</p>
            </div>
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-md p-2 text-xs",
                    tip.type === "warning" && "bg-warning-50 text-warning-800",
                    tip.type === "info" && "bg-info-50 text-info-800",
                    tip.type === "success" && "bg-success-50 text-success-800"
                  )}
                >
                  {tip.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Preview */}
        {(data.origin.line1 || data.destination.line1) && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Route
            </p>
            <div className="space-y-2 text-xs">
              {data.origin.line1 && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium">From:</span>{" "}
                    {data.origin.city}, {data.origin.state}
                  </div>
                </div>
              )}
              {data.destination.line1 && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium">To:</span>{" "}
                    {data.destination.city}, {data.destination.state}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PackageSummary;
