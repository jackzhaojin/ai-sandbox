"use client";

import { SuccessBanner } from "@/components/confirmation/SuccessBanner";
import {
  ShipmentReferenceSection,
  PickupConfirmationSection,
  DeliveryInformationSection,
  TrackingInformationSection,
} from "@/components/confirmation/ConfirmationSections";

// Test data for confirmation page
const testData = {
  confirmationNumber: "B2B-2024-XK9P7M",
  customerReference: "PO-12345-ABC",
  carrier: "FedEx Freight",
  service: "Priority LTL",
  totalCost: 284.5,
  pickup: {
    date: "2024-04-08",
    timeWindow: {
      start: "9:00 AM",
      end: "12:00 PM",
    },
    status: "confirmed" as const,
    locationType: "Warehouse with Loading Dock",
    dockNumber: "Bay 3",
    specialInstructions: "Ring bell at front desk for dock access. Forklift available.",
  },
  delivery: {
    estimatedDelivery: "2024-04-10",
    address: {
      line1: "456 Commerce Blvd",
      line2: "Suite 200",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "USA",
    },
    contactName: "Sarah Johnson",
    contactPhone: "(512) 555-0123",
    contactEmail: "sarah.j@example.com",
    deliveryInstructions: "Delivery to receiving department. Call 30 minutes before arrival.",
  },
  tracking: {
    trackingNumberAvailable: false,
    trackingAvailableAt: "in 2-4 hours",
    carrierTrackingUrl: "https://www.fedex.com/apps/fedextrack",
    carrierName: "FedEx",
    notificationPreference: "both" as const,
    notificationEmail: "shipper@example.com",
    notificationPhone: "(555) 123-4567",
  },
};

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Banner */}
        <SuccessBanner
          confirmationNumber={testData.confirmationNumber}
          successMessage="Shipment Confirmed!"
          subtitle="Your shipment has been successfully booked and confirmed."
        />

        {/* Shipment Reference Section */}
        <ShipmentReferenceSection
          confirmationNumber={testData.confirmationNumber}
          customerReference={testData.customerReference}
          carrier={testData.carrier}
          service={testData.service}
          totalCost={testData.totalCost}
        />

        {/* Pickup Confirmation Section */}
        <PickupConfirmationSection
          pickupDate={testData.pickup.date}
          timeWindow={testData.pickup.timeWindow}
          status={testData.pickup.status}
          locationType={testData.pickup.locationType}
          dockNumber={testData.pickup.dockNumber}
          specialInstructions={testData.pickup.specialInstructions}
        />

        {/* Delivery Information Section */}
        <DeliveryInformationSection
          estimatedDelivery={testData.delivery.estimatedDelivery}
          deliveryAddress={testData.delivery.address}
          contactName={testData.delivery.contactName}
          contactPhone={testData.delivery.contactPhone}
          contactEmail={testData.delivery.contactEmail}
          deliveryInstructions={testData.delivery.deliveryInstructions}
        />

        {/* Tracking Information Section */}
        <TrackingInformationSection
          trackingNumberAvailable={testData.tracking.trackingNumberAvailable}
          trackingAvailableAt={testData.tracking.trackingAvailableAt}
          carrierTrackingUrl={testData.tracking.carrierTrackingUrl}
          carrierName={testData.tracking.carrierName}
          notificationPreference={testData.tracking.notificationPreference}
          notificationEmail={testData.tracking.notificationEmail}
          notificationPhone={testData.tracking.notificationPhone}
          onUpdatePreferences={() => console.log("Update preferences clicked")}
        />
      </div>
    </div>
  );
}
