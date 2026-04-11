import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
import {
  PackageType,
  SpecialHandlingOption,
  DeliveryPreference,
  ContentsCategory,
  Country,
  Industry,
  BusinessType,
  CurrencyOption,
  ServiceLevelPreference,
  ValidationRule,
  FormMetadata,
  FormConfig,
  FormConfigSection,
} from '@/types/form-config'

// Cache duration: 24 hours in seconds
const CACHE_MAX_AGE = 86400

// Static data - Package Types (7 types with weight/dimension limits)
const packageTypes: PackageType[] = [
  {
    id: 'envelope',
    name: 'Envelope',
    description: 'Documents and flat items up to 0.5kg',
    maxWeight: 0.5,
    maxLength: 38,
    maxWidth: 30,
    maxHeight: 2,
    icon: 'envelope',
  },
  {
    id: 'small-box',
    name: 'Small Box',
    description: 'Small parcels up to 5kg',
    maxWeight: 5,
    maxLength: 30,
    maxWidth: 25,
    maxHeight: 20,
    icon: 'box',
  },
  {
    id: 'medium-box',
    name: 'Medium Box',
    description: 'Standard parcels up to 15kg',
    maxWeight: 15,
    maxLength: 45,
    maxWidth: 35,
    maxHeight: 30,
    icon: 'box',
  },
  {
    id: 'large-box',
    name: 'Large Box',
    description: 'Large parcels up to 25kg',
    maxWeight: 25,
    maxLength: 60,
    maxWidth: 50,
    maxHeight: 40,
    icon: 'box',
  },
  {
    id: 'extra-large',
    name: 'Extra Large',
    description: 'Bulky items up to 35kg',
    maxWeight: 35,
    maxLength: 80,
    maxWidth: 60,
    maxHeight: 50,
    icon: 'box',
  },
  {
    id: 'pallet',
    name: 'Pallet',
    description: 'Palletized freight up to 500kg',
    maxWeight: 500,
    maxLength: 120,
    maxWidth: 100,
    maxHeight: 150,
    icon: 'pallet',
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    description: 'Enter your own dimensions',
    maxWeight: 1000,
    maxLength: 200,
    maxWidth: 150,
    maxHeight: 150,
    icon: 'ruler',
  },
]

// Static data - Special Handling Options (8 options with fees)
const specialHandling: SpecialHandlingOption[] = [
  {
    id: 'signature-required',
    name: 'Signature Required',
    description: 'Recipient signature required upon delivery',
    fee: 3.99,
    requiresSignature: true,
  },
  {
    id: 'adult-signature',
    name: 'Adult Signature Required',
    description: 'Adult signature (21+) required',
    fee: 6.99,
    requiresSignature: true,
  },
  {
    id: 'fragile',
    name: 'Fragile Handling',
    description: 'Extra care for delicate items',
    fee: 2.99,
  },
  {
    id: 'hazardous',
    name: 'Hazardous Materials',
    description: 'Certified handling for dangerous goods',
    fee: 15.99,
  },
  {
    id: 'temperature-controlled',
    name: 'Temperature Controlled',
    description: 'Keep within specified temperature range',
    fee: 12.99,
  },
  {
    id: 'hold-for-pickup',
    name: 'Hold for Pickup',
    description: 'Hold at facility for recipient pickup',
    fee: 1.99,
  },
  {
    id: 'saturday-delivery',
    name: 'Saturday Delivery',
    description: 'Delivery on Saturday',
    fee: 16.99,
  },
  {
    id: 'insurance',
    name: 'Additional Insurance',
    description: 'Extra coverage beyond standard liability',
    fee: 5.99,
  },
]

// Static data - Delivery Preferences (6 options with fees)
const deliveryPreferences: DeliveryPreference[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Economy ground service',
    fee: 0,
    estimatedDays: 5,
  },
  {
    id: 'expedited',
    name: 'Expedited',
    description: 'Faster than standard',
    fee: 8.99,
    estimatedDays: 3,
  },
  {
    id: 'express',
    name: 'Express',
    description: '2-day delivery guarantee',
    fee: 18.99,
    estimatedDays: 2,
  },
  {
    id: 'priority',
    name: 'Priority Overnight',
    description: 'Next business day delivery',
    fee: 29.99,
    estimatedDays: 1,
  },
  {
    id: 'same-day',
    name: 'Same Day',
    description: 'Delivery by end of day',
    fee: 49.99,
    estimatedDays: 0,
  },
  {
    id: 'time-definite',
    name: 'Time Definite',
    description: 'Delivery at specified time',
    fee: 35.99,
    estimatedDays: 1,
  },
]

// Static data - Contents Categories (11 categories)
const contentsCategories: ContentsCategory[] = [
  {
    id: 'documents',
    name: 'Documents & Papers',
    description: 'Letters, contracts, legal documents',
    requiresCustomsDocs: false,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Computers, phones, accessories',
    requiresCustomsDocs: true,
  },
  {
    id: 'clothing',
    name: 'Clothing & Textiles',
    description: 'Apparel, fabrics, accessories',
    requiresCustomsDocs: false,
  },
  {
    id: 'books',
    name: 'Books & Media',
    description: 'Printed materials, media',
    requiresCustomsDocs: false,
  },
  {
    id: 'food',
    name: 'Food & Beverages',
    description: 'Perishable and non-perishable food',
    requiresCustomsDocs: true,
  },
  {
    id: 'medical',
    name: 'Medical Supplies',
    description: 'Pharmaceuticals, equipment',
    requiresCustomsDocs: true,
  },
  {
    id: 'industrial',
    name: 'Industrial Parts',
    description: 'Machinery parts, components',
    requiresCustomsDocs: true,
  },
  {
    id: 'hazardous',
    name: 'Hazardous Materials',
    description: 'Dangerous goods, chemicals',
    requiresCustomsDocs: true,
    restricted: true,
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Precious Metals',
    description: 'High-value items',
    requiresCustomsDocs: true,
  },
  {
    id: 'art',
    name: 'Artwork & Antiques',
    description: 'Fine art, collectibles',
    requiresCustomsDocs: true,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Miscellaneous items',
    requiresCustomsDocs: false,
  },
]

// Static data - Countries with states (US/CA/MX)
const countries: Country[] = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    phonePrefix: '+1',
    states: [
      { code: 'AL', name: 'Alabama' },
      { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' },
      { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' },
      { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' },
      { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' },
      { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' },
      { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' },
      { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' },
      { code: 'WY', name: 'Wyoming' },
      { code: 'DC', name: 'District of Columbia' },
      { code: 'PR', name: 'Puerto Rico' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    phonePrefix: '+1',
    states: [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'YT', name: 'Yukon' },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    currency: 'MXN',
    phonePrefix: '+52',
    states: [
      { code: 'AGU', name: 'Aguascalientes' },
      { code: 'BCN', name: 'Baja California' },
      { code: 'BCS', name: 'Baja California Sur' },
      { code: 'CAM', name: 'Campeche' },
      { code: 'CHP', name: 'Chiapas' },
      { code: 'CHH', name: 'Chihuahua' },
      { code: 'CMX', name: 'Ciudad de Mexico' },
      { code: 'COA', name: 'Coahuila' },
      { code: 'COL', name: 'Colima' },
      { code: 'DUR', name: 'Durango' },
      { code: 'GUA', name: 'Guanajuato' },
      { code: 'GRO', name: 'Guerrero' },
      { code: 'HID', name: 'Hidalgo' },
      { code: 'JAL', name: 'Jalisco' },
      { code: 'MEX', name: 'Mexico' },
      { code: 'MIC', name: 'Michoacan' },
      { code: 'MOR', name: 'Morelos' },
      { code: 'NAY', name: 'Nayarit' },
      { code: 'NLE', name: 'Nuevo Leon' },
      { code: 'OAX', name: 'Oaxaca' },
      { code: 'PUE', name: 'Puebla' },
      { code: 'QUE', name: 'Queretaro' },
      { code: 'ROO', name: 'Quintana Roo' },
      { code: 'SLP', name: 'San Luis Potosi' },
      { code: 'SIN', name: 'Sinaloa' },
      { code: 'SON', name: 'Sonora' },
      { code: 'TAB', name: 'Tabasco' },
      { code: 'TAM', name: 'Tamaulipas' },
      { code: 'TLA', name: 'Tlaxcala' },
      { code: 'VER', name: 'Veracruz' },
      { code: 'YUC', name: 'Yucatan' },
      { code: 'ZAC', name: 'Zacatecas' },
    ],
  },
]

// Static data - Industries (40+ options)
const industries: Industry[] = [
  { id: 'technology', name: 'Technology & Software' },
  { id: 'healthcare', name: 'Healthcare & Medical' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'retail', name: 'Retail & E-commerce' },
  { id: 'finance', name: 'Financial Services' },
  { id: 'education', name: 'Education' },
  { id: 'construction', name: 'Construction' },
  { id: 'transportation', name: 'Transportation & Logistics' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'energy', name: 'Energy & Utilities' },
  { id: 'hospitality', name: 'Hospitality & Tourism' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'professional-services', name: 'Professional Services' },
  { id: 'media', name: 'Media & Entertainment' },
  { id: 'telecommunications', name: 'Telecommunications' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'aerospace', name: 'Aerospace & Defense' },
  { id: 'pharmaceutical', name: 'Pharmaceutical' },
  { id: 'biotechnology', name: 'Biotechnology' },
  { id: 'chemicals', name: 'Chemicals' },
  { id: 'mining', name: 'Mining & Metals' },
  { id: 'food-beverage', name: 'Food & Beverage' },
  { id: 'apparel', name: 'Apparel & Fashion' },
  { id: 'consumer-goods', name: 'Consumer Goods' },
  { id: 'publishing', name: 'Publishing' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'legal', name: 'Legal Services' },
  { id: 'consulting', name: 'Management Consulting' },
  { id: 'nonprofit', name: 'Non-profit Organization' },
  { id: 'government', name: 'Government' },
  { id: 'arts', name: 'Arts & Culture' },
  { id: 'sports', name: 'Sports & Recreation' },
  { id: 'research', name: 'Research & Development' },
  { id: 'wholesale', name: 'Wholesale Trade' },
  { id: 'import-export', name: 'Import/Export' },
  { id: 'printing', name: 'Printing & Packaging' },
  { id: 'textiles', name: 'Textiles' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'electronics-hardware', name: 'Electronics Hardware' },
  { id: 'jewelry', name: 'Jewelry & Watches' },
  { id: 'other', name: 'Other' },
]

// Static data - Business Types (8 types)
const businessTypes: BusinessType[] = [
  {
    id: 'corporation',
    name: 'Corporation',
    description: 'Standard C-Corp or S-Corp',
    requiresTaxId: true,
  },
  {
    id: 'llc',
    name: 'Limited Liability Company (LLC)',
    description: 'LLC or professional LLC',
    requiresTaxId: true,
  },
  {
    id: 'partnership',
    name: 'Partnership',
    description: 'General or limited partnership',
    requiresTaxId: true,
  },
  {
    id: 'sole-proprietorship',
    name: 'Sole Proprietorship',
    description: 'Individual business owner',
    requiresTaxId: false,
  },
  {
    id: 'nonprofit',
    name: 'Non-profit Organization',
    description: '501(c)(3) or similar',
    requiresTaxId: true,
  },
  {
    id: 'government',
    name: 'Government Entity',
    description: 'Federal, state, or local government',
    requiresTaxId: true,
  },
  {
    id: 'cooperative',
    name: 'Cooperative',
    description: 'Cooperative business structure',
    requiresTaxId: true,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Other business structure',
    requiresTaxId: false,
  },
]

// Static data - Currency Options (USD/CAD/MXN)
const currencyOptions: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.35 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', exchangeRate: 17.5 },
]

// Static data - Service Level Preferences (4 options)
const serviceLevelPreferences: ServiceLevelPreference[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Lowest cost, longest transit',
    estimatedDays: 5,
    priceMultiplier: 0.7,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced cost and speed',
    estimatedDays: 3,
    priceMultiplier: 1.0,
  },
  {
    id: 'expedited',
    name: 'Expedited',
    description: 'Faster delivery at premium',
    estimatedDays: 2,
    priceMultiplier: 1.5,
  },
  {
    id: 'priority',
    name: 'Priority',
    description: 'Fastest available service',
    estimatedDays: 1,
    priceMultiplier: 2.5,
  },
]

// Static data - Validation Rules
const validationRules: ValidationRule[] = [
  { field: 'origin.name', type: 'required', message: 'Origin name is required' },
  { field: 'origin.line1', type: 'required', message: 'Origin address is required' },
  { field: 'origin.city', type: 'required', message: 'Origin city is required' },
  { field: 'origin.state', type: 'required', message: 'Origin state is required' },
  { field: 'origin.postalCode', type: 'required', message: 'Origin postal code is required' },
  { field: 'origin.postalCode', type: 'pattern', value: '^[A-Z0-9\\s-]{3,10}$', message: 'Invalid postal code format' },
  { field: 'destination.name', type: 'required', message: 'Destination name is required' },
  { field: 'destination.line1', type: 'required', message: 'Destination address is required' },
  { field: 'destination.city', type: 'required', message: 'Destination city is required' },
  { field: 'destination.state', type: 'required', message: 'Destination state is required' },
  { field: 'destination.postalCode', type: 'required', message: 'Destination postal code is required' },
  { field: 'contact.email', type: 'required', message: 'Email is required' },
  { field: 'contact.email', type: 'email', message: 'Invalid email format' },
  { field: 'contact.phone', type: 'required', message: 'Phone is required' },
  { field: 'package.weight', type: 'required', message: 'Package weight is required' },
  { field: 'package.weight', type: 'min', value: 0.1, message: 'Weight must be at least 0.1 kg' },
  { field: 'package.weight', type: 'max', value: 1000, message: 'Weight cannot exceed 1000 kg' },
  { field: 'package.length', type: 'required', message: 'Length is required' },
  { field: 'package.width', type: 'required', message: 'Width is required' },
  { field: 'package.height', type: 'required', message: 'Height is required' },
]

// Static data - Form Metadata
const metadata: FormMetadata = {
  version: '1.0.0',
  lastUpdated: '2026-04-11T00:00:00Z',
  supportedCountries: ['US', 'CA', 'MX'],
  maxPackageWeight: 1000,
  maxPackageDimensions: {
    length: 200,
    width: 150,
    height: 150,
  },
}

// Complete form configuration
const formConfig: FormConfig = {
  packageTypes,
  specialHandling,
  deliveryPreferences,
  contentsCategories,
  countries,
  industries,
  businessTypes,
  currencyOptions,
  serviceLevelPreferences,
  validationRules,
  metadata,
}

// Valid sections for filtering
const validSections: FormConfigSection[] = [
  'packageTypes',
  'specialHandling',
  'deliveryPreferences',
  'contentsCategories',
  'countries',
  'industries',
  'businessTypes',
  'currencyOptions',
  'serviceLevelPreferences',
  'validationRules',
  'metadata',
]

/**
 * Generate ETag for the response
 */
function generateETag(data: unknown): string {
  const hash = createHash('md5')
  hash.update(JSON.stringify(data))
  return `"${hash.digest('hex')}"`
}

/**
 * Filter form config by sections
 */
function filterBySections(
  config: FormConfig,
  sections: string[]
): Partial<FormConfig> {
  const result: Partial<FormConfig> = {}

  for (const section of sections) {
    if (validSections.includes(section as FormConfigSection)) {
      result[section as keyof FormConfig] = config[section as keyof FormConfig] as never
    }
  }

  return result
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const sectionsParam = searchParams.get('sections')

    // Filter by sections if provided
    let responseData: Partial<FormConfig> | FormConfig = formConfig
    if (sectionsParam) {
      const requestedSections = sectionsParam.split(',').map((s) => s.trim())
      responseData = filterBySections(formConfig, requestedSections)
    }

    // Generate ETag for caching
    const etag = generateETag(responseData)

    // Check for If-None-Match header for conditional requests
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
          ETag: etag,
        },
      })
    }

    // Return response with caching headers
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
        ETag: etag,
        'Last-Modified': metadata.lastUpdated,
      },
    })
  } catch (error) {
    console.error('Error serving form config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
