"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationSection, type KeyValuePair } from "./ConfirmationSection";
import {
  Package,
  FileText,
  Building2,
  Truck,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  MessageSquare,
  Bell,
  QrCode,
} from "lucide-react";

// ============================================
// SHIPMENT REFERENCE SECTION
// ============================================

export interface ShipmentReferenceSectionProps {
  confirmationNumber: string;
  customerReference?: string;
  carrier: string;
  service: string;
  totalCost: number;
  currency?: string;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * ShipmentReferenceSection - Displays shipment reference information
 */
export function ShipmentReferenceSection({
  confirmationNumber,
  customerReference,
  carrier,
  service,
  totalCost,
  currency = "USD",
  defaultExpanded = true,
  className,
}: ShipmentReferenceSectionProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const data: KeyValuePair[] = [
    {
      key: "Confirmation Number",
      value: (
        <div className="flex items-center gap-2">
          <code className="font-mono bg-muted px-2 py-0.5 rounded">
            {confirmationNumber}
          </code>
          <CopyButton
            text={confirmationNumber}
            variant="ghost"
            size="icon"
            ariaLabel="Copy confirmation number"
          />
        </div>
      ),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "Carrier",
      value: carrier,
      icon: <Truck className="h-4 w-4" />,
    },
    {
      key: "Service",
      value: service,
      icon: <Package className="h-4 w-4" />,
    },
    {
      key: "Total Cost",
      value: (
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totalCost)}
        </span>
      ),
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];

  if (customerReference) {
    data.splice(1, 0, {
      key: "Customer Reference",
      value: customerReference,
      icon: <Building2 className="h-4 w-4" />,
    });
  }

  return (
    <ConfirmationSection
      id="shipment-reference"
      title="Shipment Reference"
      icon={<Package className="h-5 w-5" />}
      status="confirmed"
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    />
  );
}

// ============================================
// PICKUP CONFIRMATION SECTION
// ============================================

export type PickupStatus = "confirmed" | "driver_assigned" | "in_transit" | "completed";

export interface PickupConfirmationSectionProps {
  pickupDate: string;
  timeWindow: {
    start: string;
    end: string;
  };
  status: PickupStatus;
  locationType?: string;
  dockNumber?: string;
  specialInstructions?: string;
  defaultExpanded?: boolean;
  className?: string;
}

function getPickupStatusLabel(status: PickupStatus): string {
  switch (status) {
    case "confirmed":
      return "Pickup Confirmed";
    case "driver_assigned":
      return "Driver Assigned";
    case "in_transit":
      return "Driver In Transit";
    case "completed":
      return "Pickup Completed";
    default:
      return "Confirmed";
  }
}

function getPickupStatusBadge(status: PickupStatus) {
  switch (status) {
    case "confirmed":
      return (
        <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "driver_assigned":
      return (
        <Badge variant="outline" className="bg-info-50 text-info-600 border-info-200">
          <User className="h-3 w-3 mr-1" />
          Driver Assigned
        </Badge>
      );
    case "in_transit":
      return (
        <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200">
          <Truck className="h-3 w-3 mr-1" />
          In Transit
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
  }
}

/**
 * PickupConfirmationSection - Displays pickup confirmation details
 */
export function PickupConfirmationSection({
  pickupDate,
  timeWindow,
  status,
  locationType,
  dockNumber,
  specialInstructions,
  defaultExpanded = true,
  className,
}: PickupConfirmationSectionProps) {
  const data: KeyValuePair[] = [
    {
      key: "Pickup Date",
      value: new Date(pickupDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "Time Window",
      value: `${timeWindow.start} - ${timeWindow.end}`,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      key: "Status",
      value: getPickupStatusBadge(status),
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ];

  if (locationType) {
    data.push({
      key: "Location Type",
      value: locationType,
      icon: <Building2 className="h-4 w-4" />,
    });
  }

  if (dockNumber) {
    data.push({
      key: "Dock/Loading Bay",
      value: dockNumber,
      icon: <MapPin className="h-4 w-4" />,
    });
  }

  if (specialInstructions) {
    data.push({
      key: "Special Instructions",
      value: specialInstructions,
      icon: <Info className="h-4 w-4" />,
    });
  }

  return (
    <ConfirmationSection
      id="pickup-confirmation"
      title="Pickup Confirmation"
      icon={<Truck className="h-5 w-5" />}
      status="confirmed"
      statusLabel={getPickupStatusLabel(status)}
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    >
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-info-500" />
          What to Expect
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Driver will arrive within the scheduled time window</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>You&apos;ll receive a notification when the driver is 30 minutes away</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Please have your package ready and confirmation number available</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Digital Bill of Lading will be signed at pickup</span>
          </li>
        </ul>
      </div>
    </ConfirmationSection>
  );
}

// ============================================
// DELIVERY INFORMATION SECTION
// ============================================

export interface DeliveryInformationSectionProps {
  estimatedDelivery: string;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  deliveryInstructions?: string;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * DeliveryInformationSection - Displays delivery information
 */
export function DeliveryInformationSection({
  estimatedDelivery,
  deliveryAddress,
  contactName,
  contactPhone,
  contactEmail,
  deliveryInstructions,
  defaultExpanded = true,
  className,
}: DeliveryInformationSectionProps) {
  const fullAddress = [
    deliveryAddress.line1,
    deliveryAddress.line2,
    [deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(", "),
    [deliveryAddress.postalCode, deliveryAddress.country].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const data: KeyValuePair[] = [
    {
      key: "Estimated Delivery",
      value: (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            {new Date(estimatedDelivery).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      ),
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "Delivery Address",
      value: fullAddress.split(", ").map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      )),
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  if (contactName) {
    data.push({
      key: "Contact Name",
      value: contactName,
      icon: <User className="h-4 w-4" />,
    });
  }

  if (contactPhone) {
    data.push({
      key: "Contact Phone",
      value: contactPhone,
      icon: <Phone className="h-4 w-4" />,
    });
  }

  if (contactEmail) {
    data.push({
      key: "Contact Email",
      value: contactEmail,
      icon: <Mail className="h-4 w-4" />,
    });
  }

  if (deliveryInstructions) {
    data.push({
      key: "Delivery Instructions",
      value: deliveryInstructions,
      icon: <Info className="h-4 w-4" />,
    });
  }

  return (
    <ConfirmationSection
      id="delivery-information"
      title="Delivery Information"
      icon={<MapPin className="h-5 w-5" />}
      status="confirmed"
      statusLabel="Scheduled"
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    />
  );
}

// ============================================
// TRACKING INFORMATION SECTION
// ============================================

export type TrackingNotificationPreference = "sms" | "email" | "both" | "none";

export interface TrackingInformationSectionProps {
  trackingNumber?: string;
  trackingNumberAvailable?: boolean;
  trackingAvailableAt?: string;
  carrierTrackingUrl?: string;
  carrierName?: string;
  notificationPreference?: TrackingNotificationPreference;
  notificationEmail?: string;
  notificationPhone?: string;
  onUpdatePreferences?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

function getNotificationPreferenceLabel(preference: TrackingNotificationPreference): string {
  switch (preference) {
    case "sms":
      return "SMS notifications";
    case "email":
      return "Email notifications";
    case "both":
      return "SMS & Email notifications";
    case "none":
      return "No notifications";
    default:
      return "Not set";
  }
}

/**
 * TrackingInformationSection - Displays tracking information
 */
export function TrackingInformationSection({
  trackingNumber,
  trackingNumberAvailable = false,
  trackingAvailableAt,
  carrierTrackingUrl,
  carrierName = "Carrier",
  notificationPreference = "email",
  notificationEmail,
  notificationPhone,
  onUpdatePreferences,
  defaultExpanded = true,
  className,
}: TrackingInformationSectionProps) {
  const data: KeyValuePair[] = [];

  if (trackingNumber && trackingNumberAvailable) {
    data.push({
      key: "Tracking Number",
      value: (
        <div className="flex items-center gap-2">
          <code className="font-mono bg-muted px-2 py-0.5 rounded">
            {trackingNumber}
          </code>
          <CopyButton
            text={trackingNumber}
            variant="ghost"
            size="icon"
            ariaLabel="Copy tracking number"
          />
        </div>
      ),
      icon: <QrCode className="h-4 w-4" />,
    });
  } else {
    data.push({
      key: "Tracking Number",
      value: (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground italic">
            Available {trackingAvailableAt || "in 2-4 hours"}
          </span>
          <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        </div>
      ),
      icon: <Clock className="h-4 w-4" />,
    });
  }

  // Notification preferences
  data.push({
    key: "Notifications",
    value: (
      <div className="flex flex-col gap-1">
        <span>{getNotificationPreferenceLabel(notificationPreference)}</span>
        {notificationEmail && notificationPreference !== "sms" && (
          <span className="text-sm text-muted-foreground">{notificationEmail}</span>
        )}
        {notificationPhone && notificationPreference !== "email" && (
          <span className="text-sm text-muted-foreground">{notificationPhone}</span>
        )}
      </div>
    ),
    icon: <Bell className="h-4 w-4" />,
  });

  return (
    <ConfirmationSection
      id="tracking-information"
      title="Tracking Information"
      icon={<QrCode className="h-5 w-5" />}
      status={trackingNumberAvailable ? "confirmed" : "pending"}
      statusLabel={trackingNumberAvailable ? "Active" : "Pending"}
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
      headerAction={
        onUpdatePreferences ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onUpdatePreferences();
            }}
          >
            <Bell className="h-3.5 w-3.5" />
            Update
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 mt-4">
        {/* Carrier Tracking Link */}
        {carrierTrackingUrl && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Track with {carrierName}</h4>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href={carrierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Open Carrier Tracking
              </a>
            </Button>
          </div>
        )}

        {/* Tracking Status Message */}
        {!trackingNumberAvailable && (
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-info-900 text-sm">
                  Tracking Information Pending
                </h4>
                <p className="text-info-700 text-sm mt-1">
                  Your tracking number will be available once the carrier processes 
                  your shipment. This typically takes 2-4 hours after pickup confirmation.
                </p>
                <p className="text-info-700 text-sm mt-2">
                  We&apos;ll notify you via {notificationPreference === "sms" ? "SMS" : 
                    notificationPreference === "both" ? "SMS and email" : "email"} 
                  {" "}when tracking becomes available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Update Preferences CTA */}
        {onUpdatePreferences && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Want to change how you receive updates?
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpdatePreferences}
            >
              Update Preferences
            </Button>
          </div>
        )}
      </div>
    </ConfirmationSection>
  );
}

export default {
  ShipmentReferenceSection,
  PickupConfirmationSection,
  DeliveryInformationSection,
  TrackingInformationSection,
};
