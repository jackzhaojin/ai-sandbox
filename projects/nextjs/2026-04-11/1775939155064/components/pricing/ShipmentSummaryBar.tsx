"use client"

import { Edit3, MapPin, Package, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

interface Address {
  city: string
  state: string
  postalCode?: string
}

interface PackageInfo {
  type?: string
  weight: number
  weightUnit?: string
  dimensions?: string
}

interface ShipmentSummaryBarProps {
  origin: Address
  destination: Address
  packageInfo: PackageInfo
  specialHandling?: string[]
  onEdit?: () => void
  className?: string
}

// Format special handling for display
function formatSpecialHandling(handling: string[]): string {
  if (handling.length === 0) return "None"
  
  const displayNames: Record<string, string> = {
    fragile: "Fragile",
    "this-side-up": "Orientation",
    "temperature-controlled": "Temp Control",
    hazmat: "Hazmat",
    "white-glove": "White Glove",
    "inside-delivery": "Inside Delivery",
    "liftgate-pickup": "Liftgate Pickup",
    "liftgate-delivery": "Liftgate Delivery",
    signature: "Signature",
    "adult-signature": "Adult Signature",
    "sms-confirmation": "SMS Confirm",
    "photo-proof": "Photo Proof",
    "saturday-delivery": "Saturday",
    "hold-at-location": "Hold for Pickup",
  }

  return handling
    .map((h) => displayNames[h] || h)
    .join(", ")
}

export function ShipmentSummaryBar({
  origin,
  destination,
  packageInfo,
  specialHandling = [],
  onEdit,
  className,
}: ShipmentSummaryBarProps) {
  const routeText = `${origin.city}, ${origin.state} → ${destination.city}, ${destination.state}`
  const packageText = packageInfo.type 
    ? `${packageInfo.type}, ${packageInfo.weight} ${packageInfo.weightUnit || "lbs"}`
    : `${packageInfo.weight} ${packageInfo.weightUnit || "lbs"}`
  const specialText = formatSpecialHandling(specialHandling)

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-4 lg:gap-8">
        {/* Route */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Route</p>
            <p className="text-sm font-medium text-gray-900 truncate">{routeText}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-10 bg-gray-200" />

        {/* Package */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Package</p>
            <p className="text-sm font-medium text-gray-900 truncate">{packageText}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-10 bg-gray-200" />

        {/* Special Handling */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Special Services</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {specialText}
            </p>
          </div>
        </div>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        )}
      </div>
    </div>
  )
}
