"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { ShippingLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CorporateAccountForm,
  CorporateAccountFormData,
} from "@/components/payment/CorporateAccountForm";
import { BillingAddressSection } from "@/components/payment/BillingAddressSection";
import { BillingContactSection } from "@/components/payment/BillingContactSection";
import { CompanyInfoSection } from "@/components/payment/CompanyInfoSection";
import { InvoicePreferencesSection } from "@/components/payment/InvoicePreferencesSection";

const checkoutSteps = [
  { id: "sender", label: "Sender", description: "Your address" },
  { id: "recipient", label: "Recipient", description: "Their address" },
  { id: "package", label: "Package", description: "Item details" },
  { id: "shipping", label: "Shipping", description: "Select service" },
  { id: "review", label: "Review", description: "Confirm order" },
  { id: "payment", label: "Payment", description: "Pay securely" },
];

// Sample origin address for "Same as Origin" demo
const sampleOriginAddress = {
  street1: "123 Business Ave",
  street2: "Suite 500",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "United States",
};

// Sample pre-filled contact
const samplePrefilledContact = {
  name: "Jane Smith",
  email: "jane.smith@acmecorp.com",
  phone: "(415) 555-0123",
};

export default function CorporatePaymentDemoPage() {
  const [corpFormData, setCorpFormData] = React.useState<Partial<CorporateAccountFormData>>({});
  const [corpFormValid, setCorpFormValid] = React.useState(false);

  // Form setup for sections that use useFormContext
  const methods = useForm({
    defaultValues: {
      billingAddress: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
      },
      billingContact: {
        name: "",
        title: "",
        phone: "",
        email: "",
        department: "",
        glCode: "",
        taxId: "",
      },
      companyInfo: {
        legalName: "",
        dba: "",
        businessType: undefined,
        industry: undefined,
        annualShippingVolume: undefined,
      },
      invoicePreferences: {
        deliveryMethod: undefined,
        format: undefined,
        frequency: undefined,
      },
    },
    mode: "onBlur",
  });

  const handleCorpSubmit = (data: CorporateAccountFormData) => {
    console.log("Corporate Account Form submitted:", data);
    alert(`Corporate Account Form submitted!\n${JSON.stringify(data, null, 2)}`);
  };

  const handleCorpChange = (data: Partial<CorporateAccountFormData>, isValid: boolean) => {
    setCorpFormData(data);
    setCorpFormValid(isValid);
  };

  return (
    <ShippingLayout
      title="Corporate Account & Payment Sections Demo"
      description="Test CorporateAccountForm and common payment sections"
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
      <FormProvider {...methods}>
        <div className="space-y-8">
          {/* Corporate Account Form */}
          <Card>
            <CardHeader>
              <CardTitle>Corporate Account Payment</CardTitle>
              <CardDescription>
                Enter your corporate account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CorporateAccountForm
                prefilledContact={samplePrefilledContact}
                onSubmit={handleCorpSubmit}
                onChange={handleCorpChange}
              />
            </CardContent>
          </Card>

          {/* Billing Address Section */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address Section</CardTitle>
              <CardDescription>
                Common section used by all payment methods with &quot;Same as Origin&quot; option
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingAddressSection
                name="billingAddress"
                originAddress={sampleOriginAddress}
              />
            </CardContent>
          </Card>

          {/* Billing Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Contact Section</CardTitle>
              <CardDescription>
                Common billing contact fields with GL Code and Tax ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingContactSection
                name="billingContact"
                defaultContact={{
                  name: "Robert Johnson",
                  title: "Finance Manager",
                  department: "Accounts Payable",
                }}
              />
            </CardContent>
          </Card>

          {/* Company Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information Section</CardTitle>
              <CardDescription>
                Company details including business type and shipping volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyInfoSection name="companyInfo" />
            </CardContent>
          </Card>

          {/* Invoice Preferences Section */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preferences Section</CardTitle>
              <CardDescription>
                Delivery method, format, and frequency preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicePreferencesSection name="invoicePreferences" />
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm font-mono bg-muted p-4 rounded-lg">
                <div>
                  <p className="font-semibold">Corporate Form Valid: {corpFormValid ? "Yes" : "No"}</p>
                  <p className="text-xs mt-1">Corporate Form Data:</p>
                  <pre className="text-xs overflow-auto mt-1">
                    {JSON.stringify(corpFormData, null, 2)}
                  </pre>
                </div>
                <div className="border-t pt-4">
                  <p className="font-semibold">Form Context Values:</p>
                  <pre className="text-xs overflow-auto mt-1">
                    {JSON.stringify(methods.watch(), null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FormProvider>
    </ShippingLayout>
  );
}
