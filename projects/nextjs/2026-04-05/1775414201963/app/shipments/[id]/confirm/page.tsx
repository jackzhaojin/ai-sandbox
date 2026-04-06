"use client";

import { SuccessBanner } from "@/components/confirmation/SuccessBanner";
import {
  ShipmentReferenceSection,
  PickupConfirmationSection,
  DeliveryInformationSection,
  TrackingInformationSection,
  PackageDocumentationSection,
  ContactInformationSection,
  NextStepsChecklistSection,
  AdditionalActionsSection,
  RecentShipments,
} from "@/components/confirmation";

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
  documentation: {
    shippingLabelStatus: "ready" as const,
    shippingLabelUrl: "/labels/shipping-label-123.pdf",
    documents: [
      {
        id: "doc-1",
        type: "shipping_label" as const,
        name: "Shipping Label",
        status: "ready" as const,
        description: "Master shipping label for pallet",
        downloadUrl: "/labels/shipping-label-123.pdf",
      },
      {
        id: "doc-2",
        type: "commercial_invoice" as const,
        name: "Commercial Invoice",
        status: "ready" as const,
        description: "Required for B2B delivery",
        downloadUrl: "/docs/commercial-invoice-123.pdf",
      },
      {
        id: "doc-3",
        type: "hazmat_form" as const,
        name: "Hazmat Declaration",
        status: "not_required" as const,
        description: "Only required for hazardous materials",
      },
    ],
    calendarEventAvailable: true,
    calendarEventUrl: "/calendar/pickup-123.ics",
  },
  contact: {
    customerService: {
      phone: "1-800-B2B-SHIP",
      email: "support@b2bshipping.com",
      chatAvailable: true,
      chatUrl: "https://chat.b2bshipping.com",
      averageResponseTime: "2 min",
    },
    accountManager: {
      name: "Michael Chen",
      title: "Senior Account Manager",
      phone: "(555) 987-6543",
      email: "michael.chen@b2bshipping.com",
      businessHours: "Mon-Fri 8am-6pm",
      timezone: "EST",
    },
    claimsDepartment: {
      phone: "1-800-B2B-CLAIM",
      email: "claims@b2bshipping.com",
      portalUrl: "https://claims.b2bshipping.com",
      businessHours: "Mon-Fri 9am-5pm EST",
    },
    emergencyContact: {
      phone: "1-800-B2B-EMRG",
      email: "emergency@b2bshipping.com",
      emergencyDescription: "For urgent issues during transit: delays, damages, or driver issues",
    },
  },
  nextSteps: {
    beforePickupTasks: [
      {
        id: "task-1",
        label: "Print shipping labels",
        description: "Print and attach all required labels to packages",
        status: "pending" as const,
        priority: "high" as const,
      },
      {
        id: "task-2",
        label: "Prepare documentation",
        description: "Have commercial invoice and BOL ready for driver",
        status: "pending" as const,
        priority: "high" as const,
      },
      {
        id: "task-3",
        label: "Secure loading area",
        description: "Ensure dock bay is clear and accessible",
        status: "pending" as const,
        priority: "medium" as const,
      },
      {
        id: "task-4",
        label: "Notify security",
        description: "Inform security of scheduled pickup (optional)",
        status: "optional" as const,
      },
    ],
    afterPickupTasks: [
      {
        id: "task-5",
        label: "Track shipment",
        description: "Monitor progress through tracking portal",
        status: "pending" as const,
        priority: "medium" as const,
      },
      {
        id: "task-6",
        label: "Confirm delivery",
        description: "Verify delivery and inspect for damages",
        status: "pending" as const,
        priority: "medium" as const,
      },
      {
        id: "task-7",
        label: "Rate experience",
        description: "Provide feedback on shipping experience (optional)",
        status: "optional" as const,
      },
    ],
  },
  additionalActions: {
    insuranceAdded: false,
    insuranceOptions: [
      {
        id: "ins-basic",
        name: "Basic Coverage",
        coverage: 1000,
        cost: 5.99,
        recommended: false,
      },
      {
        id: "ins-standard",
        name: "Standard Coverage",
        coverage: 5000,
        cost: 14.99,
        recommended: true,
      },
      {
        id: "ins-premium",
        name: "Premium Coverage",
        coverage: 25000,
        cost: 49.99,
        recommended: false,
      },
    ],
    canChangeDeliveryAddress: true,
    currentDeliveryAddress: "456 Commerce Blvd, Austin, TX 78701",
    holdAtLocationAvailable: true,
    holdLocations: [
      {
        id: "loc-1",
        name: "FedEx Ship Center",
        address: "123 Main St, Austin, TX 78701",
        hours: "Mon-Fri 8am-8pm, Sat 9am-5pm",
        distance: "0.8 mi",
      },
      {
        id: "loc-2",
        name: "FedEx Authorized ShipCenter",
        address: "456 Oak Ave, Austin, TX 78702",
        hours: "Mon-Fri 9am-7pm, Sat 10am-4pm",
        distance: "1.2 mi",
      },
      {
        id: "loc-3",
        name: "Walgreens",
        address: "789 Pine Rd, Austin, TX 78703",
        hours: "24 hours",
        distance: "2.1 mi",
      },
    ],
  },
  recentShipments: [
    {
      confirmationNumber: "B2B-2024-ABC123",
      date: "2024-04-01",
      origin: "Austin, TX",
      destination: "Houston, TX",
      status: "delivered",
      carrier: "FedEx Freight",
      service: "Priority LTL",
      deliveryDate: "2024-04-03",
      viewUrl: "/shipments/B2B-2024-ABC123",
    },
    {
      confirmationNumber: "B2B-2024-DEF456",
      date: "2024-03-28",
      origin: "Austin, TX",
      destination: "Dallas, TX",
      status: "in_transit",
      carrier: "UPS Freight",
      service: "LTL Standard",
      deliveryDate: "2024-04-05",
      viewUrl: "/shipments/B2B-2024-DEF456",
    },
    {
      confirmationNumber: "B2B-2024-GHI789",
      date: "2024-03-25",
      origin: "Austin, TX",
      destination: "San Antonio, TX",
      status: "delivered",
      carrier: "FedEx Freight",
      service: "Economy LTL",
      deliveryDate: "2024-03-27",
      viewUrl: "/shipments/B2B-2024-GHI789",
    },
  ],
};

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
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

        {/* Package Documentation Section */}
        <PackageDocumentationSection
          shippingLabelStatus={testData.documentation.shippingLabelStatus}
          shippingLabelUrl={testData.documentation.shippingLabelUrl}
          documents={testData.documentation.documents}
          calendarEventAvailable={testData.documentation.calendarEventAvailable}
          calendarEventUrl={testData.documentation.calendarEventUrl}
          pickupDate={testData.pickup.date}
          pickupTimeWindow={testData.pickup.timeWindow}
          onDownloadDocument={(id, type) => console.log("Download document:", id, type)}
          onDownloadCalendar={() => console.log("Download calendar event")}
        />

        {/* Contact Information Section */}
        <ContactInformationSection
          customerService={testData.contact.customerService}
          accountManager={testData.contact.accountManager}
          claimsDepartment={testData.contact.claimsDepartment}
          emergencyContact={testData.contact.emergencyContact}
          onStartChat={() => console.log("Start chat clicked")}
          onContactAccountManager={() => console.log("Contact account manager clicked")}
        />

        {/* Next Steps Checklist Section */}
        <NextStepsChecklistSection
          beforePickupTasks={testData.nextSteps.beforePickupTasks}
          afterPickupTasks={testData.nextSteps.afterPickupTasks}
          pickupDate={testData.pickup.date}
          pickupTimeWindow={testData.pickup.timeWindow}
          estimatedDelivery={testData.delivery.estimatedDelivery}
          onTaskToggle={(id, completed) => console.log("Task toggled:", id, completed)}
          onBeforePickupComplete={() => console.log("All before-pickup tasks completed")}
        />

        {/* Additional Actions Section */}
        <AdditionalActionsSection
          insuranceAdded={testData.additionalActions.insuranceAdded}
          insuranceOptions={testData.additionalActions.insuranceOptions}
          canChangeDeliveryAddress={testData.additionalActions.canChangeDeliveryAddress}
          currentDeliveryAddress={testData.additionalActions.currentDeliveryAddress}
          holdAtLocationAvailable={testData.additionalActions.holdAtLocationAvailable}
          holdLocations={testData.additionalActions.holdLocations}
          onAddInsurance={() => console.log("Add insurance clicked")}
          onChangeDeliveryAddress={() => console.log("Change delivery address clicked")}
          onHoldAtLocation={() => console.log("Hold at location clicked")}
          onScheduleAnother={() => console.log("Schedule another clicked")}
          onRepeatShipment={() => console.log("Repeat shipment clicked")}
          onSelectInsuranceOption={(id) => console.log("Insurance option selected:", id)}
          onSelectHoldLocation={(id) => console.log("Hold location selected:", id)}
        />

        {/* Recent Shipments */}
        <RecentShipments
          shipments={testData.recentShipments}
          onViewShipment={(id) => console.log("View shipment:", id)}
          onRepeatShipment={(id) => console.log("Repeat shipment:", id)}
          viewAllUrl="/shipments"
        />
      </div>
    </div>
  );
}
