"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ShippingLayout } from "@/components/shipping/ShippingLayout"
import {
  PricingGrid,
  ShipmentSummaryBar,
  type QuoteResult,
} from "@/components/pricing"
import { Loader2, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react"

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

interface QuoteFromAPI {
  id: string
  carrier_id: string
  service_type_id: string
  base_rate: number
  fuel_surcharge: number
  total_cost: number
  estimated_delivery: string
  is_selected: boolean
  created_at: string
  carriers?: {
    code: string
    name: string
    display_name: string
  }
  service_types?: {
    code: string
    name: string
    category: string
    transit_days_min: number
    transit_days_max: number
  }
  fee_breakdown?: {
    fuel_surcharge?: number
    insurance?: number
    special_handling?: number
    special_handling_details?: { name: string; fee: number }[]
    delivery_confirmation?: number
    delivery_confirmation_details?: { name: string; fee: number }[]
    tax?: number
  }
  calculation_basis?: {
    fuel_surcharge_percent?: number
    insurance_rate?: number
    tax_rate?: number
    carbon_footprint_kg?: number
  }
}

export default function PricingPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [quotes, setQuotes] = useState<QuoteResult[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedQuoteDBId, setSelectedQuoteDBId] = useState<string | null>(null)
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Fetch shipment details from API
  const fetchShipmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      
      if (!response.ok) {
        // If API doesn't exist, we'll use mock data
        return null
      }

      const data = await response.json()
      
      // Store current step for enforcement
      setCurrentStep(data.current_step || 1)
      
      // Step enforcement: if current_step < 2, redirect to details page
      if (data.current_step && data.current_step < 2) {
        router.push(`/shipments/new?edit=${shipmentId}`)
        return null
      }
      
      // Transform API response to ShipmentDetails format
      return {
        id: shipmentId,
        origin: { 
          city: data.origin?.city || "Austin", 
          state: data.origin?.state || "TX", 
          postalCode: data.origin?.postal || "78701" 
        },
        destination: { 
          city: data.destination?.city || "Dallas", 
          state: data.destination?.state || "TX", 
          postalCode: data.destination?.postal || "75201" 
        },
        package: {
          type: data.package_type || "box",
          weight: data.weight || 5.5,
          weightUnit: "lbs",
        },
        specialHandling: data.specialHandling?.map((h: { handling_type: string }) => h.handling_type) || [],
      } as ShipmentDetails
    } catch {
      // API might not exist yet
      return null
    }
  }, [shipmentId, router])

  // Fetch quotes for the shipment from API
  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/quote?shipmentId=${shipmentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quotes")
      }

      // Transform API response to QuoteResult format
      const transformedQuotes: QuoteResult[] = data.quotes.map((q: QuoteFromAPI) => {
        // Check if this quote is selected
        if (q.is_selected) {
          setSelectedQuoteDBId(q.id)
        }

        return {
          carrier: {
            id: q.carrier_id,
            code: q.carriers?.code || "pex",
            name: q.carriers?.name || "Carrier",
            displayName: q.carriers?.display_name || "Carrier",
          },
          serviceType: {
            id: q.service_type_id,
            code: q.service_types?.code || "ground",
            name: q.service_types?.name || "Ground",
            category: q.service_types?.category || "ground",
          },
          transitDays: {
            min: q.service_types?.transit_days_min || 1,
            max: q.service_types?.transit_days_max || 5,
          },
          pricing: {
            distance: 500,
            zone: 3,
            billableWeight: 5.5,
            actualWeight: 5.5,
            dimWeight: 4.2,
            baseRate: q.base_rate,
            fuelSurcharge: q.fee_breakdown?.fuel_surcharge || 0,
            fuelSurchargePercent: q.calculation_basis?.fuel_surcharge_percent || 0.15,
            insurance: q.fee_breakdown?.insurance || 0,
            insuranceRate: q.calculation_basis?.insurance_rate || 0.004,
            specialHandlingFees: q.fee_breakdown?.special_handling_details || [],
            specialHandlingTotal: q.fee_breakdown?.special_handling || 0,
            deliveryConfirmationFees: q.fee_breakdown?.delivery_confirmation_details || [],
            deliveryConfirmationTotal: q.fee_breakdown?.delivery_confirmation || 0,
            tax: q.fee_breakdown?.tax || 0,
            taxRate: q.calculation_basis?.tax_rate || 0.085,
            total: q.total_cost,
            currency: "USD",
          },
          carbonFootprint: {
            kg: q.calculation_basis?.carbon_footprint_kg || 0.5,
            calculation: "Standard calculation",
          },
          expiresAt: q.estimated_delivery || new Date(Date.now() + 3600000).toISOString(),
        }
      })

      setQuotes(transformedQuotes)
      
      // Build quote ID mapping for later selection
      const newIdMap: Record<string, string> = {}
      data.quotes.forEach((q: QuoteFromAPI) => {
        const frontendId = `${q.carriers?.code || q.carrier_id}-${q.service_types?.code || q.service_type_id}`
        newIdMap[frontendId] = q.id
      })
      setQuoteIdMap(newIdMap)
      
      return { hasQuotes: transformedQuotes.length > 0, quotes: data.quotes as QuoteFromAPI[] }
    } catch (err) {
      console.error("Error fetching quotes:", err)
      return { hasQuotes: false, quotes: [] }
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
      setQuotes(data.quotes as QuoteResult[])

      // Store shipment details from response
      if (data.shipmentDetails) {
        setShipmentDetails(data.shipmentDetails as ShipmentDetails)
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

  // Initial load - fetch quotes and shipment details
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First try to fetch existing quotes
        const { hasQuotes } = await fetchQuotes()

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

  // Store mapping of frontend quote IDs to DB quote IDs
  const [quoteIdMap, setQuoteIdMap] = useState<Record<string, string>>({})

  // Handle quote selection (UI only - just track the selection)
  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId)
  }

  // Handle continue to payment - persist selection to database
  const handleContinue = async () => {
    if (!selectedQuoteId) return

    setIsSelecting(true)
    setError(null)
    
    try {
      let quoteDBId: string | null = null
      
      // First, check if we already have the DB ID from the quoteIdMap
      if (quoteIdMap[selectedQuoteId]) {
        quoteDBId = quoteIdMap[selectedQuoteId]
      } else {
        // Try to fetch quotes from DB to get the ID
        try {
          const response = await fetch(`/api/quote?shipmentId=${shipmentId}`)
          if (response.ok) {
            const data = await response.json()
            const quotesFromDB: QuoteFromAPI[] = data.quotes || []
            
            // Build a map and find the selected quote
            const newIdMap: Record<string, string> = {}
            quotesFromDB.forEach((q: QuoteFromAPI) => {
              const frontendId = `${q.carriers?.code || 'unknown'}-${q.service_types?.code || 'unknown'}`
              newIdMap[frontendId] = q.id
            })
            setQuoteIdMap(newIdMap)
            
            quoteDBId = newIdMap[selectedQuoteId] || null
          }
        } catch (fetchErr) {
          console.warn("Could not fetch quotes from DB:", fetchErr)
        }
      }

      // If we have a DB ID, call the select API
      if (quoteDBId) {
        const selectResponse = await fetch("/api/quote/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipment_id: shipmentId,
            quote_id: quoteDBId,
          }),
        })

        if (!selectResponse.ok) {
          const selectData = await selectResponse.json()
          throw new Error(selectData.error || "Failed to select quote")
        }
      }

      // Navigate to payment page (even if select API failed, continue the flow)
      router.push(`/shipments/${shipmentId}/payment`)
    } catch (err) {
      console.error("Error selecting quote:", err)
      // Show error but still navigate to allow flow to continue
      setError(err instanceof Error ? err.message : "Failed to select quote")
      setTimeout(() => {
        router.push(`/shipments/${shipmentId}/payment`)
      }, 2000)
    } finally {
      setIsSelecting(false)
    }
  }

  // Handle recalculate - regenerate quotes
  const handleRecalculate = async () => {
    setError(null)
    await generateQuotes()
  }

  // Handle back button - go back to Step 1
  const handleBack = () => {
    // Navigate back to step 1 with shipment ID for editing
    router.push(`/shipments/new?edit=${shipmentId}`)
  }

  // Handle save as draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setError(null)
    setSaveMessage(null)

    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          lastSavedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      setSaveMessage('Draft saved successfully!')
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
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
      headerProps={{
        showBackButton: true,
        backHref: `/shipments/new?edit=${shipmentId}`,
        onSaveDraft: handleSaveDraft,
        isSavingDraft,
      }}
      navigationProps={{
        onNext: handleContinue,
        onPrevious: handleBack,
        nextLabel: isSelecting ? "Selecting..." : "Select Rate & Continue",
        previousLabel: "Back",
        isNextDisabled: !selectedQuoteId || isLoading || isGenerating || isSelecting || isSavingDraft,
        isNextLoading: isGenerating || isSelecting,
        showPrevious: true,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Select Shipping Rate
              </h1>
              <p className="text-gray-600">
                Compare rates from multiple carriers and select the best option for your shipment.
                All prices include fuel surcharge, taxes, and fees.
              </p>
            </div>
            
            {/* Recalculate Button */}
            <button
              onClick={handleRecalculate}
              disabled={isGenerating || isSavingDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Recalculate
            </button>
          </div>
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

        {/* Save success message */}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">{saveMessage}</p>
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
          onEdit={handleBack}
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
