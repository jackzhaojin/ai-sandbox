/**
 * Global type definitions for the B2B Postal Checkout application
 */

// Address type for origin/destination
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// Package configuration
export interface PackageConfig {
  weight: number;
  weightUnit: 'lb' | 'kg';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  dimensionUnit: 'in' | 'cm';
  packageType: 'box' | 'envelope' | 'tube' | 'pallet';
  declaredValue?: number;
  currency?: string;
}

// Carrier rate quote
export interface CarrierRate {
  id: string;
  carrier: string;
  service: string;
  deliveryDate?: string;
  deliveryDays?: number;
  basePrice: number;
  totalPrice: number;
  currency: string;
}

// B2B Payment method
export type PaymentMethod = 
  | 'corporate_card'
  | 'ach_transfer'
  | 'net_30'
  | 'net_60'
  | 'prepaid_account';

// Payment validation result
export interface PaymentValidation {
  valid: boolean;
  method: PaymentMethod;
  error?: string;
}

// Pickup slot
export interface PickupSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

// Shipment status
export type ShipmentStatus = 
  | 'draft'
  | 'quoted'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

// Full shipment data
export interface Shipment {
  id: string;
  referenceNumber: string;
  status: ShipmentStatus;
  origin: Address;
  destination: Address;
  package: PackageConfig;
  selectedRate?: CarrierRate;
  paymentMethod?: PaymentMethod;
  pickupSlot?: PickupSlot;
  createdAt: string;
  updatedAt: string;
}
