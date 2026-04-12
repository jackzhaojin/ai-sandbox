"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ShippingLayout } from "@/components/shipping/ShippingLayout"
import {
  PricingGrid,
  ShipmentSummaryBar,
  type QuoteResult,
} from "@/components/pricing"
import { Loader2 } from "lucide-react"

interface ShipmentDetails {
  id: string
  origin: {
    city: string
    state: string
    postalCode: string
  }
  destination: {
    city: string
    state: string
    postalCode: string
  }
  package: {
    type?: string
    weight: number
    weightUnit: string
  }
  specialHandling: string[]
}

export default function RatesPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [quotes, setQuotes] = useState<QuoteResult[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch quotes for the shipment
  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/quote?shipmentId=${shipmentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quotes")
      }

      // Transform API response to QuoteResult format
      const transformedQuotes: QuoteResult[] = data.quotes.map((q: Record<string, unknown>) => ({
        carrier: {
          id: q.carrier_id as string,
          code: (q.carriers as Record<string, string>)?.code || "pex",
          name: (q.carriers as Record<string, string>)?.name || "Carrier",
          displayName: (q.carriers as Record<string, string>)?.display_name || "Carrier",
        },
        serviceType: {
          id: q.service_type_id as string,
          code: (q.service_types as Record<string, string>)?.code || "ground",
          name: (q.service_types as Record<string, string>)?.name || "Ground",
          category: (q.service_types as Record<string, string>)?.category || "ground",
        },
        transitDays: {
          min: (q.service_types as Record<string, number>)?.transit_days_min || 1,
          max: (q.service_types as Record<string, number>)?.transit_days_max || 5,
        },
        pricing: {
          distance: 500,
          zone: 3,
          billableWeight: 5.5,
          actualWeight: 5.5,
          dimWeight: 4.2,
          baseRate: q.base_rate as number,
          fuelSurcharge: (q.fee_breakdown as Record<string, number>)?.fuel_surcharge || 0,
          fuelSurchargePercent: (q.calculation_basis as Record<string, number>)?.fuel_surcharge_percent || 0.15,
          insurance: (q.fee_breakdown as Record<string, number>)?.insurance || 0,
          insuranceRate: (q.calculation_basis as Record<string, number>)?.insurance_rate || 0.004,
          specialHandlingFees: (q.fee_breakdown as Record<string, { name: string; fee: number }[]>)?.special_handling_details || [],
          specialHandlingTotal: (q.fee_breakdown as Record<string, number>)?.special_handling || 0,
          deliveryConfirmationFees: (q.fee_breakdown as Record<string, { name: string; fee: number }[]>)?.delivery_confirmation_details || [],
          deliveryConfirmationTotal: (q.fee_breakdown as Record<string, number>)?.delivery_confirmation || 0,
          tax: (q.fee_breakdown as Record<string, number>)?.tax || 0,
          taxRate: (q.calculation_basis as Record<string, number>)?.tax_rate || 0.085,
          total: q.total_cost as number,
          currency: "USD",
        },
        carbonFootprint: {
          kg: (q.calculation_basis as Record<string, number>)?.carbon_footprint_kg || 0.5,
          calculation: "Standard calculation",
        },
        expiresAt: q.expires_at as string,
      }))

      setQuotes(transformedQuotes)
      return transformedQuotes.length > 0
    } catch (err) {
      console.error("Error fetching quotes:", err)
      return false
    }
  }, [shipmentId])

  // Generate quotes via API
  const generateQuotes = useCallback(async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quotes")
      }

      // Use generated quotes directly
      setQuotes(data.quotes)

      // Store shipment details from response
      if (data.shipmentDetails) {
        setShipmentDetails(data.shipmentDetails)
      }

      return true
    } catch (err) {
      console.error("Error generating quotes:", err)
      setError(err instanceof Error ? err.message : "Failed to generate quotes")
      return false
    } finally {
      setIsGenerating(false)
    }
  }, [shipmentId])

  // Fetch shipment details
  const fetchShipmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      
      if (!response.ok) {
        // If API doesn't exist, we'll use mock data
        return null
      }

      const data = await response.json()
      return data.shipment as ShipmentDetails
    } catch {
      // API might not exist yet
      return null
    }
  }, [shipmentId])

  // Initial load - fetch quotes and shipment details
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First try to fetch existing quotes
        const hasQuotes = await fetchQuotes()

        // If no quotes exist, generate them
        if (!hasQuotes) {
          await generateQuotes()
        }

        // Fetch shipment details
        const details = await fetchShipmentDetails()
        if (details) {
          setShipmentDetails(details)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchQuotes, generateQuotes, fetchShipmentDetails])

  // Handle quote selection
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
  }

  // Handle continue to payment
  const handleContinue = async () => {
    if (!selectedQuoteId) return

    // TODO: Persist selected quote to database
    // This will be implemented in Step 17

    router.push(`/shipments/${shipmentId}/payment`)
  }

  // Handle edit shipment
  const handleEditShipment = () => {
    // Navigate back to step 1 with shipment ID
    router.push(`/shipments/new?edit=${shipmentId}`)
  }

  // Build shipment summary data
  const shipmentSummary = shipmentDetails || {
    origin: { city: "Austin", state: "TX", postalCode: "78701" },
    destination: { city: "Dallas", state: "TX", postalCode: "75201" },
    package: { weight: 5.5, weightUnit: "lbs" },
    specialHandling: [],
  }

  return (
    <ShippingLayout
      step={2}
      shipmentId={shipmentId}
      navigationProps={{
        onNext: handleContinue,
        nextLabel: "Select Rate & Continue",
        isNextDisabled: !selectedQuoteId || isLoading || isGenerating,
        isNextLoading: isGenerating,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Select Shipping Rate
          </h1>
          <p className="text-gray-600">
            Compare rates from multiple carriers and select the best option for your shipment.
            All prices include fuel surcharge, taxes, and fees.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => generateQuotes()}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Shipment summary bar */}
        <ShipmentSummaryBar
          origin={shipmentSummary.origin}
          destination={shipmentSummary.destination}
          packageInfo={{
            type: shipmentSummary.package.type,
            weight: shipmentSummary.package.weight,
            weightUnit: shipmentSummary.package.weightUnit,
          }}
          specialHandling={shipmentSummary.specialHandling}
          onEdit={handleEditShipment}
        />

        {/* Loading state */}
        {isLoading || isGenerating ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">
                {isGenerating ? "Generating quotes..." : "Loading rates..."}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                This may take a few moments
              </p>
            </div>
          </div>
        ) : (
          /* Pricing grid */
          <PricingGrid
            quotes={quotes}
            selectedQuoteId={selectedQuoteId}
            onSelectQuote={handleSelectQuote}
            isLoading={isLoading}
          />
        )}

        {/* Info note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> All quotes are valid for 1 hour. Prices include fuel surcharge,
            insurance, taxes, and any special handling fees. Estimated delivery dates are based on
            business days and may vary.
          </p>
        </div>
      </div>
    </ShippingLayout>
  )
}
