"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { AddressInput } from "@/components/shared/AddressInput";
import { PresetSelector } from "@/components/shipments/PresetSelector";
import { PackageTypeSelector } from "@/components/shipments/PackageTypeSelector";
import { DimensionsInput } from "@/components/shipments/DimensionsInput";
import { WeightInput } from "@/components/shipments/WeightInput";
import { DeclaredValueInput } from "@/components/shipments/DeclaredValueInput";
import { SpecialHandlingSelector } from "@/components/shipments/SpecialHandlingSelector";
import { DeliveryPreferencesSelector } from "@/components/shipments/DeliveryPreferencesSelector";
import { HazmatForm } from "@/components/shipments/HazmatForm";
import { MultiPieceForm } from "@/components/shipments/MultiPieceForm";
import { PackageSummary } from "@/components/shipments/PackageSummary";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { contentsCategories } from "@/lib/data/shipment-presets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import {
  shipmentDetailsSchema,
  defaultShipmentDetails,
  type ShipmentDetailsFormData,
  type DimensionsUnit,
  type WeightUnit,
} from "@/lib/validation/shipment-details-schema";
import { applyPreset, type ShipmentPreset } from "@/lib/data/shipment-presets";
import { calculateDimensionalWeight } from "@/lib/validation/shipment-details-schema";
import { MapPin, Package, Settings, Truck, AlertTriangle, ArrowRight, Save } from "lucide-react";

// Checkout steps for the step indicator
const checkoutSteps = [
  { id: "details", label: "Shipment Details" },
  { id: "rates", label: "Select Rate" },
  { id: "payment", label: "Payment" },
  { id: "pickup", label: "Schedule Pickup" },
  { id: "review", label: "Review & Confirm" },
];

/**
 * Step 1: Shipment Details Page
 *
 * Complete shipment creation form with:
 * - Preset selector for quick configuration
 * - Origin and destination addresses
 * - Package details with multi-piece support
 * - Special handling options
 * - Delivery preferences
 * - Hazmat declaration
 * - Real-time validation
 * - Package summary sidebar
 */
export default function ShipmentDetailsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with React Hook Form
  const form = useForm<ShipmentDetailsFormData>({
    resolver: zodResolver(shipmentDetailsSchema),
    defaultValues: defaultShipmentDetails,
    mode: "onChange",
  });

  // Watch form values for summary
  const formValues = form.watch();

  // Calculate dimensional weight for the first package
  const dimensionalWeight = React.useMemo(() => {
    const pkg = formValues.packages[0];
    if (!pkg?.length || !pkg?.width || !pkg?.height) return null;
    return calculateDimensionalWeight(
      pkg.length,
      pkg.width,
      pkg.height,
      pkg.dimensionsUnit as DimensionsUnit
    );
  }, [formValues.packages]);

  // Handle preset selection
  const handlePresetSelect = React.useCallback(
    (preset: ShipmentPreset) => {
      const updatedData = applyPreset(preset.id, form.getValues());
      form.reset({ ...form.getValues(), ...updatedData });
      toast.success(`${preset.name} preset has been applied to your shipment.`);
    },
    [form]
  );

  // Handle form submission
  const onSubmit = React.useCallback(
    async (data: ShipmentDetailsFormData) => {
      setIsSubmitting(true);
      try {
        // Create shipment via API
        const response = await fetch("/api/shipments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_contact_name: data.origin.recipientName,
            sender_contact_phone: data.origin.recipientPhone,
            recipient_contact_name: data.destination.recipientName,
            recipient_contact_phone: data.destination.recipientPhone,
            package_type: data.packages[0]?.packageType,
            weight: data.packages[0]?.weight,
            length: data.packages[0]?.length,
            width: data.packages[0]?.width,
            height: data.packages[0]?.height,
            declared_value: data.packages[0]?.declaredValue,
            contents_description: data.packages[0]?.contentsDescription,
            reference_number: data.referenceNumber,
            po_number: data.poNumber,
            special_handling: data.specialHandling
              .filter((h) => h.isSelected)
              .map((h) => ({
                handling_type: h.type,
                instructions: h.instructions,
              })),
            delivery_preferences: {
              saturday_delivery: data.deliveryPreferences.saturdayDelivery,
              sunday_delivery: data.deliveryPreferences.sundayDelivery,
              signature_required: data.deliveryPreferences.signatureRequired,
              adult_signature_required: data.deliveryPreferences.adultSignatureRequired,
              leave_without_signature: data.deliveryPreferences.leaveWithoutSignature,
              delivery_instructions: data.deliveryPreferences.deliveryInstructions,
            },
            hazmat: data.hazmat.isHazmat
              ? {
                  is_hazmat: true,
                  hazmat_class: data.hazmat.hazmatClass,
                  un_number: data.hazmat.unNumber,
                  proper_shipping_name: data.hazmat.properShippingName,
                }
              : undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to create shipment");
        }

        const result = await response.json();
        
        toast.success("Your shipment has been saved. Proceeding to rate selection.");

        // Navigate to rate selection (Step 2)
        router.push(`/shipments/${result.data.shipment.id}/rates`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create shipment");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  // Handle save as draft
  const handleSaveDraft = React.useCallback(async () => {
    const data = form.getValues();
    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_contact_name: data.origin.recipientName,
          recipient_contact_name: data.destination.recipientName,
          reference_number: data.referenceNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const result = await response.json();
      
      toast.success("Your shipment has been saved as a draft.");
    } catch (error) {
      toast.error("Failed to save draft");
    }
  }, [form]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Create Shipment</h1>
              <p className="text-sm text-muted-foreground">
                Step 1 of 5: Enter shipment details
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <StepIndicator
            steps={checkoutSteps}
            currentStep="details"
            completedSteps={[]}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preset Selector */}
            <PresetSelector
              selectedPresetId={formValues.presetId}
              onSelect={handlePresetSelect}
              disabled={isSubmitting}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="space-y-6 lg:col-span-2">
                {/* Addresses Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Addresses
                    </CardTitle>
                    <CardDescription>
                      Enter the origin and destination addresses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Origin Address */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Origin (From)</h3>
                      <AddressInput
                        value={formValues.origin}
                        onChange={(value) =>
                          form.setValue("origin", { ...formValues.origin, ...value }, {
                            shouldValidate: true,
                          })
                        }
                        showRecipient
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <Separator />

                    {/* Destination Address */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Destination (To)</h3>
                      <AddressInput
                        value={formValues.destination}
                        onChange={(value) =>
                          form.setValue(
                            "destination",
                            { ...formValues.destination, ...value },
                            { shouldValidate: true }
                          )
                        }
                        showRecipient
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Package Details Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Package Details
                    </CardTitle>
                    <CardDescription>
                      Specify package type, dimensions, and weight
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formValues.isMultiPiece ? (
                      <MultiPieceForm
                        packages={formValues.packages}
                        onChange={(packages) =>
                          form.setValue("packages", packages, { shouldValidate: true })
                        }
                        currency={formValues.currency}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <>
                        <PackageTypeSelector
                          selectedType={formValues.packages[0]?.packageType}
                          onSelect={(type) =>
                            form.setValue("packages.0.packageType", type, {
                              shouldValidate: true,
                            })
                          }
                          disabled={isSubmitting}
                        />

                        <DimensionsInput
                          length={formValues.packages[0]?.length}
                          width={formValues.packages[0]?.width}
                          height={formValues.packages[0]?.height}
                          unit={(formValues.packages[0]?.dimensionsUnit as DimensionsUnit) || "in"}
                          onChange={(dims) => {
                            form.setValue("packages.0.length", dims.length ?? 0, {
                              shouldValidate: true,
                            });
                            form.setValue("packages.0.width", dims.width ?? 0, {
                              shouldValidate: true,
                            });
                            form.setValue("packages.0.height", dims.height ?? 0, {
                              shouldValidate: true,
                            });
                            form.setValue("packages.0.dimensionsUnit", dims.unit, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                          dimensionalWeight={dimensionalWeight}
                        />

                        <WeightInput
                          weight={formValues.packages[0]?.weight}
                          unit={(formValues.packages[0]?.weightUnit as WeightUnit) || "lbs"}
                          dimensionalWeight={dimensionalWeight}
                          onChange={(weight) => {
                            form.setValue("packages.0.weight", weight.weight ?? 0, {
                              shouldValidate: true,
                            });
                            form.setValue("packages.0.weightUnit", weight.unit, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                        />

                        <DeclaredValueInput
                          value={formValues.packages[0]?.declaredValue}
                          currency={formValues.currency}
                          onChange={(value) => {
                            form.setValue(
                              "packages.0.declaredValue",
                              value.declaredValue,
                              { shouldValidate: true }
                            );
                            form.setValue("currency", value.currency, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                        />

                        <FormField label="Contents Category">
                          <Select
                            value={formValues.packages[0]?.contentsDescription || undefined}
                            onValueChange={(value) =>
                              form.setValue("packages.0.contentsDescription", value, {
                                shouldValidate: true,
                              })
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select contents category" />
                            </SelectTrigger>
                            <SelectContent>
                              {contentsCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="Detailed Description">
                          <Input
                            placeholder="Describe the contents of your package"
                            value={formValues.packages[0]?.contentsDescription || ""}
                            onChange={(e) =>
                              form.setValue(
                                "packages.0.contentsDescription",
                                e.target.value || undefined,
                                { shouldValidate: true }
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </FormField>
                      </>
                    )}

                    {/* Multi-piece toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="multi-piece"
                        checked={formValues.isMultiPiece}
                        onChange={(e) =>
                          form.setValue("isMultiPiece", e.target.checked, {
                            shouldValidate: true,
                          })
                        }
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="multi-piece" className="text-sm">
                        This is a multi-piece shipment
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Special Handling Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Special Handling
                    </CardTitle>
                    <CardDescription>
                      Select any special handling requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpecialHandlingSelector
                      value={formValues.specialHandling}
                      onChange={(handling) =>
                        form.setValue("specialHandling", handling, {
                          shouldValidate: true,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>

                {/* Delivery Preferences Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Preferences
                    </CardTitle>
                    <CardDescription>
                      Customize delivery options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DeliveryPreferencesSelector
                      value={formValues.deliveryPreferences}
                      onChange={(prefs) =>
                        form.setValue("deliveryPreferences", prefs, {
                          shouldValidate: true,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>

                {/* Hazmat Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning-600">
                      <AlertTriangle className="h-5 w-5" />
                      Hazardous Materials
                    </CardTitle>
                    <CardDescription>
                      Declare if your shipment contains hazardous materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HazmatForm
                      value={formValues.hazmat}
                      onChange={(hazmat) =>
                        form.setValue("hazmat", hazmat, { shouldValidate: true })
                      }
                      disabled={isSubmitting}
                      errors={{
                        hazmatClass: form.formState.errors.hazmat?.hazmatClass?.message,
                        unNumber: form.formState.errors.hazmat?.unNumber?.message,
                        properShippingName: form.formState.errors.hazmat?.properShippingName?.message,
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Reference Numbers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reference Information</CardTitle>
                    <CardDescription>
                      Add reference numbers for tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Reference Number">
                      <Input
                        placeholder="e.g., INV-001234"
                        value={formValues.referenceNumber || ""}
                        onChange={(e) =>
                          form.setValue("referenceNumber", e.target.value, {
                            shouldValidate: true,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </FormField>
                    <FormField label="PO Number">
                      <Input
                        placeholder="e.g., PO-567890"
                        value={formValues.poNumber || ""}
                        onChange={(e) =>
                          form.setValue("poNumber", e.target.value, {
                            shouldValidate: true,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/shipments")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to Rates
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <PackageSummary data={formValues} />
              </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
