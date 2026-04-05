/**
 * B2B Postal Checkout Flow - Shipment Presets
 * Pre-configured shipment templates for common B2B shipping scenarios
 */

import type { ShipmentDetailsFormData } from "@/lib/validation/shipment-details-schema";
import {
  defaultAddress,
  defaultSpecialHandling,
  defaultDeliveryPreferences,
  defaultHazmat,
} from "@/lib/validation/shipment-details-schema";

export interface ShipmentPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "documents" | "electronics" | "industrial" | "medical" | "events";
  data: Partial<ShipmentDetailsFormData>;
}

export const shipmentPresets: ShipmentPreset[] = [
  {
    id: "standard-office-documents",
    name: "Standard Office Documents",
    description: "Letters, contracts, and standard paperwork",
    icon: "FileText",
    category: "documents",
    data: {
      packages: [
        {
          id: "1",
          packageType: "envelope",
          length: 12,
          width: 9,
          height: 0.5,
          dimensionsUnit: "in",
          weight: 0.5,
          weightUnit: "lbs",
          declaredValue: 50,
          contentsDescription: "Business documents and contracts",
        },
      ],
      specialHandling: [
        { type: "fragile", isSelected: false, instructions: "" },
        { type: "hazardous", isSelected: false, instructions: "" },
        { type: "temperature_controlled", isSelected: false, instructions: "" },
        { type: "signature_required", isSelected: true, instructions: "" },
        { type: "adult_signature", isSelected: false, instructions: "" },
        { type: "hold_for_pickup", isSelected: false, instructions: "" },
        { type: "appointment_delivery", isSelected: false, instructions: "" },
        { type: "dry_ice", isSelected: false, instructions: "" },
      ],
      deliveryPreferences: {
        ...defaultDeliveryPreferences,
        signatureRequired: true,
      },
      hazmat: defaultHazmat,
    },
  },
  {
    id: "electronics-equipment",
    name: "Electronics Equipment",
    description: "Computers, servers, and electronic devices",
    icon: "Cpu",
    category: "electronics",
    data: {
      packages: [
        {
          id: "1",
          packageType: "large_box",
          length: 24,
          width: 18,
          height: 12,
          dimensionsUnit: "in",
          weight: 25,
          weightUnit: "lbs",
          declaredValue: 2000,
          contentsDescription: "Electronic equipment - handle with care",
        },
      ],
      specialHandling: [
        { type: "fragile", isSelected: true, instructions: "Handle with care - sensitive electronic components" },
        { type: "hazardous", isSelected: false, instructions: "" },
        { type: "temperature_controlled", isSelected: false, instructions: "" },
        { type: "signature_required", isSelected: true, instructions: "" },
        { type: "adult_signature", isSelected: false, instructions: "" },
        { type: "hold_for_pickup", isSelected: false, instructions: "" },
        { type: "appointment_delivery", isSelected: false, instructions: "" },
        { type: "dry_ice", isSelected: false, instructions: "" },
      ],
      deliveryPreferences: {
        ...defaultDeliveryPreferences,
        signatureRequired: true,
      },
      hazmat: defaultHazmat,
    },
  },
  {
    id: "industrial-parts",
    name: "Industrial Parts",
    description: "Machinery parts, tools, and hardware",
    icon: "Wrench",
    category: "industrial",
    data: {
      packages: [
        {
          id: "1",
          packageType: "medium_box",
          length: 18,
          width: 14,
          height: 10,
          dimensionsUnit: "in",
          weight: 15,
          weightUnit: "lbs",
          declaredValue: 500,
          contentsDescription: "Industrial machinery parts",
        },
      ],
      specialHandling: [
        { type: "fragile", isSelected: false, instructions: "" },
        { type: "hazardous", isSelected: false, instructions: "" },
        { type: "temperature_controlled", isSelected: false, instructions: "" },
        { type: "signature_required", isSelected: true, instructions: "" },
        { type: "adult_signature", isSelected: false, instructions: "" },
        { type: "hold_for_pickup", isSelected: false, instructions: "" },
        { type: "appointment_delivery", isSelected: false, instructions: "" },
        { type: "dry_ice", isSelected: false, instructions: "" },
      ],
      deliveryPreferences: {
        ...defaultDeliveryPreferences,
        signatureRequired: true,
      },
      hazmat: defaultHazmat,
    },
  },
  {
    id: "medical-supplies",
    name: "Medical Supplies",
    description: "Healthcare equipment and supplies",
    icon: "Stethoscope",
    category: "medical",
    data: {
      packages: [
        {
          id: "1",
          packageType: "small_box",
          length: 16,
          width: 12,
          height: 8,
          dimensionsUnit: "in",
          weight: 8,
          weightUnit: "lbs",
          declaredValue: 1500,
          contentsDescription: "Medical supplies and equipment",
        },
      ],
      specialHandling: [
        { type: "fragile", isSelected: true, instructions: "Medical equipment - handle with extreme care" },
        { type: "hazardous", isSelected: false, instructions: "" },
        { type: "temperature_controlled", isSelected: true, instructions: "Maintain room temperature" },
        { type: "signature_required", isSelected: true, instructions: "" },
        { type: "adult_signature", isSelected: true, instructions: "" },
        { type: "hold_for_pickup", isSelected: false, instructions: "" },
        { type: "appointment_delivery", isSelected: false, instructions: "" },
        { type: "dry_ice", isSelected: false, instructions: "" },
      ],
      deliveryPreferences: {
        ...defaultDeliveryPreferences,
        signatureRequired: true,
        adultSignatureRequired: true,
      },
      hazmat: defaultHazmat,
    },
  },
  {
    id: "trade-show-materials",
    name: "Trade Show Materials",
    description: "Banners, displays, and promotional items",
    icon: "Presentation",
    category: "events",
    data: {
      packages: [
        {
          id: "1",
          packageType: "crate",
          length: 48,
          width: 6,
          height: 6,
          dimensionsUnit: "in",
          weight: 5,
          weightUnit: "lbs",
          declaredValue: 800,
          contentsDescription: "Trade show banners and display materials",
        },
      ],
      specialHandling: [
        { type: "fragile", isSelected: true, instructions: "Do not bend - contains rolled banners and graphics" },
        { type: "hazardous", isSelected: false, instructions: "" },
        { type: "temperature_controlled", isSelected: false, instructions: "" },
        { type: "signature_required", isSelected: true, instructions: "" },
        { type: "adult_signature", isSelected: false, instructions: "" },
        { type: "hold_for_pickup", isSelected: false, instructions: "" },
        { type: "appointment_delivery", isSelected: true, instructions: "Deliver during business hours for event setup" },
        { type: "dry_ice", isSelected: false, instructions: "" },
      ],
      deliveryPreferences: {
        ...defaultDeliveryPreferences,
        signatureRequired: true,
      },
      hazmat: defaultHazmat,
    },
  },
];

// Helper function to get preset by ID
export function getPresetById(id: string): ShipmentPreset | undefined {
  return shipmentPresets.find((preset) => preset.id === id);
}

// Helper function to apply preset to form data
export function applyPreset(
  presetId: string,
  currentData: Partial<ShipmentDetailsFormData>
): Partial<ShipmentDetailsFormData> {
  const preset = getPresetById(presetId);
  if (!preset) return currentData;

  return {
    ...currentData,
    ...preset.data,
    presetId: preset.id,
  };
}

// Package type configurations
export interface PackageTypeConfig {
  value: "envelope" | "small_box" | "medium_box" | "large_box" | "pallet" | "crate" | "multiple_pieces";
  label: string;
  description: string;
  icon: string;
  maxWeight: number;
  maxDimensions: {
    length: number;
    width: number;
    height: number;
  };
  typicalUses: string[];
}

export const packageTypeConfigs: PackageTypeConfig[] = [
  {
    value: "envelope",
    label: "Envelope",
    description: "Flat document mailer for letters and documents",
    icon: "Mail",
    maxWeight: 2,
    maxDimensions: { length: 15, width: 12, height: 0.75 },
    typicalUses: ["Documents", "Letters", "Photos", "Small flat items"],
  },
  {
    value: "small_box",
    label: "Small Box",
    description: "Compact box for small items and samples",
    icon: "Package",
    maxWeight: 10,
    maxDimensions: { length: 12, width: 10, height: 8 },
    typicalUses: ["Small parts", "Samples", "Accessories", "Jewelry"],
  },
  {
    value: "medium_box",
    label: "Medium Box",
    description: "Standard box for most shipping needs",
    icon: "Package",
    maxWeight: 30,
    maxDimensions: { length: 18, width: 14, height: 12 },
    typicalUses: ["Clothing", "Electronics", "Books", "Household items"],
  },
  {
    value: "large_box",
    label: "Large Box",
    description: "Oversized box for bulky items",
    icon: "Package",
    maxWeight: 50,
    maxDimensions: { length: 24, width: 18, height: 16 },
    typicalUses: ["Large electronics", "Multiple items", "Bulk products", "Equipment"],
  },
  {
    value: "pallet",
    label: "Pallet",
    description: "Standard pallet for freight shipments",
    icon: "Container",
    maxWeight: 1000,
    maxDimensions: { length: 48, width: 40, height: 60 },
    typicalUses: ["Bulk freight", "Stacked boxes", "Heavy machinery", "LTL shipments"],
  },
  {
    value: "crate",
    label: "Crate",
    description: "Wooden crate for fragile or high-value items",
    icon: "Container",
    maxWeight: 500,
    maxDimensions: { length: 36, width: 24, height: 30 },
    typicalUses: ["Fragile items", "Artwork", "High-value goods", "Industrial parts"],
  },
  {
    value: "multiple_pieces",
    label: "Multiple Pieces",
    description: "Ship multiple packages together",
    icon: "Boxes",
    maxWeight: 200,
    maxDimensions: { length: 24, width: 18, height: 16 },
    typicalUses: ["Multi-piece orders", "Kit shipments", "Consolidated packages"],
  },
];

// Special handling configurations
export interface SpecialHandlingConfig {
  value: string;
  label: string;
  description: string;
  fee: number;
  feeType: "flat" | "percentage";
  icon: string;
  requiresInstructions: boolean;
}

export const specialHandlingConfigs: SpecialHandlingConfig[] = [
  {
    value: "fragile",
    label: "Fragile",
    description: "Extra care for delicate items",
    fee: 5.99,
    feeType: "flat",
    icon: "AlertTriangle",
    requiresInstructions: true,
  },
  {
    value: "hazardous",
    label: "Hazardous Materials",
    description: "Dangerous goods requiring special handling",
    fee: 25.0,
    feeType: "flat",
    icon: "Flame",
    requiresInstructions: false,
  },
  {
    value: "temperature_controlled",
    label: "Temperature Controlled",
    description: "Climate-sensitive shipments",
    fee: 15.0,
    feeType: "flat",
    icon: "Thermometer",
    requiresInstructions: true,
  },
  {
    value: "signature_required",
    label: "Signature Required",
    description: "Recipient signature on delivery",
    fee: 3.99,
    feeType: "flat",
    icon: "PenTool",
    requiresInstructions: false,
  },
  {
    value: "adult_signature",
    label: "Adult Signature (21+)",
    description: "Adult signature required",
    fee: 6.99,
    feeType: "flat",
    icon: "UserCheck",
    requiresInstructions: false,
  },
  {
    value: "hold_for_pickup",
    label: "Hold for Pickup",
    description: "Hold at facility for collection",
    fee: 0,
    feeType: "flat",
    icon: "Store",
    requiresInstructions: false,
  },
  {
    value: "appointment_delivery",
    label: "Appointment Delivery",
    description: "Scheduled delivery time",
    fee: 12.0,
    feeType: "flat",
    icon: "CalendarClock",
    requiresInstructions: true,
  },
  {
    value: "dry_ice",
    label: "Dry Ice",
    description: "Shipments containing dry ice (UN1845)",
    fee: 8.5,
    feeType: "flat",
    icon: "Snowflake",
    requiresInstructions: true,
  },
];

// Delivery preference configurations
export interface DeliveryPreferenceConfig {
  value: string;
  label: string;
  description: string;
  fee: number;
  icon: string;
}

export const deliveryPreferenceConfigs: DeliveryPreferenceConfig[] = [
  {
    value: "saturdayDelivery",
    label: "Saturday Delivery",
    description: "Deliver on Saturday",
    fee: 16.0,
    icon: "Calendar",
  },
  {
    value: "sundayDelivery",
    label: "Sunday Delivery",
    description: "Deliver on Sunday",
    fee: 16.0,
    icon: "Sun",
  },
  {
    value: "signatureRequired",
    label: "Signature Required",
    description: "Require signature on delivery",
    fee: 3.99,
    icon: "PenTool",
  },
  {
    value: "adultSignatureRequired",
    label: "Adult Signature (21+)",
    description: "Require adult signature",
    fee: 6.99,
    icon: "UserCheck",
  },
  {
    value: "leaveWithoutSignature",
    label: "Leave if No Answer",
    description: "Authority to leave package",
    fee: 0,
    icon: "DoorOpen",
  },
  {
    value: "holdAtFacility",
    label: "Hold at Facility",
    description: "Hold for customer pickup",
    fee: 0,
    icon: "Building",
  },
];

// Currency options
export const currencyOptions = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
  { value: "MXN", label: "MXN - Mexican Peso", symbol: "Mex$" },
];

// Contents categories
export const contentsCategories = [
  { value: "documents", label: "Documents & Papers" },
  { value: "electronics", label: "Electronics & Technology" },
  { value: "clothing", label: "Clothing & Textiles" },
  { value: "books", label: "Books & Media" },
  { value: "parts", label: "Parts & Components" },
  { value: "medical", label: "Medical Supplies" },
  { value: "food", label: "Food & Beverages" },
  { value: "cosmetics", label: "Cosmetics & Toiletries" },
  { value: "jewelry", label: "Jewelry & Watches" },
  { value: "art", label: "Art & Collectibles" },
  { value: "sports", label: "Sports Equipment" },
  { value: "toys", label: "Toys & Games" },
  { value: "industrial", label: "Industrial Equipment" },
  { value: "furniture", label: "Furniture & Decor" },
  { value: "other", label: "Other" },
];

// Hazmat class descriptions
export const hazmatClassDescriptions: Record<string, { label: string; description: string }> = {
  class_1: { label: "Class 1 - Explosives", description: "Explosive substances and articles" },
  class_2: { label: "Class 2 - Gases", description: "Compressed, liquefied, or dissolved gases" },
  class_3: { label: "Class 3 - Flammable Liquids", description: "Liquids with flash point below 60°C" },
  class_4: { label: "Class 4 - Flammable Solids", description: "Solid substances liable to spontaneous combustion" },
  class_5: { label: "Class 5 - Oxidizing Substances", description: "Substances that yield oxygen or other oxidizing agents" },
  class_6: { label: "Class 6 - Toxic Substances", description: "Toxic and infectious substances" },
  class_7: { label: "Class 7 - Radioactive Material", description: "Radioactive materials" },
  class_8: { label: "Class 8 - Corrosives", description: "Substances that cause visible destruction" },
  class_9: { label: "Class 9 - Miscellaneous", description: "Other dangerous substances" },
};

// Packing group descriptions
export const packingGroupDescriptions: Record<string, { label: string; description: string }> = {
  I: { label: "Packing Group I", description: "High danger - Most stringent packaging requirements" },
  II: { label: "Packing Group II", description: "Medium danger - Moderate packaging requirements" },
  III: { label: "Packing Group III", description: "Low danger - Least stringent packaging requirements" },
};
