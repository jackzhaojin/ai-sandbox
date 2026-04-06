"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { PriceBreakdown } from "./PriceBreakdown";
import type { QuoteDetail } from "@/types/api";
import {
  Star,
  Clock,
  Calendar,
  Leaf,
  Shield,
  Truck,
  Package,
  Check,
  Zap,
} from "lucide-react";

export interface PricingCardProps {
  /** Quote data to display */
  quote: QuoteDetail;
  /** Whether this card is selected */
  selected?: boolean;
  /** Callback when card is selected */
  onSelect?: () => void;
  /** Radio group value */
  radioValue?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show price breakdown by default */
  defaultBreakdownExpanded?: boolean;
}

/**
 * PricingCard - Shipping quote display card
 *
 * Displays carrier information, service details, pricing, and features
 * with selectable radio behavior. Includes expandable price breakdown.
 */
export function PricingCard({
  quote,
  selected = false,
  onSelect,
  radioValue,
  className,
  defaultBreakdownExpanded = false,
}: PricingCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: quote.pricing.currency || "USD",
    }).format(amount);
  };

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Tomorrow";
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getTransitTimeLabel = () => {
    const min = quote.service.min_delivery_days;
    const max = quote.service.max_delivery_days;
    
    if (min === null || max === null) return "Delivery time varies";
    if (min === max) return `${min} day${min !== 1 ? "s" : ""}`;
    return `${min}-${max} days`;
  };

  // Generate features list based on service and pricing
  const features = React.useMemo(() => {
    const feats: { icon: React.ReactNode; label: string }[] = [];
    
    if (quote.service.is_trackable) {
      feats.push({ icon: <Truck className="h-3.5 w-3.5" />, label: "Tracking" });
    }
    if (quote.service.is_insurable) {
      feats.push({ icon: <Shield className="h-3.5 w-3.5" />, label: "Insurance" });
    }
    if (quote.pricing.insurance_cost > 0) {
      feats.push({ icon: <Package className="h-3.5 w-3.5" />, label: "Protected" });
    }
    if (quote.service.max_delivery_days !== null && quote.service.max_delivery_days <= 2) {
      feats.push({ icon: <Zap className="h-3.5 w-3.5" />, label: "Express" });
    }
    
    return feats;
  }, [quote]);

  // Generate calculation basis
  const calculationBasis = React.useMemo(() => {
    return {
      distance: quote.carbon_footprint.distance_km,
      weight: quote.pricing.weight_charge > 0 ? quote.pricing.weight_charge / 0.5 : 10, // Approximation
      zone: "Zone " + Math.ceil(Math.random() * 8), // Would come from real data
    };
  }, [quote]);

  // Generate reliability rating display
  const renderReliabilityRating = () => {
    const rating = quote.carrier.reliability_rating;
    if (rating === null) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < fullStars
                  ? "fill-warning-400 text-warning-400"
                  : i === fullStars && hasHalfStar
                  ? "fill-warning-400/50 text-warning-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const cardId = `pricing-card-${quote.carrier_id}-${quote.service_type_id}`;
  const radioId = radioValue || `${quote.carrier_id}-${quote.service_type_id}`;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        selected && "ring-2 ring-primary border-primary shadow-lg bg-primary/5",
        className
      )}
      onClick={onSelect}
      data-selected={selected}
      id={cardId}
    >
      {/* Radio Button - Positioned absolutely with larger touch target for mobile */}
      <div 
        className="absolute right-2 top-2 sm:right-4 sm:top-4 p-2 -m-2" 
        onClick={(e) => e.stopPropagation()}
      >
        <RadioGroupItem 
          value={radioId} 
          id={radioId}
          className="h-5 w-5 sm:h-4 sm:w-4"
        />
      </div>

      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="flex items-start gap-2 sm:gap-3 pr-8 sm:pr-10">
          {/* Carrier Logo - Smaller on mobile */}
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            {quote.carrier.logo_url ? (
              <img
                src={quote.carrier.logo_url}
                alt={quote.carrier.display_name}
                className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
              />
            ) : (
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            )}
          </div>

          {/* Carrier & Service Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                {quote.carrier.display_name}
              </h3>
              {selected && (
                <Badge variant="default" className="h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs shrink-0">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                  <span className="hidden sm:inline">Selected</span>
                </Badge>
              )}
            </div>
            
            {/* Reliability Rating */}
            {renderReliabilityRating()}
            
            {/* Service Name */}
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground truncate">
              {quote.service.display_name}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Transit Time & Delivery Date - Stacked on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{getTransitTimeLabel()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatDeliveryDate(quote.estimated_delivery)}
            </span>
          </div>
        </div>

        {/* Price - Smaller on mobile */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight">
            {formatCurrency(quote.pricing.total)}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">total</span>
        </div>

        {/* Features - Smaller badges on mobile */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {features.map((feature, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-normal py-0.5 sm:py-1"
              >
                {feature.icon}
                <span className="hidden sm:inline">{feature.label}</span>
                <span className="sm:hidden">{feature.label.split(' ')[0]}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Carbon Footprint Badge - Compact on mobile */}
        {quote.carbon_footprint.kg_co2 > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-md bg-success-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
            <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success-600" />
            <span className="text-success-800">
              <span className="font-medium">{quote.carbon_footprint.kg_co2.toFixed(1)} kg</span>
              <span className="hidden sm:inline"> CO₂ emitted</span>
              <span className="sm:hidden"> CO₂</span>
            </span>
          </div>
        )}

        {/* Price Breakdown - Expandable */}
        <PriceBreakdown
          pricing={quote.pricing}
          calculationBasis={calculationBasis}
          defaultExpanded={defaultBreakdownExpanded}
          className="border-t pt-2"
        />
      </CardContent>
    </Card>
  );
}

export default PricingCard;
