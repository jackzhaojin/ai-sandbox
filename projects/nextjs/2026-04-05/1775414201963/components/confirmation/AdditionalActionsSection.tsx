"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationSection, type KeyValuePair } from "./ConfirmationSection";
import {
  Shield,
  MapPin,
  Package,
  Plus,
  Repeat,
  Edit3,
  ExternalLink,
  ArrowRight,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface InsuranceOption {
  id: string;
  name: string;
  coverage: number;
  cost: number;
  currency?: string;
  recommended?: boolean;
}

export interface HoldLocation {
  id: string;
  name: string;
  address: string;
  hours: string;
  distance?: string;
}

export interface AdditionalActionsSectionProps {
  /** Current insurance status */
  insuranceAdded?: boolean;
  /** Insurance options available to add */
  insuranceOptions?: InsuranceOption[];
  /** Whether delivery address can be changed */
  canChangeDeliveryAddress?: boolean;
  /** Current delivery address */
  currentDeliveryAddress?: string;
  /** Whether hold at location is available */
  holdAtLocationAvailable?: boolean;
  /** Available hold locations */
  holdLocations?: HoldLocation[];
  /** Callback when Add Insurance is clicked */
  onAddInsurance?: () => void;
  /** Callback when Change Delivery Address is clicked */
  onChangeDeliveryAddress?: () => void;
  /** Callback when Hold at Location is clicked */
  onHoldAtLocation?: () => void;
  /** Callback when Schedule Another Shipment is clicked */
  onScheduleAnother?: () => void;
  /** Callback when Repeat This Shipment is clicked */
  onRepeatShipment?: () => void;
  /** Callback when a specific insurance option is selected */
  onSelectInsuranceOption?: (optionId: string) => void;
  /** Callback when a specific hold location is selected */
  onSelectHoldLocation?: (locationId: string) => void;
  /** Default expanded state */
  defaultExpanded?: boolean;
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
  }).format(amount);
}

function formatCoverage(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
  actionHref?: string;
  disabled?: boolean;
  disabledReason?: string;
  badge?: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
  className?: string;
}

function ActionCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  disabled,
  disabledReason,
  badge,
  variant = "default",
  className,
}: ActionCardProps) {
  const variantStyles = {
    default: "bg-muted/50 hover:border-primary/50",
    primary: "bg-primary/5 border-primary/20 hover:border-primary/50",
    secondary: "bg-secondary/50 hover:border-secondary",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        variantStyles[variant],
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">{title}</h4>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {disabled && disabledReason && (
            <p className="text-xs text-destructive mt-1">{disabledReason}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <Button
          variant={variant === "primary" ? "default" : "outline"}
          size="sm"
          className="w-full gap-2"
          onClick={onAction}
          disabled={disabled}
          asChild={!!actionHref && !disabled}
        >
          {actionHref && !disabled ? (
            <a href={actionHref}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <>
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface InsuranceOptionCardProps {
  option: InsuranceOption;
  onSelect?: (optionId: string) => void;
  selected?: boolean;
}

function InsuranceOptionCard({ option, onSelect, selected }: InsuranceOptionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 cursor-pointer transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 bg-muted/30"
      )}
      onClick={() => onSelect?.(option.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{option.name}</span>
        </div>
        {option.recommended && (
          <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200 text-xs">
            Recommended
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-muted-foreground">
          Coverage: {formatCoverage(option.coverage, option.currency)}
        </span>
        <span className="font-semibold text-primary">
          +{formatCurrency(option.cost, option.currency)}
        </span>
      </div>
    </div>
  );
}

interface HoldLocationCardProps {
  location: HoldLocation;
  onSelect?: (locationId: string) => void;
  selected?: boolean;
}

function HoldLocationCard({ location, onSelect, selected }: HoldLocationCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 cursor-pointer transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 bg-muted/30"
      )}
      onClick={() => onSelect?.(location.id)}
    >
      <div className="flex items-start gap-2">
        <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium">{location.name}</span>
            {location.distance && (
              <span className="text-xs text-muted-foreground">{location.distance}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{location.address}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {location.hours}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AdditionalActionsSection - Displays additional actions available for the shipment
 *
 * Features:
 * - Add Insurance option with coverage levels
 * - Change Delivery Address
 * - Hold at Location with available locations
 * - Schedule Another Shipment
 * - Repeat This Shipment
 *
 * @example
 * <AdditionalActionsSection
 *   insuranceAdded={false}
 *   insuranceOptions={[...]}
 *   onAddInsurance={() => console.log("Add insurance")}
 *   onScheduleAnother={() => router.push("/shipments/new")}
 * />
 */
export function AdditionalActionsSection({
  insuranceAdded = false,
  insuranceOptions = [],
  canChangeDeliveryAddress = true,
  currentDeliveryAddress,
  holdAtLocationAvailable = true,
  holdLocations = [],
  onAddInsurance,
  onChangeDeliveryAddress,
  onHoldAtLocation,
  onScheduleAnother,
  onRepeatShipment,
  onSelectInsuranceOption,
  onSelectHoldLocation,
  defaultExpanded = true,
  className,
}: AdditionalActionsSectionProps) {
  const [showInsuranceOptions, setShowInsuranceOptions] = React.useState(false);
  const [showHoldLocations, setShowHoldLocations] = React.useState(false);
  const [selectedInsurance, setSelectedInsurance] = React.useState<string | null>(null);
  const [selectedHoldLocation, setSelectedHoldLocation] = React.useState<string | null>(null);

  const handleSelectInsurance = (optionId: string) => {
    setSelectedInsurance(optionId);
    onSelectInsuranceOption?.(optionId);
  };

  const handleSelectHoldLocation = (locationId: string) => {
    setSelectedHoldLocation(locationId);
    onSelectHoldLocation?.(locationId);
  };

  const handleAddInsurance = () => {
    if (insuranceOptions.length > 0 && !showInsuranceOptions) {
      setShowInsuranceOptions(true);
    } else {
      onAddInsurance?.();
    }
  };

  const handleHoldAtLocation = () => {
    if (holdLocations.length > 0 && !showHoldLocations) {
      setShowHoldLocations(true);
    } else {
      onHoldAtLocation?.();
    }
  };

  // Build summary data
  const data: KeyValuePair[] = [
    {
      key: "Insurance",
      value: insuranceAdded ? (
        <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Added
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Added
        </Badge>
      ),
      icon: <Shield className="h-4 w-4" />,
    },
    {
      key: "Delivery Method",
      value: selectedHoldLocation ? "Hold at Location" : "Direct Delivery",
      icon: <MapPin className="h-4 w-4" />,
    },
  ];

  return (
    <ConfirmationSection
      id="additional-actions"
      title="Additional Actions"
      icon={<Plus className="h-5 w-5" />}
      status="confirmed"
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    >
      <div className="space-y-6 mt-4">
        {/* Shipment Management Actions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            Modify This Shipment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Add Insurance */}
            {!insuranceAdded ? (
              <ActionCard
                title="Add Insurance"
                description="Protect your shipment against loss or damage during transit."
                icon={<Shield className="h-5 w-5" />}
                actionLabel={showInsuranceOptions ? "Confirm Selection" : "Add Insurance"}
                onAction={handleAddInsurance}
                variant="primary"
                badge={
                  <Badge variant="outline" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    From $5.99
                  </Badge>
                }
              />
            ) : (
              <ActionCard
                title="Insurance Added"
                description="Your shipment is protected. View coverage details."
                icon={<CheckCircle2 className="h-5 w-5" />}
                actionLabel="View Coverage"
                onAction={onAddInsurance}
                disabled
                disabledReason="Insurance already added to this shipment"
              />
            )}

            {/* Change Delivery Address */}
            <ActionCard
              title="Change Delivery Address"
              description={
                currentDeliveryAddress
                  ? `Current: ${currentDeliveryAddress}`
                  : "Update the delivery address before shipment is picked up."
              }
              icon={<MapPin className="h-5 w-5" />}
              actionLabel="Change Address"
              onAction={onChangeDeliveryAddress}
              disabled={!canChangeDeliveryAddress}
              disabledReason={
                !canChangeDeliveryAddress
                  ? "Address can only be changed before pickup is scheduled"
                  : undefined
              }
            />

            {/* Hold at Location */}
            <ActionCard
              title="Hold at Location"
              description="Redirect your package to a convenient pickup location."
              icon={<Building2 className="h-5 w-5" />}
              actionLabel={showHoldLocations ? "Confirm Location" : "Select Location"}
              onAction={handleHoldAtLocation}
              disabled={!holdAtLocationAvailable}
              disabledReason={
                !holdAtLocationAvailable
                  ? "Not available for this service type"
                  : undefined
              }
            />
          </div>

          {/* Insurance Options */}
          {showInsuranceOptions && insuranceOptions.length > 0 && (
            <div className="mt-4 p-4 bg-background rounded-lg border">
              <h5 className="font-medium text-sm mb-3">Select Coverage Level</h5>
              <div className="space-y-2">
                {insuranceOptions.map((option) => (
                  <InsuranceOptionCard
                    key={option.id}
                    option={option}
                    selected={selectedInsurance === option.id}
                    onSelect={handleSelectInsurance}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowInsuranceOptions(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!selectedInsurance}
                  onClick={() => onAddInsurance?.()}
                >
                  Add Selected Insurance
                </Button>
              </div>
            </div>
          )}

          {/* Hold Locations */}
          {showHoldLocations && holdLocations.length > 0 && (
            <div className="mt-4 p-4 bg-background rounded-lg border">
              <h5 className="font-medium text-sm mb-3">Select Pickup Location</h5>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {holdLocations.map((location) => (
                  <HoldLocationCard
                    key={location.id}
                    location={location}
                    selected={selectedHoldLocation === location.id}
                    onSelect={handleSelectHoldLocation}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowHoldLocations(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={!selectedHoldLocation}
                  onClick={() => onHoldAtLocation?.()}
                >
                  Confirm Location
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Quick Actions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Schedule Another Shipment */}
            <ActionCard
              title="Schedule Another Shipment"
              description="Create a new shipment with fresh details."
              icon={<Plus className="h-5 w-5" />}
              actionLabel="New Shipment"
              onAction={onScheduleAnother}
              actionHref="/shipments/new"
            />

            {/* Repeat This Shipment */}
            <ActionCard
              title="Repeat This Shipment"
              description="Use the same details to create an identical shipment."
              icon={<Repeat className="h-5 w-5" />}
              actionLabel="Duplicate Shipment"
              onAction={onRepeatShipment}
              variant="secondary"
            />
          </div>
        </div>

        {/* Help Link */}
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>Need help with these options?</span>
          <Button variant="link" size="sm" className="gap-1" asChild>
            <a href="/help" target="_blank" rel="noopener noreferrer">
              View Help Center
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </ConfirmationSection>
  );
}

export default AdditionalActionsSection;
