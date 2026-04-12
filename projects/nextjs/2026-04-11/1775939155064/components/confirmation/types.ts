// Types for confirmation page components

export interface ShipmentReferenceData {
  confirmationNumber: string
  customerReference?: string
  carrier: {
    id: string
    name: string
    trackingUrlTemplate?: string
  } | null
  serviceType: {
    id: string
    name: string
    transitDaysMin: number
    transitDaysMax: number
  } | null
  totalCost: number
  currency: string
}

export interface PickupConfirmationData {
  scheduledDate: string
  timeWindow: string
  readyTime?: string
  status: 'confirmed' | 'pending' | 'in_transit' | 'completed'
  whatToExpect: string[]
}

export interface DeliveryInformationData {
  estimatedDate: string | null
  address: {
    name: string
    company?: string
    line1: string
    line2?: string
    city: string
    state: string
    postal: string
    country: string
  }
  contact: {
    name: string
    phone: string
    email?: string
  }
  specialInstructions?: string
}

export interface TrackingInformationData {
  trackingNumber: string | null
  trackingAvailableAt: string | null
  carrierTrackingUrl?: string
  smsNotifications: boolean
  emailNotifications: boolean
}

export interface PackageDocumentationData {
  labelStatus: 'generating' | 'ready' | 'error'
  requiredDocs: {
    name: string
    required: boolean
    completed: boolean
  }[]
}

export interface ContactInformationData {
  support: {
    phone: string
    email: string
    chatAvailable: boolean
    hours: string
  }
  accountManager?: {
    name: string
    email: string
    phone?: string
  }
  claims: {
    phone: string
    email: string
  }
  emergency?: {
    phone: string
    description: string
  }
}

export interface NextStepsData {
  beforePickup: {
    task: string
    completed: boolean
  }[]
  afterPickup: {
    task: string
    completed: boolean
  }[]
}

export interface AdditionalServiceData {
  id: string
  label: string
  icon: string
  description?: string
}

export interface RecentShipmentData {
  id: string
  confirmationNumber: string
  createdAt: string
  origin: {
    city: string
    state: string
  }
  destination: {
    city: string
    state: string
  }
  status: string
  carrierName: string
}

export interface ConfirmationPageData {
  shipmentId: string
  reference: ShipmentReferenceData
  pickup: PickupConfirmationData
  delivery: DeliveryInformationData
  tracking: TrackingInformationData
  documentation: PackageDocumentationData
  contacts: ContactInformationData
  nextSteps: NextStepsData
}
