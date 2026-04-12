// Types for review page components

export interface OriginData {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postal: string
  country: string
  locationType: string
  phone: string
  extension?: string
  email: string
  pickupInstructions?: string
}

export interface DestinationData {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postal: string
  country: string
  locationType: string
  phone: string
  extension?: string
  email: string
}

export interface PackageData {
  type: string
  typeLabel?: string
  length: number
  width: number
  height: number
  dimensionUnit: string
  weight: number
  weightUnit: string
  declaredValue: number
  currency: string
  contentsDescription: string
}

export interface SpecialHandlingItem {
  id: string
  name: string
  fee: number
}

export interface DeliveryPreferenceItem {
  id: string
  name: string
  fee: number
}

export interface PricingData {
  carrierName: string
  serviceName: string
  transitDaysMin: number
  transitDaysMax: number
  distance?: number
  billableWeight?: number
  dimWeight?: number
  baseRate: number
  fuelSurcharge: number
  fuelSurchargePercent: number
  insurance: number
  insuranceRate: number
  specialHandlingFees: SpecialHandlingItem[]
  specialHandlingTotal: number
  deliveryConfirmationFees: DeliveryPreferenceItem[]
  deliveryConfirmationTotal: number
  handlingFees?: number
  deliveryFees?: number
  tax: number
  taxRate: number
  total: number
  currency: string
}

export interface PaymentMethodData {
  method: string
  methodLabel: string
  // Purchase Order
  poNumber?: string
  poAmount?: number
  poExpirationDate?: string
  poApprovalContact?: string
  poDepartment?: string
  // Bill of Lading
  bolNumber?: string
  bolDate?: string
  bolShipperReference?: string
  bolFreightTerms?: string
  // Third Party
  tpAccountNumber?: string
  tpCompanyName?: string
  tpContactName?: string
  tpContactPhone?: string
  tpContactEmail?: string
  tpAuthorizationCode?: string
  // Net Terms
  netTermDays?: number
  netTermAnnualRevenue?: number
  // Corporate Account
  corpAccountNumber?: string
}

export interface BillingData {
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postal: string
    country: string
    locationType: string
    sameAsOrigin: boolean
  }
  contact: {
    name: string
    title: string
    phone: string
    email: string
    department?: string
    glCode?: string
    taxId?: string
  }
  company: {
    legalName: string
    dba?: string
    businessType: string
    industry: string
    shippingVolume?: string
  }
  invoicePreferences: {
    deliveryMethod: string
    format: string
    frequency: string
  }
}

export interface PickupSlotData {
  date: string
  timeWindow: string
  fee: number
}

export interface PickupContactData {
  primary: {
    name: string
    jobTitle?: string
    mobilePhone: string
    altPhone?: string
    email: string
    preferredMethod: string
  }
  backup: {
    name: string
    phone: string
    email?: string
  }
}

export interface PickupData {
  selectedPickup: {
    date: string
    timeSlot: PickupSlotData
    readyTime: string
  }
  location: {
    locationType: string
    locationTypeLabel: string
    dockNumber?: string
    otherDescription?: string
  }
  access: {
    requirements: string[]
    requirementLabels?: string[]
    gateCode?: string
    parkingInstructions?: string
  }
  equipment: {
    equipment: string[]
    equipmentLabels?: string[]
  }
  loading: {
    assistanceType: string
    assistanceTypeLabel: string
  }
  specialInstructions: {
    gateCode?: string
    parkingLoading?: string
    packageLocation?: string
    driverInstructions?: string
  }
  contacts: PickupContactData
  authorizedPersonnel: {
    anyoneAtLocation: boolean
    personnelList: { name: string; authorizationLevel: string; authorizationLevelLabel: string }[]
  }
  specialAuthorization?: {
    idVerificationRequired: boolean
    signatureRequired: boolean
    photoIdMatching: boolean
  }
  notifications: {
    emailReminder24h: boolean
    smsReminder2h: boolean
    callReminder30m: boolean
    driverEnroute: boolean
    pickupCompletion: boolean
    transitUpdates: boolean
  }
  fees: {
    timeSlotFee: number
    locationFee: number
    equipmentFee: number
    loadingFee: number
    accessFee: number
    totalFee: number
  }
}

export interface ReviewPageData {
  id: string
  origin: OriginData
  destination: DestinationData
  package: PackageData
  specialHandling: SpecialHandlingItem[]
  deliveryPreferences: DeliveryPreferenceItem[]
  pricing: PricingData
  payment: PaymentMethodData
  billing: BillingData
  pickup: PickupData
}

export type ReviewSectionType = 
  | 'origin' 
  | 'destination' 
  | 'package' 
  | 'pricing' 
  | 'payment' 
  | 'pickup'
