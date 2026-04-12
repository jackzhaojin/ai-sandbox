'use client'

import { MapPin, Truck, DollarSign, Calendar, Clock } from 'lucide-react'

interface ShipmentSummaryCardProps {
  originCity: string
  originState: string
  destCity: string
  destState: string
  distance?: number
  carrierName: string
  serviceName: string
  transitMin: number
  transitMax: number
  totalCost: number
  currency: string
  pickupDate: string
  pickupTimeWindow: string
  estimatedDelivery: string
}

export function ShipmentSummaryCard({
  originCity,
  originState,
  destCity,
  destState,
  distance,
  carrierName,
  serviceName,
  transitMin,
  transitMax,
  totalCost,
  currency,
  pickupDate,
  pickupTimeWindow,
  estimatedDelivery,
}: ShipmentSummaryCardProps) {
  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg text-white overflow-hidden">
      <div className="p-6">
        {/* Route Visualization */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold text-lg">
                  {originCity}, {originState}
                </span>
              </div>
              <span className="text-xs text-blue-200 mt-1 block">Origin</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-12 bg-white/40" />
                <Truck className="h-5 w-5 text-blue-200" />
                <div className="h-0.5 w-12 bg-white/40" />
              </div>
              {distance && (
                <span className="text-xs text-blue-200 mt-1">{distance} miles</span>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold text-lg">
                  {destCity}, {destState}
                </span>
              </div>
              <span className="text-xs text-blue-200 mt-1 block">Destination</span>
            </div>
          </div>
        </div>

        {/* Service and Cost Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Service Selected */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-200" />
              <span className="text-sm text-blue-200">Service Selected</span>
            </div>
            <p className="font-semibold">{carrierName}</p>
            <p className="text-sm text-blue-100">{serviceName}</p>
            <p className="text-xs text-blue-200 mt-1">
              {transitMin}-{transitMax} business days
            </p>
          </div>

          {/* Total Cost */}
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-200" />
              <span className="text-sm text-blue-200">Total Cost</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(totalCost, currency)}
            </p>
            <p className="text-xs text-blue-200 mt-1">All fees included</p>
          </div>

          {/* Dates */}
          <div className="bg-white/10 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-200 mt-0.5" />
              <div>
                <p className="text-xs text-blue-200">Pickup Date</p>
                <p className="text-sm font-medium">{formatDate(pickupDate)}</p>
                {pickupTimeWindow && (
                  <p className="text-xs text-blue-200">{pickupTimeWindow}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-200 mt-0.5" />
              <div>
                <p className="text-xs text-blue-200">Est. Delivery</p>
                <p className="text-sm font-medium">{formatDate(estimatedDelivery)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
