"use client";

import * as React from "react";
import { ShippingLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PaymentMethodSelector,
  PaymentMethodOption,
} from "@/components/payment/PaymentMethodSelector";
import {
  PurchaseOrderForm,
  PurchaseOrderFormData,
} from "@/components/payment/PurchaseOrderForm";

const checkoutSteps = [
  { id: "sender", label: "Sender", description: "Your address" },
  { id: "recipient", label: "Recipient", description: "Their address" },
  { id: "package", label: "Package", description: "Item details" },
  { id: "shipping", label: "Shipping", description: "Select service" },
  { id: "review", label: "Review", description: "Confirm order" },
  { id: "payment", label: "Payment", description: "Pay securely" },
];

export default function PaymentDemoPage() {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethodOption | undefined>();
  const [poFormData, setPoFormData] = React.useState<Partial<PurchaseOrderFormData>>({});
  const [poFormValid, setPoFormValid] = React.useState(false);

  const shipmentTotal = 150.75;

  const handlePoSubmit = (data: PurchaseOrderFormData) => {
    console.log("PO Form submitted:", data);
    alert(`PO Form submitted!\n${JSON.stringify(data, null, 2)}`);
  };

  const handlePoChange = (data: Partial<PurchaseOrderFormData>, isValid: boolean) => {
    setPoFormData(data);
    setPoFormValid(isValid);
  };

  return (
    <ShippingLayout
      title="Payment Method Demo"
      description="Test PaymentMethodSelector and PurchaseOrderForm components"
      steps={checkoutSteps}
      currentStep="payment"
      completedSteps={["sender", "recipient", "package", "shipping"]}
      showProgress
      userInfo={{
        name: "John Doe",
        email: "john@example.com",
        organizationName: "Acme Corp",
      }}
    >
      <div className="space-y-8">
        {/* Payment Method Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
            <CardDescription>
              Choose how you want to pay for this shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              value={selectedMethod}
              onChange={setSelectedMethod}
              shipmentTotal={shipmentTotal}
              currency="USD"
            />
          </CardContent>
        </Card>

        {/* Purchase Order Form */}
        {selectedMethod === "purchase_order" && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
              <CardDescription>
                Enter your PO information (Minimum amount: ${shipmentTotal.toFixed(2)})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PurchaseOrderForm
                minAmount={shipmentTotal}
                currency="USD"
                onSubmit={handlePoSubmit}
                onChange={handlePoChange}
              />
            </CardContent>
          </Card>
        )}

        {/* Other payment methods placeholder */}
        {selectedMethod && selectedMethod !== "purchase_order" && (
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">
                {selectedMethod.replace(/_/g, " ")}
              </CardTitle>
              <CardDescription>
                Form for {selectedMethod.replace(/_/g, " ")} will be implemented in future steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Form coming in Step 12-14</p>
                <p className="text-sm mt-2">Selected: {selectedMethod}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono bg-muted p-4 rounded-lg">
              <p>Selected Method: {selectedMethod || "none"}</p>
              <p>PO Form Valid: {poFormValid ? "Yes" : "No"}</p>
              <p>PO Form Data:</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(poFormData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShippingLayout>
  );
}
