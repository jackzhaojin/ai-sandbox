"use client"

import { Check, Clock, Leaf, Shield, Star, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceBreakdown } from "./PriceBreakdown"

interface Carrier {
  id: string
  code: string
  name: string
  displayName: string
}

interface ServiceType {
  id: string
  code: string
  name: string
  category: string
}

interface TransitDays {
  min: number
  max: number
}

interface PricingBreakdown {
  distance: number
  zone: number
  billableWeight: number
  actualWeight: number
  dimWeight: number
  baseRate: number
  fuelSurcharge: number
  fuelSurchargePercent: number
  insurance: number
  insuranceRate: number
  specialHandlingFees: { type: string; name: string; fee: number }[]
  specialHandlingTotal: number
  deliveryConfirmationFees: { type: string; name: string; fee: number }[]
  deliveryConfirmationTotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
}

interface CarbonFootprint {
  kg: number
  calculation: string
}

export interface QuoteResult {
  carrier: Carrier
  serviceType: ServiceType
  transitDays: TransitDays
  pricing: PricingBreakdown
  carbonFootprint: CarbonFootprint
  expiresAt: string
}

interface PricingCardProps {
  quote: QuoteResult
  isSelected: boolean
  onSelect: () => void
  className?: string
}

// Carrier logo placeholder component
function CarrierLogo({ code, name }: { code: string; name: string }) {
  const bgColors: Record<string, string> = {
    pex: "bg-blue-600",
    vc: "bg-purple-600",
    efl: "bg-orange-600",
  }

  return (
    <div
      className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs",
        bgColors[code] || "bg-gray-600"
      )}
    >
      {code.toUpperCase()}
    </div>
  )
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  )
}

// Generate carrier rating based on code (deterministic)
function getCarrierRating(code: string): number {
  const ratings: Record<string, number> = {
    pex: 4,
    vc: 5,
    efl: 4,
  }
  return ratings[code] || 4
}

// Generate service features based on category
function getServiceFeatures(category: string): string[] {
  const features: Record<string, string[]> = {
    ground: ["Cost-effective", "Reliable tracking", "Ground transport"],
    air: ["Fast delivery", "Priority handling", "Air freight"],
    express: ["Same/next day", "Guaranteed delivery", "Premium support"],
    freight: ["Large volumes", "Pallet shipping", "Dock to dock"],
    international: ["Customs handling", "Global tracking", "Import/export"],
  }
  return features[category] || features.ground
}

// Format delivery date
function formatDeliveryDate(transitDays: TransitDays): string {
  const now = new Date()
  const minDate = new Date(now.getTime() + transitDays.min * 24 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + transitDays.max * 24 * 60 * 60 * 1000)

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  if (transitDays.min === transitDays.max) {
    return formatDate(minDate)
  }
  return `${formatDate(minDate)} - ${formatDate(maxDate)}`
}

// Format transit time
function formatTransitTime(transitDays: TransitDays): string {
  if (transitDays.min === transitDays.max) {
    if (transitDays.min === 1) return "1 business day"
    return `${transitDays.min} business days`
  }
  return `${transitDays.min}-${transitDays.max} business days`
}

export function PricingCard({ quote, isSelected, onSelect, className }: PricingCardProps) {
  const carrierRating = getCarrierRating(quote.carrier.code)
  const features = getServiceFeatures(quote.serviceType.category)
  const deliveryDate = formatDeliveryDate(quote.transitDays)
  const transitTime = formatTransitTime(quote.transitDays)

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden",
        isSelected
          ? "border-blue-600 shadow-lg ring-1 ring-blue-600"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="bg-blue-600 text-white rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Radio button */}
      <div className="absolute top-4 left-4">
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
          )}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Card content */}
      <div className="p-5 pl-12">
        {/* Header: Carrier info */}
        <div className="flex items-start gap-4 mb-4">
          <CarrierLogo code={quote.carrier.code} name={quote.carrier.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{quote.carrier.displayName}</h3>
            </div>
            <StarRating rating={carrierRating} />
          </div>
        </div>

        {/* Service info */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{quote.serviceType.name}</h4>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{transitTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-gray-400" />
              <span>{deliveryDate}</span>
            </div>
          </div>
        </div>

        {/* Price - prominently displayed */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              ${quote.pricing.total.toFixed(2)}
            </span>
            <span className="text-gray-500">{quote.pricing.currency}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Includes all fees and taxes
          </p>
        </div>

        {/* Features list */}
        <div className="mb-4">
          <ul className="space-y-1.5">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Carbon footprint badge */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <Leaf className="h-3.5 w-3.5" />
            <span>{quote.carbonFootprint.kg.toFixed(2)} kg CO₂</span>
          </div>
        </div>
      </div>

      {/* Price breakdown (expandable) */}
      <PriceBreakdown
        baseRate={quote.pricing.baseRate}
        fuelSurcharge={quote.pricing.fuelSurcharge}
        fuelSurchargePercent={quote.pricing.fuelSurchargePercent}
        insurance={quote.pricing.insurance}
        insuranceRate={quote.pricing.insuranceRate}
        specialHandlingTotal={quote.pricing.specialHandlingTotal}
        deliveryConfirmationTotal={quote.pricing.deliveryConfirmationTotal}
        tax={quote.pricing.tax}
        taxRate={quote.pricing.taxRate}
        total={quote.pricing.total}
        currency={quote.pricing.currency}
        calculationBasis={{
          distance: quote.pricing.distance,
          zone: quote.pricing.zone,
          billableWeight: quote.pricing.billableWeight,
          actualWeight: quote.pricing.actualWeight,
          dimWeight: quote.pricing.dimWeight,
        }}
        specialHandlingDetails={quote.pricing.specialHandlingFees}
        deliveryConfirmationDetails={quote.pricing.deliveryConfirmationFees}
      />
    </div>
  )
}
