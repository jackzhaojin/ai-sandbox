"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownUp,
  ArrowUpDown,
  Filter,
  Leaf,
  Shield,
  Truck,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PricingCard, type QuoteResult } from "./PricingCard"

interface PricingGridProps {
  quotes: QuoteResult[]
  selectedQuoteId: string | null
  onSelectQuote: (quoteId: string) => void
  isLoading?: boolean
  className?: string
}

type ServiceCategory = "all" | "ground" | "air" | "express" | "freight" | "international"
type SortOption = "price" | "transit" | "reliability"
type SortDirection = "asc" | "desc"

interface FilterState {
  showEcoFriendly: boolean
  showReliableOnly: boolean
}

// Category configuration
const categories: { id: ServiceCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Services", icon: Truck },
  { id: "ground", label: "Ground", icon: Truck },
  { id: "air", label: "Air", icon: Zap },
  { id: "express", label: "Express", icon: Zap },
  { id: "freight", label: "Freight", icon: Shield },
  { id: "international", label: "International", icon: Truck },
]

// Get category count
function getCategoryCount(quotes: QuoteResult[], category: ServiceCategory): number {
  if (category === "all") return quotes.length
  return quotes.filter((q) => q.serviceType.category === category).length
}

// Get carrier reliability score
function getCarrierReliability(code: string): number {
  const scores: Record<string, number> = {
    pex: 4,
    vc: 5,
    efl: 4,
  }
  return scores[code] || 3
}

// Sort function
function sortQuotes(
  quotes: QuoteResult[],
  sortBy: SortOption,
  direction: SortDirection
): QuoteResult[] {
  const sorted = [...quotes]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "price":
        comparison = a.pricing.total - b.pricing.total
        break
      case "transit":
        comparison = a.transitDays.min - b.transitDays.min
        break
      case "reliability":
        comparison = getCarrierReliability(b.carrier.code) - getCarrierReliability(a.carrier.code)
        break
    }

    return direction === "asc" ? comparison : -comparison
  })

  return sorted
}

// Filter function
function filterQuotes(
  quotes: QuoteResult[],
  category: ServiceCategory,
  filters: FilterState
): QuoteResult[] {
  let filtered = quotes

  // Category filter
  if (category !== "all") {
    filtered = filtered.filter((q) => q.serviceType.category === category)
  }

  // Eco-friendly filter (lower carbon)
  if (filters.showEcoFriendly) {
    const avgCarbon =
      quotes.reduce((sum, q) => sum + q.carbonFootprint.kg, 0) / quotes.length
    filtered = filtered.filter((q) => q.carbonFootprint.kg <= avgCarbon)
  }

  // Reliable only filter (4+ stars)
  if (filters.showReliableOnly) {
    filtered = filtered.filter((q) => getCarrierReliability(q.carrier.code) >= 4)
  }

  return filtered
}

export function PricingGrid({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  isLoading,
  className,
}: PricingGridProps) {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all")
  const [sortBy, setSortBy] = useState<SortOption>("price")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filters, setFilters] = useState<FilterState>({
    showEcoFriendly: false,
    showReliableOnly: false,
  })

  // Process quotes with filters and sorting
  const processedQuotes = useMemo(() => {
    const filtered = filterQuotes(quotes, activeCategory, filters)
    return sortQuotes(filtered, sortBy, sortDirection)
  }, [quotes, activeCategory, sortBy, sortDirection, filters])

  // Generate unique quote ID
  const getQuoteId = (quote: QuoteResult) =>
    `${quote.carrier.code}-${quote.serviceType.code}`
  
  // Check if quote has a DB id (for API-fetched quotes)
  const getQuoteDBId = (quote: QuoteResult) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (quote as any).id || getQuoteId(quote)
  }

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    if (sortBy === newSort) {
      // Toggle direction
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(newSort)
      setSortDirection("asc")
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (quotes.length === 0) {
    return (
      <div className={cn("bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center", className)}>
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No rates available</h3>
        <p className="text-gray-500">Unable to retrieve shipping rates. Please try again.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Category tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            const count = getCategoryCount(quotes, category.id)
            const isActive = activeCategory === category.id

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                  isActive
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full",
                    isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <div className="flex items-center gap-1">
            {[
              { id: "price" as SortOption, label: "Price" },
              { id: "transit" as SortOption, label: "Transit Time" },
              { id: "reliability" as SortOption, label: "Reliability" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  sortBy === option.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {option.label}
                {sortBy === option.id &&
                  (sortDirection === "asc" ? (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  ))}
              </button>
            ))}
          </div>
        </div>

        {/* Filter toggles */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, showEcoFriendly: !prev.showEcoFriendly }))
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              filters.showEcoFriendly
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Leaf className="h-3.5 w-3.5" />
            Eco-friendly
          </button>
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, showReliableOnly: !prev.showReliableOnly }))
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              filters.showReliableOnly
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            4+ Stars
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {processedQuotes.length} of {quotes.length} rates
        {activeCategory !== "all" && ` for ${activeCategory}`}
      </div>

      {/* Quote cards grid */}
      {processedQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedQuotes.map((quote) => {
            const quoteId = getQuoteId(quote)
            return (
              <PricingCard
                key={quoteId}
                quote={quote}
                isSelected={selectedQuoteId === quoteId}
                onSelect={() => onSelectQuote(quoteId)}
              />
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Filter className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No matching rates</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your filters or selecting a different category.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all")
              setFilters({ showEcoFriendly: false, showReliableOnly: false })
            }}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
