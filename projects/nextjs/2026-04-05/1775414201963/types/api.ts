/**
 * B2B Postal Checkout Flow - API Types
 * Request/Response payload types for API endpoints
 */

import type {
  Address,
  Carrier,
  ServiceType,
  Shipment,
  ShipmentPackage,
  ShipmentSpecialHandling,
  ShipmentDeliveryPreferences,
  HazmatDetails,
  Quote,
  PaymentInfo,
  PackageType,
  HandlingType,
  ShipmentStatus,
  CarrierCode,
  ServiceCategory,
  PaymentMethodType,
} from './database';

// ============================================
// STANDARD API RESPONSE WRAPPER
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// HEALTH ENDPOINT
// ============================================

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs: number;
    };
    api: {
      status: 'operational' | 'degraded' | 'down';
    };
  };
}

export type HealthCheckResponse = ApiResponse<HealthCheckData>;

// ============================================
// FORM CONFIG ENDPOINT
// ============================================

export interface FormConfigData {
  packageTypes: {
    value: PackageType;
    label: string;
    description: string;
    maxWeight: number;
    maxDimensions: {
      length: number;
      width: number;
      height: number;
    };
  }[];
  specialHandlingTypes: {
    value: HandlingType;
    label: string;
    description: string;
    fee: number;
    feeType: 'flat' | 'percentage';
  }[];
  deliveryPreferences: {
    saturdayDelivery: {
      available: boolean;
      fee: number;
    };
    sundayDelivery: {
      available: boolean;
      fee: number;
    };
    signatureOptions: {
      value: string;
      label: string;
      fee: number;
    }[];
    holdAtFacility: {
      available: boolean;
    };
  };
  countries: {
    code: string;
    name: string;
    phoneCode: string;
    hasPostalCode: boolean;
    postalCodeRegex?: string;
    requiresState: boolean;
  }[];
  usStates: {
    code: string;
    name: string;
  }[];
  caProvinces: {
    code: string;
    name: string;
  }[];
  industries: {
    value: string;
    label: string;
  }[];
  businessTypes: {
    value: string;
    label: string;
  }[];
  validationRules: {
    phone: {
      minLength: number;
      maxLength: number;
      allowedChars: string;
    };
    email: {
      maxLength: number;
    };
    postalCode: {
      us: {
        pattern: string;
        example: string;
      };
      ca: {
        pattern: string;
        example: string;
      };
    };
    weight: {
      min: number;
      max: number;
      unit: 'kg' | 'lb';
    };
    dimensions: {
      min: number;
      max: number;
      unit: 'cm' | 'in';
    };
    declaredValue: {
      min: number;
      max: number;
    };
  };
}

export type FormConfigResponse = ApiResponse<FormConfigData>;

// ============================================
// SHIPMENTS ENDPOINTS
// ============================================

// POST /api/shipments - Create new draft shipment
export interface CreateShipmentRequest {
  // Step 1: Sender Information
  sender_address_id?: string;
  sender_contact_name?: string;
  sender_contact_phone?: string;
  sender_contact_email?: string;

  // Step 2: Recipient Information
  recipient_address_id?: string;
  recipient_contact_name?: string;
  recipient_contact_phone?: string;
  recipient_contact_email?: string;

  // Step 3: Package Details
  package_type?: PackageType;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  declared_value?: number;
  contents_description?: string;

  // Step 4: Shipping Options
  carrier_id?: string;
  service_type_id?: string;

  // Step 5: Special Handling
  special_handling?: {
    handling_type: HandlingType;
    instructions?: string;
  }[];

  // Step 6: Delivery Preferences
  delivery_preferences?: {
    saturday_delivery?: boolean;
    sunday_delivery?: boolean;
    signature_required?: boolean;
    adult_signature_required?: boolean;
    leave_without_signature?: boolean;
    delivery_instructions?: string;
  };

  // Step 7: Hazmat
  hazmat?: {
    is_hazmat: boolean;
    hazmat_class?: string;
    un_number?: string;
    proper_shipping_name?: string;
  };

  // Reference numbers
  reference_number?: string;
  po_number?: string;
}

export interface CreateShipmentData {
  shipment: Shipment;
  message: string;
}

export type CreateShipmentResponse = ApiResponse<CreateShipmentData>;

// GET /api/shipments/[id] - Fetch complete shipment
export interface ShipmentDetailData {
  shipment: Shipment;
  sender_address: Address;
  recipient_address: Address;
  packages: ShipmentPackage[];
  special_handling: ShipmentSpecialHandling[];
  delivery_preferences: ShipmentDeliveryPreferences | null;
  hazmat_details: HazmatDetails | null;
  quotes: Quote[];
  payment_info: PaymentInfo | null;
}

export type ShipmentDetailResponse = ApiResponse<ShipmentDetailData>;

// PATCH /api/shipments/[id] - Update shipment
export interface UpdateShipmentRequest {
  // Sender Information
  sender_address_id?: string;
  sender_contact_name?: string;
  sender_contact_phone?: string;
  sender_contact_email?: string;

  // Recipient Information
  recipient_address_id?: string;
  recipient_contact_name?: string;
  recipient_contact_phone?: string;
  recipient_contact_email?: string;

  // Package Details
  package_type?: PackageType;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  declared_value?: number;
  contents_description?: string;

  // Shipping Options
  carrier_id?: string;
  service_type_id?: string;
  estimated_delivery?: string;
  base_rate?: number;
  fuel_surcharge?: number;
  insurance_cost?: number;
  handling_fees?: number;
  taxes?: number;
  total_cost?: number;

  // Status
  status?: ShipmentStatus;

  // Reference numbers
  reference_number?: string;
  po_number?: string;
  special_instructions?: string;
  internal_notes?: string;
}

export interface UpdateShipmentData {
  shipment: Shipment;
  message: string;
}

export type UpdateShipmentResponse = ApiResponse<UpdateShipmentData>;

// ============================================
// CARRIER & SERVICE TYPES
// ============================================

export interface CarrierListData {
  carriers: Carrier[];
}

export type CarrierListResponse = ApiResponse<CarrierListData>;

export interface ServiceTypeListData {
  serviceTypes: ServiceType[];
}

export type ServiceTypeListResponse = ApiResponse<ServiceTypeListData>;

// ============================================
// QUOTE ENDPOINT
// ============================================

export interface QuoteRequest {
  shipment_id?: string;
  sender_address_id?: string;
  recipient_address_id?: string;
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  declared_value?: number;
  special_handling?: string[];
  signature_required?: boolean;
  adult_signature_required?: boolean;
}

export interface QuoteCarrierInfo {
  code: string;
  name: string;
  display_name: string;
  logo_url: string | null;
  reliability_rating: number | null;
  speed_rating: number | null;
  value_rating: number | null;
}

export interface QuoteServiceInfo {
  code: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  is_trackable: boolean;
  is_insurable: boolean;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
}

export interface QuotePricingBreakdown {
  base_rate: number;
  weight_charge: number;
  zone_charge: number;
  fuel_surcharge: number;
  residential_fee: number;
  extended_area_fee: number;
  handling_fees: number;
  insurance_cost: number;
  delivery_confirmation_fee: number;
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
}

export interface QuoteCarbonFootprint {
  kg_co2: number;
  distance_km: number;
}

export interface QuoteDetail {
  carrier_id: string;
  service_type_id: string;
  carrier: QuoteCarrierInfo;
  service: QuoteServiceInfo;
  pricing: QuotePricingBreakdown;
  estimated_delivery: string;
  carbon_footprint: QuoteCarbonFootprint;
}

export interface QuoteCategoryData {
  category: string;
  display_name: string;
  count: number;
  quotes: QuoteDetail[];
}

export interface QuoteSummary {
  total_quotes: number;
  categories: number;
  cheapest_quote: {
    carrier: string;
    service: string;
    total: number;
  } | null;
  fastest_quote: QuoteDetail | null;
  persisted_count: number;
}

export interface QuoteMeta {
  calculated_at: string;
  expires_at: string;
  shipment_id: string | null;
}

export interface QuoteCalculationData {
  quotes: QuoteCategoryData[];
  summary: QuoteSummary;
  meta: QuoteMeta;
}

export type QuoteCalculationResponse = ApiResponse<QuoteCalculationData>;

// ============================================
// ERROR CODES
// ============================================

export const ApiErrorCodes = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMITED: 'RATE_LIMITED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',

  // Shipment errors
  SHIPMENT_NOT_FOUND: 'SHIPMENT_NOT_FOUND',
  SHIPMENT_ALREADY_EXISTS: 'SHIPMENT_ALREADY_EXISTS',
  INVALID_SHIPMENT_STATUS: 'INVALID_SHIPMENT_STATUS',
  CANNOT_UPDATE_SHIPMENT: 'CANNOT_UPDATE_SHIPMENT',

  // Address errors
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  INVALID_ADDRESS: 'INVALID_ADDRESS',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
} as const;

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes];

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface ShipmentListQuery extends PaginationParams {
  status?: ShipmentStatus;
  carrier_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ============================================
// PAYMENT ENDPOINTS
// ============================================

// POST /api/shipments/[id]/payment - Process payment for shipment
export interface PaymentRequest {
  payment_method: 'purchase_order' | 'bill_of_lading' | 'third_party_billing' | 'net_terms' | 'corporate_account';
  
  // Purchase Order fields
  purchase_order?: {
    po_number: string;
    authorized_amount: number;
    po_expiry_date?: string;
    department?: string;
    cost_center?: string;
    gl_account?: string;
    approver_name?: string;
    approver_email?: string;
  };
  
  // Bill of Lading fields
  bill_of_lading?: {
    bol_number: string;
    carrier_id?: string;
    account_number?: string;
    authorized_amount?: number;
    expiry_date?: string;
  };
  
  // Third Party Billing fields
  third_party?: {
    company_name: string;
    account_number: string;
    address_id?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    authorization_on_file?: boolean;
  };
  
  // Net Terms fields
  net_terms?: {
    terms_days: number;
    credit_limit?: number;
    early_payment_discount_percent?: number;
    early_payment_discount_days?: number;
    trade_references?: {
      company_name: string;
      contact_name: string;
      contact_phone: string;
      relationship_length_months: number;
    }[];
  };
  
  // Corporate Account fields
  corporate_account?: {
    account_number: string;
    department_code?: string;
    cost_center?: string;
    project_code?: string;
    monthly_limit?: number;
  };
}

export interface PaymentData {
  payment: {
    id: string;
    shipment_id: string;
    payment_info_id: string;
    payment_type: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed';
    amount: number;
    currency: string;
    created_at: string;
  };
  message: string;
}

export type PaymentResponse = ApiResponse<PaymentData>;

// Payment method fee configuration
export interface PaymentMethodFee {
  method: string;
  fee_amount: number;
  fee_type: 'flat' | 'percentage';
  fee_label: string;
}

// Cost summary data
export interface CostSummaryData {
  base_rate: number;
  fuel_surcharge: number;
  fuel_surcharge_percent: number;
  insurance_cost: number;
  insurance_percent: number;
  handling_fees: number;
  delivery_preferences_fees: number;
  taxes: number;
  tax_percent: number;
  subtotal: number;
  payment_method_fee: number;
  total: number;
  currency: string;
  payment_method_fees: PaymentMethodFee[];
}

export type CostSummaryResponse = ApiResponse<CostSummaryData>;

// ============================================
// WEBHOOK PAYLOADS
// ============================================

export interface ShipmentStatusWebhookPayload {
  event: 'shipment.status_updated';
  data: {
    shipment_id: string;
    tracking_number: string;
    previous_status: ShipmentStatus;
    new_status: ShipmentStatus;
    occurred_at: string;
    location?: {
      city: string;
      state: string;
      country: string;
    };
    description?: string;
  };
}
