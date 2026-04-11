// Form Configuration Types for B2B Postal Checkout

export interface PackageType {
  id: string
  name: string
  description: string
  maxWeight: number // in kg
  maxLength: number // in cm
  maxWidth: number // in cm
  maxHeight: number // in cm
  icon?: string
}

export interface SpecialHandlingOption {
  id: string
  name: string
  description: string
  fee: number // in USD
  requiresSignature?: boolean
}

export interface DeliveryPreference {
  id: string
  name: string
  description: string
  fee: number // in USD
  estimatedDays?: number
}

export interface ContentsCategory {
  id: string
  name: string
  description: string
  requiresCustomsDocs?: boolean
  restricted?: boolean
}

export interface Country {
  code: string
  name: string
  currency: string
  states: State[]
  phonePrefix: string
}

export interface State {
  code: string
  name: string
}

export interface Industry {
  id: string
  name: string
  description?: string
}

export interface BusinessType {
  id: string
  name: string
  description: string
  requiresTaxId?: boolean
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  exchangeRate: number // relative to USD
}

export interface ServiceLevelPreference {
  id: string
  name: string
  description: string
  estimatedDays: number
  priceMultiplier: number
}

export interface ValidationRule {
  field: string
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'phone'
  value?: number | string
  message: string
}

export interface FormMetadata {
  version: string
  lastUpdated: string
  supportedCountries: string[]
  maxPackageWeight: number
  maxPackageDimensions: {
    length: number
    width: number
    height: number
  }
}

export interface FormConfig {
  packageTypes: PackageType[]
  specialHandling: SpecialHandlingOption[]
  deliveryPreferences: DeliveryPreference[]
  contentsCategories: ContentsCategory[]
  countries: Country[]
  industries: Industry[]
  businessTypes: BusinessType[]
  currencyOptions: CurrencyOption[]
  serviceLevelPreferences: ServiceLevelPreference[]
  validationRules: ValidationRule[]
  metadata: FormMetadata
}

// Valid section names for filtering
export type FormConfigSection =
  | 'packageTypes'
  | 'specialHandling'
  | 'deliveryPreferences'
  | 'contentsCategories'
  | 'countries'
  | 'industries'
  | 'businessTypes'
  | 'currencyOptions'
  | 'serviceLevelPreferences'
  | 'validationRules'
  | 'metadata'
