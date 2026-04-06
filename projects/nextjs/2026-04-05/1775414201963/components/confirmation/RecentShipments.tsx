"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Eye,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ShipmentStatus = 
  | "pending"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "cancelled";

export interface RecentShipment {
  /** Shipment confirmation number */
  confirmationNumber: string;
  /** Shipment date */
  date: string;
  /** Origin address (short form) */
  origin: string;
  /** Destination address (short form) */
  destination: string;
  /** Current status */
  status: ShipmentStatus;
  /** Carrier name */
  carrier: string;
  /** Service type */
  service: string;
  /** URL to view shipment details */
  viewUrl?: string;
  /** Tracking number if available */
  trackingNumber?: string;
  /** Estimated or actual delivery date */
  deliveryDate?: string;
}

export interface RecentShipmentsProps {
  /** List of recent shipments (typically last 3) */
  shipments: RecentShipment[];
  /** Maximum number of shipments to display */
  maxShipments?: number;
  /** Title of the component */
  title?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a shipment is clicked to view */
  onViewShipment?: (confirmationNumber: string) => void;
  /** Callback when Repeat Shipment is clicked */
  onRepeatShipment?: (confirmationNumber: string) => void;
  /** Callback when View All Shipments is clicked */
  onViewAll?: () => void;
  /** URL to view all shipments */
  viewAllUrl?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStatusConfig(status: ShipmentStatus): {
  label: string;
  icon: React.ReactNode;
  badgeVariant: string;
  colorClass: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        icon: <Clock className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-warning-50 text-warning-600 border-warning-200",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        icon: <CheckCircle2 className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-success-50 text-success-600 border-success-200",
      };
    case "picked_up":
      return {
        label: "Picked Up",
        icon: <Package className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-info-50 text-info-600 border-info-200",
      };
    case "in_transit":
      return {
        label: "In Transit",
        icon: <Truck className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-info-50 text-info-600 border-info-200",
      };
    case "out_for_delivery":
      return {
        label: "Out for Delivery",
        icon: <Truck className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-primary-50 text-primary-600 border-primary-200",
      };
    case "delivered":
      return {
        label: "Delivered",
        icon: <CheckCircle2 className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-success-50 text-success-600 border-success-200",
      };
    case "exception":
      return {
        label: "Exception",
        icon: <AlertCircle className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-destructive-50 text-destructive-600 border-destructive-200",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: <AlertCircle className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-gray-50 text-gray-500 border-gray-200",
      };
    default:
      return {
        label: "Unknown",
        icon: <AlertCircle className="h-4 w-4" />,
        badgeVariant: "outline",
        colorClass: "bg-gray-50 text-gray-500 border-gray-200",
      };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ShipmentCardProps {
  shipment: RecentShipment;
  onView?: (confirmationNumber: string) => void;
  onRepeat?: (confirmationNumber: string) => void;
}

function ShipmentCard({ shipment, onView, onRepeat }: ShipmentCardProps) {
  const statusConfig = getStatusConfig(shipment.status);

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-all",
        "hover:border-primary/50 hover:shadow-sm cursor-pointer",
        "bg-background"
      )}
      onClick={() => onView?.(shipment.confirmationNumber)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium">
              {shipment.confirmationNumber}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(shipment.date)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn(statusConfig.colorClass)}>
          {statusConfig.icon}
          <span className="ml-1">{statusConfig.label}</span>
        </Badge>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{shipment.origin}</p>
          <p className="text-xs text-muted-foreground">Origin</p>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium truncate">{shipment.destination}</p>
          <p className="text-xs text-muted-foreground">Destination</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          <span>{shipment.carrier}</span>
        </div>
        <span>{shipment.service}</span>
      </div>

      {/* Delivery Info */}
      {shipment.deliveryDate && (
        <div className="flex items-center gap-1 text-xs mb-3 p-2 bg-muted/50 rounded">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {shipment.status === "delivered" ? "Delivered:" : "Est. Delivery:"}
          </span>
          <span className="font-medium">
            {new Date(shipment.deliveryDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onView?.(shipment.confirmationNumber);
          }}
          asChild={!!shipment.viewUrl}
        >
          {shipment.viewUrl ? (
            <a href={shipment.viewUrl}>
              <Eye className="h-4 w-4" />
              View
            </a>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              View
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onRepeat?.(shipment.confirmationNumber);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Repeat
        </Button>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onScheduleNew?: () => void;
}

function EmptyState({ onScheduleNew }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-muted-foreground mb-1">No Recent Shipments</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Your recent shipment history will appear here.
      </p>
      {onScheduleNew && (
        <Button size="sm" onClick={onScheduleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Shipment
        </Button>
      )}
    </div>
  );
}



// ============================================
// MAIN COMPONENT
// ============================================

/**
 * RecentShipments - Displays a list of recent completed shipments
 *
 * Features:
 * - Shows last 3 completed shipments by default
 * - Displays confirmation number, date, route (origin → destination), and status
 * - Click to view shipment details
 * - Quick repeat shipment action
 * - Status badges with appropriate colors
 * - Empty state when no shipments
 *
 * @example
 * <RecentShipments
 *   shipments={recentShipments}
 *   onViewShipment={(id) => router.push(`/shipments/${id}`)}
 *   onRepeatShipment={(id) => duplicateShipment(id)}
 * />
 */
export function RecentShipments({
  shipments,
  maxShipments = 3,
  title = "Recent Shipments",
  className,
  onViewShipment,
  onRepeatShipment,
  onViewAll,
  viewAllUrl,
}: RecentShipmentsProps) {
  // Limit shipments to max
  const displayShipments = shipments.slice(0, maxShipments);
  const hasMore = shipments.length > maxShipments;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {(viewAllUrl || onViewAll) && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={onViewAll}
              asChild={!!viewAllUrl}
            >
              {viewAllUrl ? (
                <a href={viewAllUrl}>
                  View All
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : (
                <>
                  View All
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayShipments.length === 0 ? (
          <EmptyState onScheduleNew={onViewAll} />
        ) : (
          <div className="space-y-3">
            {displayShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.confirmationNumber}
                shipment={shipment}
                onView={onViewShipment}
                onRepeat={onRepeatShipment}
              />
            ))}
            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={onViewAll}
                  asChild={!!viewAllUrl}
                >
                  {viewAllUrl ? (
                    <a href={viewAllUrl}>
                      View {shipments.length - maxShipments} more shipment
                      {shipments.length - maxShipments > 1 ? "s" : ""}
                      <ExternalLink className="h-3 w-3 ml-1 inline" />
                    </a>
                  ) : (
                    <>
                      View {shipments.length - maxShipments} more shipment
                      {shipments.length - maxShipments > 1 ? "s" : ""}
                      <ChevronRight className="h-3 w-3 ml-1 inline" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentShipments;
