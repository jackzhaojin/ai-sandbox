/**
 * B2B Postal Checkout Flow - Form Configuration API
 * GET /api/form-config - Returns dropdown options, validation rules, and configuration
 */

import { NextResponse } from 'next/server';
import { successResponse, cacheHeaders } from '@/lib/api/response';
import type { FormConfigData } from '@/types/api';

// Cache for 1 hour with 24-hour stale-while-revalidate
const CACHE_MAX_AGE = 60 * 60; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 24 * 60 * 60; // 24 hours

/**
 * GET /api/form-config
 * Returns form configuration including dropdown options and validation rules
 * Heavily cached as this data rarely changes
 */
export async function GET(): Promise<NextResponse> {
  const config: FormConfigData = {
    packageTypes: [
      {
        value: 'box',
        label: 'Box',
        description: 'Standard cardboard box for general shipping',
        maxWeight: 50,
        maxDimensions: { length: 150, width: 100, height: 100 },
      },
      {
        value: 'envelope',
        label: 'Envelope',
        description: 'Flat envelope for documents and small items',
        maxWeight: 2,
        maxDimensions: { length: 40, width: 30, height: 5 },
      },
      {
        value: 'tube',
        label: 'Tube',
        description: 'Cylindrical tube for posters, blueprints, and rolled items',
        maxWeight: 10,
        maxDimensions: { length: 100, width: 15, height: 15 },
      },
      {
        value: 'pallet',
        label: 'Pallet',
        description: 'Freight pallet for large or heavy shipments',
        maxWeight: 1000,
        maxDimensions: { length: 200, width: 120, height: 200 },
      },
    ],
    specialHandlingTypes: [
      {
        value: 'fragile',
        label: 'Fragile',
        description: 'Item requires careful handling',
        fee: 5.99,
        feeType: 'flat',
      },
      {
        value: 'hazardous',
        label: 'Hazardous Materials',
        description: 'Dangerous goods requiring special transport',
        fee: 25.00,
        feeType: 'flat',
      },
      {
        value: 'temperature_controlled',
        label: 'Temperature Controlled',
        description: 'Requires temperature-controlled environment',
        fee: 15.00,
        feeType: 'flat',
      },
      {
        value: 'signature_required',
        label: 'Signature Required',
        description: 'Recipient signature required upon delivery',
        fee: 3.99,
        feeType: 'flat',
      },
      {
        value: 'adult_signature',
        label: 'Adult Signature Required',
        description: 'Adult signature (21+) required upon delivery',
        fee: 6.99,
        feeType: 'flat',
      },
      {
        value: 'hold_for_pickup',
        label: 'Hold for Pickup',
        description: 'Hold at carrier facility for pickup',
        fee: 0,
        feeType: 'flat',
      },
      {
        value: 'appointment_delivery',
        label: 'Appointment Delivery',
        description: 'Schedule delivery appointment',
        fee: 12.00,
        feeType: 'flat',
      },
    ],
    deliveryPreferences: {
      saturdayDelivery: {
        available: true,
        fee: 16.00,
      },
      sundayDelivery: {
        available: false,
        fee: 0,
      },
      signatureOptions: [
        { value: 'none', label: 'No Signature Required', fee: 0 },
        { value: 'standard', label: 'Signature Required', fee: 3.99 },
        { value: 'adult', label: 'Adult Signature Required (21+)', fee: 6.99 },
      ],
      holdAtFacility: {
        available: true,
      },
    },
    countries: [
      { code: 'US', name: 'United States', phoneCode: '+1', hasPostalCode: true, postalCodeRegex: '^\\d{5}(-\\d{4})?$', requiresState: true },
      { code: 'CA', name: 'Canada', phoneCode: '+1', hasPostalCode: true, postalCodeRegex: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$', requiresState: true },
      { code: 'MX', name: 'Mexico', phoneCode: '+52', hasPostalCode: true, requiresState: true },
      { code: 'GB', name: 'United Kingdom', phoneCode: '+44', hasPostalCode: true, requiresState: false },
      { code: 'DE', name: 'Germany', phoneCode: '+49', hasPostalCode: true, requiresState: false },
      { code: 'FR', name: 'France', phoneCode: '+33', hasPostalCode: true, requiresState: false },
      { code: 'AU', name: 'Australia', phoneCode: '+61', hasPostalCode: true, requiresState: true },
      { code: 'JP', name: 'Japan', phoneCode: '+81', hasPostalCode: true, requiresState: false },
      { code: 'CN', name: 'China', phoneCode: '+86', hasPostalCode: true, requiresState: true },
      { code: 'IN', name: 'India', phoneCode: '+91', hasPostalCode: true, requiresState: true },
    ],
    usStates: [
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
    caProvinces: [
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
    industries: [
      { value: 'technology', label: 'Technology' },
      { value: 'healthcare', label: 'Healthcare & Medical' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'retail', label: 'Retail & E-commerce' },
      { value: 'logistics', label: 'Logistics & Transportation' },
      { value: 'finance', label: 'Financial Services' },
      { value: 'education', label: 'Education' },
      { value: 'government', label: 'Government' },
      { value: 'nonprofit', label: 'Non-profit' },
      { value: 'construction', label: 'Construction' },
      { value: 'energy', label: 'Energy & Utilities' },
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'hospitality', label: 'Hospitality & Tourism' },
      { value: 'media', label: 'Media & Entertainment' },
      { value: 'professional_services', label: 'Professional Services' },
      { value: 'real_estate', label: 'Real Estate' },
      { value: 'other', label: 'Other' },
    ],
    businessTypes: [
      { value: 'corporation', label: 'Corporation' },
      { value: 'llc', label: 'Limited Liability Company (LLC)' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
      { value: 'nonprofit', label: 'Non-profit Organization' },
      { value: 'government', label: 'Government Agency' },
      { value: 'cooperative', label: 'Cooperative' },
      { value: 'other', label: 'Other' },
    ],
    validationRules: {
      phone: {
        minLength: 10,
        maxLength: 20,
        allowedChars: '0-9, spaces, -, +, (, )',
      },
      email: {
        maxLength: 255,
      },
      postalCode: {
        us: {
          pattern: '^\\d{5}(-\\d{4})?$',
          example: '12345 or 12345-6789',
        },
        ca: {
          pattern: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$',
          example: 'A1A 1A1',
        },
      },
      weight: {
        min: 0.01,
        max: 1000,
        unit: 'kg',
      },
      dimensions: {
        min: 1,
        max: 500,
        unit: 'cm',
      },
      declaredValue: {
        min: 0,
        max: 100000,
      },
    },
  };

  return successResponse(
    config,
    200,
    cacheHeaders(CACHE_MAX_AGE, CACHE_STALE_WHILE_REVALIDATE)
  );
}
