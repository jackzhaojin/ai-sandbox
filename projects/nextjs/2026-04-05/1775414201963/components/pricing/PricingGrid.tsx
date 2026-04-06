"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PricingCard } from "./PricingCard";
import { RadioGroup } from "@/components/ui/radio-group";
import type { QuoteCategoryData, QuoteDetail } from "@/types/api";
import {
  Package,
  Plane,
  Truck,
  ArrowUpDown,
  Clock,
  Star,
  Filter,
  SlidersHorizontal,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PricingGridProps {
  /** Quote categories with their quotes */
  categories: QuoteCategoryData[];
  /** Currently selected quote ID (carrierId-serviceTypeId) */
  selectedQuoteId?: string;
  /** Callback when a quote is selected */
  onSelectQuote?: (quoteId: string, quote: QuoteDetail) => void;
  /** Callback when selection is confirmed */
  onConfirm?: () => void;
  /** Whether the confirm button is loading */
  isConfirming?: boolean;
  /** Additional CSS classes */
  className?: string;
}

type SortOption = "price" | "transit" | "reliability";
type FilterOption = "trackable" | "insurable" | "express";

interface CategoryTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

/**
 * PricingGrid - Shipping quote selection grid with tabs, sorting, and filters
 *
 * Features:
 * - Category tabs (Ground, Air, Freight, etc.) with count badges
 * - Sort controls (Price, Transit Time, Reliability)
 * - Filter toggles (Trackable, Insurable, Express)
 * - Single-selection radio behavior across all cards
 * - Responsive grid layout
 */
export function PricingGrid({
  categories,
  selectedQuoteId,
  onSelectQuote,
  onConfirm,
  isConfirming = false,
  className,
}: PricingGridProps) {
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("price");
  const [activeFilters, setActiveFilters] = React.useState<FilterOption[]>([]);

  // Build category tabs from available categories
  const categoryTabs: CategoryTab[] = React.useMemo(() => {
    const tabs: CategoryTab[] = [
      {
        id: "all",
        label: "All",
        icon: <Package className="h-4 w-4" />,
        count: categories.reduce((sum, cat) => sum + cat.count, 0),
      },
    ];

    categories.forEach((cat) => {
      const icon = getCategoryIcon(cat.category);
      tabs.push({
        id: cat.category.toLowerCase(),
        label: cat.display_name,
        icon,
        count: cat.count,
      });
    });

    return tabs;
  }, [categories]);

  // Get all quotes flattened
  const allQuotes = React.useMemo(() => {
    const quotes: QuoteDetail[] = [];
    categories.forEach((cat) => {
      cat.quotes.forEach((quote) => {
        quotes.push(quote);
      });
    });
    return quotes;
  }, [categories]);

  // Filter and sort quotes
  const filteredAndSortedQuotes = React.useMemo(() => {
    let quotes =
      activeTab === "all"
        ? allQuotes
        : categories.find((cat) => cat.category.toLowerCase() === activeTab)?.quotes || [];

    // Apply filters
    if (activeFilters.length > 0) {
      quotes = quotes.filter((quote) => {
        return activeFilters.every((filter) => {
          switch (filter) {
            case "trackable":
              return quote.service.is_trackable;
            case "insurable":
              return quote.service.is_insurable;
            case "express":
              return quote.service.max_delivery_days !== null && quote.service.max_delivery_days <= 2;
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    quotes = [...quotes].sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.pricing.total - b.pricing.total;
        case "transit":
          const aDays = a.service.min_delivery_days || 99;
          const bDays = b.service.min_delivery_days || 99;
          return aDays - bDays;
        case "reliability":
          const aRating = a.carrier.reliability_rating || 0;
          const bRating = b.carrier.reliability_rating || 0;
          return bRating - aRating; // Higher rating first
        default:
          return 0;
      }
    });

    return quotes;
  }, [allQuotes, categories, activeTab, sortBy, activeFilters]);

  // Get current tab quote count
  const currentTabCount = React.useMemo(() => {
    if (activeTab === "all") {
      return allQuotes.length;
    }
    return categories.find((cat) => cat.category.toLowerCase() === activeTab)?.count || 0;
  }, [activeTab, allQuotes, categories]);

  // Handle quote selection
  const handleQuoteSelect = (quote: QuoteDetail) => {
    const quoteId = `${quote.carrier_id}-${quote.service_type_id}`;
    onSelectQuote?.(quoteId, quote);
  };

  // Handle filter toggle
  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  // Check if any filters are active
  const hasActiveFilters = activeFilters.length > 0;

  // Generate radio group value
  const radioGroupValue = selectedQuoteId || "";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Sort and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Available Shipping Rates</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedQuotes.length} of {currentTabCount} options
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort:</span>
                <span className="capitalize">{getSortLabel(sortBy)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={sortBy === "price"}
                onCheckedChange={() => setSortBy("price")}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Price (Lowest First)
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "transit"}
                onCheckedChange={() => setSortBy("transit")}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Transit Time (Fastest First)
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "reliability"}
                onCheckedChange={() => setSortBy("reliability")}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Reliability (Highest First)
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("trackable")}
                onCheckedChange={() => toggleFilter("trackable")}
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Trackable Only
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("insurable")}
                onCheckedChange={() => toggleFilter("insurable")}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Insurable Only
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes("express")}
                onCheckedChange={() => toggleFilter("express")}
              >
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Express (1-2 Days)
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Tabs - Scrollable on mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0">
          {categoryTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 whitespace-nowrap px-2 py-1.5 sm:px-3 sm:gap-2"
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              <Badge
                variant={activeTab === tab.id ? "default" : "secondary"}
                className="ml-0.5 h-4 px-1 text-[10px] sm:h-5 sm:px-1.5 sm:text-xs"
              >
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Tab Content */}
        <TabsContent value="all" className="mt-6">
          <RadioGroup
            value={radioGroupValue}
            onValueChange={(value) => {
              const quote = allQuotes.find(
                (q) => `${q.carrier_id}-${q.service_type_id}` === value
              );
              if (quote) handleQuoteSelect(quote);
            }}
          >
            <QuotesGrid quotes={filteredAndSortedQuotes} selectedQuoteId={selectedQuoteId} />
          </RadioGroup>
        </TabsContent>

        {/* Category-specific Tab Content */}
        {categories.map((category) => (
          <TabsContent
            key={category.category}
            value={category.category.toLowerCase()}
            className="mt-6"
          >
            <RadioGroup
              value={radioGroupValue}
              onValueChange={(value) => {
                const quote = category.quotes.find(
                  (q) => `${q.carrier_id}-${q.service_type_id}` === value
                );
                if (quote) handleQuoteSelect(quote);
              }}
            >
              <QuotesGrid quotes={filteredAndSortedQuotes} selectedQuoteId={selectedQuoteId} />
            </RadioGroup>
          </TabsContent>
        ))}
      </Tabs>

      {/* Empty State */}
      {filteredAndSortedQuotes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No matching quotes found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try adjusting your filters or selecting a different category to see more options.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveFilters([])}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm Button */}
      {selectedQuoteId && (
        <div className="sticky bottom-4 z-10 flex justify-center">
          <Button
            size="lg"
            onClick={onConfirm}
            disabled={isConfirming || !selectedQuoteId}
            className="min-w-[200px] shadow-lg"
          >
            {isConfirming ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Continue with Selected Rate
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * QuotesGrid - Internal component for rendering the grid of pricing cards
 */
function QuotesGrid({
  quotes,
  selectedQuoteId,
}: {
  quotes: QuoteDetail[];
  selectedQuoteId?: string;
}) {
  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {quotes.map((quote) => {
        const quoteId = `${quote.carrier_id}-${quote.service_type_id}`;
        return (
          <PricingCard
            key={quoteId}
            quote={quote}
            selected={selectedQuoteId === quoteId}
            onSelect={() => {}}
            radioValue={quoteId}
          />
        );
      })}
    </div>
  );
}

/**
 * Get icon for service category
 */
function getCategoryIcon(category: string): React.ReactNode {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("air") || lowerCategory.includes("express")) {
    return <Plane className="h-4 w-4" />;
  }
  if (lowerCategory.includes("freight") || lowerCategory.includes("cargo")) {
    return <Truck className="h-4 w-4" />;
  }
  return <Package className="h-4 w-4" />;
}

/**
 * Get human-readable sort label
 */
function getSortLabel(sortBy: SortOption): string {
  switch (sortBy) {
    case "price":
      return "Price";
    case "transit":
      return "Transit Time";
    case "reliability":
      return "Reliability";
    default:
      return "Sort";
  }
}

export default PricingGrid;
