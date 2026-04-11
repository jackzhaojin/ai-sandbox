// Type definitions for B2B Postal Checkout Flow

export interface Address {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PackageConfig {
  weight: number
  length: number
  width: number
  height: number
}

export interface Shipment {
  id?: string
  origin: Address
  destination: Address
  package: PackageConfig
  createdAt?: string
  updatedAt?: string
}
