"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PricingGrid } from "@/components/pricing/PricingGrid";
import { ShipmentSummaryBar, ShipmentSummaryBarSkeleton } from "@/components/pricing/ShipmentSummaryBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { QuoteCategoryData, QuoteDetail } from "@/types/api";
import type { Address } from "@/types/database";
import { Calculator, ArrowLeft, ArrowRight, Package } from "lucide-react";
import { CheckoutLayout } from "@/components/checkout";
import { useCheckoutNavigation } from "@/hooks/use-checkout-navigation";

interface ShipmentData {
  id: string;
  sender_address: Address;
  recipient_address: Address;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  package_type?: string;
  declared_value?: number;
  special_handling: Array<{
    handling_type: string;
    instructions?: string;
  }>;
}

/**
 * Step 2: Rate Selection Page
 *
 * Displays available shipping rates with:
 * - Shipment summary bar with route and package details
 * - Category tabs for filtering by service type
 * - Sort and filter controls
 * - Quote cards with pricing breakdown
 * - Quote selection with API call to /api/quote/select
 * - Step navigation with progress tracking
 */
export default function RateSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [shipmentId, setShipmentId] = React.useState<string>("");
  
  React.useEffect(() => {
    params.then(p => setShipmentId(p.id));
  }, [params]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [shipment, setShipment] = React.useState<ShipmentData | null>(null);
  const [quoteData, setQuoteData] = React.useState<QuoteCategoryData[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = React.useState<string>();
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteDetail>();
  const [error, setError] = React.useState<string | null>(null);

  // Initialize checkout navigation
  const navigation = useCheckoutNavigation({
    currentStep: "rates",
    shipmentId,
    completedStepIndex: 0, // Step 1 (details) is completed
    allowStepNavigation: true,
    validateStep: () => !!selectedQuoteId,
  });

  // Fetch shipment and calculate quotes on mount
  React.useEffect(() => {
    const loadData = async () => {
      if (!shipmentId) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Fetch shipment details
        const shipmentRes = await fetch(`/api/shipments/${shipmentId}`);
        if (!shipmentRes.ok) {
          throw new Error("Failed to load shipment");
        }
        const shipmentResult = await shipmentRes.json();

        if (!shipmentResult.success) {
          throw new Error(shipmentResult.error?.message || "Failed to load shipment");
        }

        const shipmentData: ShipmentData = {
          id: shipmentResult.data.shipment.id,
          sender_address: shipmentResult.data.sender_address,
          recipient_address: shipmentResult.data.recipient_address,
          weight: shipmentResult.data.shipment.weight,
          length: shipmentResult.data.shipment.length,
          width: shipmentResult.data.shipment.width,
          height: shipmentResult.data.shipment.height,
          package_type: shipmentResult.data.shipment.package_type,
          declared_value: shipmentResult.data.shipment.declared_value,
          special_handling: shipmentResult.data.special_handling || [],
        };
        setShipment(shipmentData);

        // Calculate quotes
        const quoteRes = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipment_id: shipmentId,
            package: {
              weight: shipmentData.weight || 1,
              length: shipmentData.length || 10,
              width: shipmentData.width || 10,
              height: shipmentData.height || 10,
            },
            declared_value: shipmentData.declared_value,
            special_handling: shipmentData.special_handling.map((h) => h.handling_type),
          }),
        });

        if (!quoteRes.ok) {
          throw new Error("Failed to calculate quotes");
        }

        const quoteResult = await quoteRes.json();

        if (!quoteResult.success) {
          throw new Error(quoteResult.error?.message || "Failed to calculate quotes");
        }

        setQuoteData(quoteResult.data.quotes);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [shipmentId]);

  // Handle quote selection
  const handleSelectQuote = React.useCallback((quoteId: string, quote: QuoteDetail) => {
    setSelectedQuoteId(quoteId);
    setSelectedQuote(quote);
  }, []);

  // Handle quote confirmation
  const handleConfirm = React.useCallback(async () => {
    if (!selectedQuote || !shipment) return;

    setIsSelecting(true);
    try {
      // Find the quote ID from the database (we need to match the quote by carrier/service)
      const quoteRes = await fetch("/api/quote/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment_id: shipmentId,
          quote_id: selectedQuoteId,
        }),
      });

      if (!quoteRes.ok) {
        const errorData = await quoteRes.json();
        throw new Error(errorData.error?.message || "Failed to select quote");
      }

      // Create step completed event
      await navigation.createStepEvent("rates", "step_completed", {
        selected_carrier: selectedQuote.carrier.name,
        selected_service: selectedQuote.service.name,
        total_cost: selectedQuote.pricing.total,
      });

      toast.success("Rate selected successfully!");

      // Navigate to payment step
      router.push(`/shipments/${shipmentId}/payment`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to select quote";
      toast.error(message);
    } finally {
      setIsSelecting(false);
    }
  }, [selectedQuote, shipment, shipmentId, selectedQuoteId, router, navigation]);

  // Handle back to shipment details
  const handleBack = () => {
    router.push("/shipments/new");
  };

  // Handle save as draft
  const handleSaveDraft = React.useCallback(async () => {
    try {
      await fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      
      await navigation.createStepEvent("rates", "draft_saved");
      toast.success("Progress saved as draft");
    } catch {
      toast.error("Failed to save draft");
    }
  }, [shipmentId, navigation]);

  // Handle start over
  const handleStartOver = React.useCallback(() => {
    if (confirm("Are you sure you want to start over? All progress will be lost.")) {
      localStorage.removeItem("shipmentDraft");
      router.push("/shipments/new");
      toast.info("Starting over...");
    }
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <CheckoutLayout
        currentStep="rates"
        completedStepIndex={0}
        onPrevious={handleBack}
        isLoading={true}
        nextDisabled={true}
      >
        <div className="space-y-6">
          <ShipmentSummaryBarSkeleton />
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" className="mr-3" />
            <span className="text-lg text-muted-foreground">Loading rates...</span>
          </div>
        </div>
      </CheckoutLayout>
    );
  }

  // Error state
  if (error || !shipment) {
    return (
      <CheckoutLayout
        currentStep="rates"
        completedStepIndex={0}
        onPrevious={handleBack}
        showSaveDraft={false}
      >
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <Calculator className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Failed to Load Rates</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              {error || "Could not load shipment data. Please try again."}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </CheckoutLayout>
    );
  }

  // Build package summary for ShipmentSummaryBar
  const packageSummary = {
    packageType: shipment.package_type || "Package",
    count: 1,
    weight: shipment.weight || 0,
    weightUnit: "lbs" as const,
    dimensions:
      shipment.length && shipment.width && shipment.height
        ? {
            length: shipment.length,
            width: shipment.width,
            height: shipment.height,
            unit: "in" as const,
          }
        : undefined,
  };

  // Build special handling items
  const specialHandlingItems = shipment.special_handling.map((h) => ({
    type: h.handling_type,
    label: h.handling_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <CheckoutLayout
      currentStep="rates"
      completedStepIndex={0}
      onPrevious={handleBack}
      onNext={handleConfirm}
      onSaveDraft={handleSaveDraft}
      onStartOver={handleStartOver}
      isLoading={isSelecting}
      nextDisabled={!selectedQuoteId}
      showSaveDraft
      showStartOver
    >
      <div className="space-y-6">
        {/* Shipment Summary Bar */}
        <ShipmentSummaryBar
          origin={shipment.sender_address}
          destination={shipment.recipient_address}
          packages={packageSummary}
          specialHandling={specialHandlingItems}
          declaredValue={
            shipment.declared_value
              ? { amount: shipment.declared_value, currency: "USD" }
              : undefined
          }
          editHref="/shipments/new"
        />

        {/* Pricing Grid */}
        {quoteData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No Rates Available</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                We couldn&apos;t find any shipping rates for your shipment. Please check your
                package details and try again.
              </p>
              <Button className="mt-6" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PricingGrid
            categories={quoteData}
            selectedQuoteId={selectedQuoteId}
            onSelectQuote={handleSelectQuote}
            onConfirm={handleConfirm}
            isConfirming={isSelecting}
          />
        )}
      </div>
    </CheckoutLayout>
  );
}
