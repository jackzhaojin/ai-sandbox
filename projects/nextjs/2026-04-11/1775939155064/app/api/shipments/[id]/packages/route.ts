import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Initialize server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'postal_v2' }
})

// DIM divisor for dimensional weight calculation (varies by carrier, using standard 139)
const DIM_DIVISOR = 139

// DIM divisor for international shipments (typically higher)
const INTERNATIONAL_DIM_DIVISOR = 166

// Package type limits from the database schema
interface PackageTypeLimits {
  maxWeight: number // in lbs
  maxLength: number // in inches
  maxWidth: number // in inches
  maxHeight: number // in inches
  maxGirthPlusLength?: number // for some carriers
}

const PACKAGE_TYPE_LIMITS: Record<string, PackageTypeLimits> = {
  'box': {
    maxWeight: 150,
    maxLength: 108,
    maxWidth: 108,
    maxHeight: 108,
    maxGirthPlusLength: 165 // length + 2*(width + height)
  },
  'envelope': {
    maxWeight: 1,
    maxLength: 15,
    maxWidth: 12,
    maxHeight: 0.75
  },
  'tube': {
    maxWeight: 25,
    maxLength: 38,
    maxWidth: 6,
    maxHeight: 6
  },
  'pallet': {
    maxWeight: 2000,
    maxLength: 96,
    maxWidth: 96,
    maxHeight: 72
  }
}

interface PackageInput {
  packageIndex?: number
  packageType: string
  weight: number
  length: number
  width: number
  height: number
  dimensionUnit?: 'in' | 'cm'
  weightUnit?: 'lbs' | 'kg'
  declaredValue?: number
  contentsDescription?: string
}

interface ValidationError {
  field: string
  message: string
}

/**
 * Calculates dimensional weight (also known as volumetric weight)
 * Used by carriers to charge for lightweight but bulky packages
 */
function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  isInternational: boolean = false
): number {
  const divisor = isInternational ? INTERNATIONAL_DIM_DIVISOR : DIM_DIVISOR
  const volume = length * width * height
  return Math.ceil((volume / divisor) * 100) / 100 // Round to 2 decimal places
}

/**
 * Converts dimensions to inches if needed
 */
function convertToInches(value: number, unit: 'in' | 'cm'): number {
  if (unit === 'cm') {
    return value / 2.54
  }
  return value
}

/**
 * Converts weight to pounds if needed
 */
function convertToPounds(value: number, unit: 'lbs' | 'kg'): number {
  if (unit === 'kg') {
    return value * 2.20462
  }
  return value
}

/**
 * Validates package against type-specific limits
 */
function validatePackageLimits(
  pkg: PackageInput,
  limits: PackageTypeLimits
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Convert to inches and pounds for validation
  const dimUnit = pkg.dimensionUnit || 'in'
  const weightUnit = pkg.weightUnit || 'lbs'
  
  const lengthIn = convertToInches(pkg.length, dimUnit)
  const widthIn = convertToInches(pkg.width, dimUnit)
  const heightIn = convertToInches(pkg.height, dimUnit)
  const weightLbs = convertToPounds(pkg.weight, weightUnit)
  
  // Check weight limit
  if (weightLbs > limits.maxWeight) {
    errors.push({
      field: 'weight',
      message: `Weight ${weightLbs.toFixed(2)} lbs exceeds maximum of ${limits.maxWeight} lbs for ${pkg.packageType}`
    })
  }
  
  // Check dimension limits
  if (lengthIn > limits.maxLength) {
    errors.push({
      field: 'length',
      message: `Length ${lengthIn.toFixed(2)} in exceeds maximum of ${limits.maxLength} in for ${pkg.packageType}`
    })
  }
  
  if (widthIn > limits.maxWidth) {
    errors.push({
      field: 'width',
      message: `Width ${widthIn.toFixed(2)} in exceeds maximum of ${limits.maxWidth} in for ${pkg.packageType}`
    })
  }
  
  if (heightIn > limits.maxHeight) {
    errors.push({
      field: 'height',
      message: `Height ${heightIn.toFixed(2)} in exceeds maximum of ${limits.maxHeight} in for ${pkg.packageType}`
    })
  }
  
  // Check girth + length if applicable
  if (limits.maxGirthPlusLength) {
    const girth = 2 * (widthIn + heightIn)
    const girthPlusLength = lengthIn + girth
    if (girthPlusLength > limits.maxGirthPlusLength) {
      errors.push({
        field: 'dimensions',
        message: `Girth + Length (${girthPlusLength.toFixed(2)} in) exceeds maximum of ${limits.maxGirthPlusLength} in`
      })
    }
  }
  
  return errors
}

/**
 * Validates package data
 */
function validatePackage(pkg: PackageInput, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Check required fields
  if (!pkg.packageType) {
    errors.push({ field: `packages[${index}].packageType`, message: 'Package type is required' })
  }
  
  if (pkg.weight === undefined || pkg.weight === null || isNaN(pkg.weight)) {
    errors.push({ field: `packages[${index}].weight`, message: 'Weight is required' })
  } else if (pkg.weight <= 0) {
    errors.push({ field: `packages[${index}].weight`, message: 'Weight must be greater than 0' })
  }
  
  if (pkg.length === undefined || pkg.length === null || isNaN(pkg.length)) {
    errors.push({ field: `packages[${index}].length`, message: 'Length is required' })
  } else if (pkg.length <= 0) {
    errors.push({ field: `packages[${index}].length`, message: 'Length must be greater than 0' })
  }
  
  if (pkg.width === undefined || pkg.width === null || isNaN(pkg.width)) {
    errors.push({ field: `packages[${index}].width`, message: 'Width is required' })
  } else if (pkg.width <= 0) {
    errors.push({ field: `packages[${index}].width`, message: 'Width must be greater than 0' })
  }
  
  if (pkg.height === undefined || pkg.height === null || isNaN(pkg.height)) {
    errors.push({ field: `packages[${index}].height`, message: 'Height is required' })
  } else if (pkg.height <= 0) {
    errors.push({ field: `packages[${index}].height`, message: 'Height must be greater than 0' })
  }
  
  // Check package type limits if type is provided
  if (pkg.packageType) {
    const normalizedType = pkg.packageType.toLowerCase().replace(/-/g, '_')
    const limits = PACKAGE_TYPE_LIMITS[normalizedType] || PACKAGE_TYPE_LIMITS['box']
    const limitErrors = validatePackageLimits(pkg, limits)
    errors.push(...limitErrors.map(e => ({ ...e, field: `packages[${index}].${e.field}` })))
  }
  
  return errors
}

/**
 * Maps frontend package type to database enum
 */
function mapPackageType(frontendType: string): string {
  const typeMap: Record<string, string> = {
    'envelope': 'envelope',
    'small-box': 'box',
    'medium-box': 'box',
    'large-box': 'box',
    'extra-large': 'box',
    'pallet': 'pallet',
    'custom': 'box',
    'box': 'box',
    'tube': 'tube'
  }
  return typeMap[frontendType] || 'box'
}

/**
 * POST /api/shipments/:id/packages
 * 
 * Adds or updates packages for an existing shipment.
 * For single-package shipments, updates the main shipment record.
 * For multi-piece shipments, creates records in shipment_packages table.
 * Calculates dimensional weight and validates package type limits.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: shipmentId } = await params

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { packages, isMultiPiece }: { packages: PackageInput[]; isMultiPiece?: boolean } = body

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        { error: 'At least one package is required' },
        { status: 400 }
      )
    }

    // Validate maximum number of packages
    const MAX_PACKAGES = 50
    if (packages.length > MAX_PACKAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PACKAGES} packages allowed per shipment` },
        { status: 400 }
      )
    }

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('id, status, package_type, sender_address_id, recipient_address_id')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check if shipment can be modified
    const modifiableStatuses = ['draft', 'pending_payment']
    if (!modifiableStatuses.includes(shipment.status)) {
      return NextResponse.json(
        { error: `Cannot modify packages for shipment with status '${shipment.status}'` },
        { status: 422 }
      )
    }

    // Validate all packages
    const allErrors: ValidationError[] = []
    packages.forEach((pkg, index) => {
      const errors = validatePackage(pkg, index)
      allErrors.push(...errors)
    })

    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: 'Package validation failed', validationErrors: allErrors },
        { status: 400 }
      )
    }

    // Calculate dimensional weight and billing weight for each package
    const packagesWithCalculatedWeights = packages.map((pkg, index) => {
      const dimUnit = pkg.dimensionUnit || 'in'
      const weightUnit = pkg.weightUnit || 'lbs'
      
      // Convert to inches
      const lengthIn = convertToInches(pkg.length, dimUnit)
      const widthIn = convertToInches(pkg.width, dimUnit)
      const heightIn = convertToInches(pkg.height, dimUnit)
      
      // Convert to pounds
      const actualWeightLbs = convertToPounds(pkg.weight, weightUnit)
      
      // Calculate dimensional weight
      const dimensionalWeight = calculateDimensionalWeight(lengthIn, widthIn, heightIn)
      
      // Billing weight is the greater of actual and dimensional
      const billingWeight = Math.max(actualWeightLbs, dimensionalWeight)
      
      return {
        ...pkg,
        lengthIn,
        widthIn,
        heightIn,
        actualWeightLbs,
        dimensionalWeight,
        billingWeight,
        packageIndex: pkg.packageIndex || index + 1
      }
    })

    // For single package shipments, update the main shipment record
    if (!isMultiPiece && packages.length === 1) {
      const pkg = packagesWithCalculatedWeights[0]
      
      const { error: updateError } = await supabaseServer
        .from('shipments')
        .update({
          package_type: mapPackageType(pkg.packageType),
          weight: pkg.billingWeight,
          length: pkg.lengthIn,
          width: pkg.widthIn,
          height: pkg.heightIn,
          declared_value: pkg.declaredValue,
          contents_description: pkg.contentsDescription || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)

      if (updateError) {
        console.error('Error updating shipment package:', updateError)
        return NextResponse.json(
          { error: 'Failed to update shipment package', details: updateError.message },
          { status: 500 }
        )
      }

      // Create event for package update
      await supabaseServer
        .from('shipment_events')
        .insert({
          shipment_id: shipmentId,
          event_type: 'package_updated',
          event_description: `Package updated: ${pkg.actualWeightLbs.toFixed(2)} lbs actual, ${pkg.dimensionalWeight.toFixed(2)} lbs dimensional, ${pkg.billingWeight.toFixed(2)} lbs billing`,
          metadata: {
            package_index: 1,
            actual_weight: pkg.actualWeightLbs,
            dimensional_weight: pkg.dimensionalWeight,
            billing_weight: pkg.billingWeight,
            dimensions: { length: pkg.lengthIn, width: pkg.widthIn, height: pkg.heightIn }
          }
        })

      return NextResponse.json(
        {
          success: true,
          shipmentId,
          packages: [{
            packageIndex: 1,
            packageType: pkg.packageType,
            weight: pkg.actualWeightLbs,
            length: pkg.lengthIn,
            width: pkg.widthIn,
            height: pkg.heightIn,
            dimensionalWeight: pkg.dimensionalWeight,
            billingWeight: pkg.billingWeight,
            declaredValue: pkg.declaredValue,
            contentsDescription: pkg.contentsDescription
          }],
          totals: {
            actualWeight: pkg.actualWeightLbs,
            dimensionalWeight: pkg.dimensionalWeight,
            billingWeight: pkg.billingWeight,
            declaredValue: pkg.declaredValue || 0
          }
        },
        { status: 200 }
      )
    }

    // For multi-piece shipments, handle shipment_packages table
    // First, delete existing packages for this shipment
    const { error: deleteError } = await supabaseServer
      .from('shipment_packages')
      .delete()
      .eq('shipment_id', shipmentId)

    if (deleteError) {
      console.error('Error deleting existing packages:', deleteError)
    }

    // Insert new packages
    const packageRecords = packagesWithCalculatedWeights.map((pkg) => ({
      shipment_id: shipmentId,
      package_index: pkg.packageIndex,
      package_type: mapPackageType(pkg.packageType),
      weight: pkg.billingWeight, // Use billing weight (max of actual and dimensional)
      length: pkg.lengthIn,
      width: pkg.widthIn,
      height: pkg.heightIn,
      declared_value: pkg.declaredValue,
      contents_description: pkg.contentsDescription || '',
    }))

    const { data: insertedPackages, error: insertError } = await supabaseServer
      .from('shipment_packages')
      .insert(packageRecords)
      .select('id, package_index, package_type, weight, length, width, height')

    if (insertError) {
      console.error('Error inserting packages:', insertError)
      return NextResponse.json(
        { error: 'Failed to save packages', details: insertError.message },
        { status: 500 }
      )
    }

    // Update main shipment with totals
    const totalActualWeight = packagesWithCalculatedWeights.reduce((sum, pkg) => sum + pkg.actualWeightLbs, 0)
    const totalDimensionalWeight = packagesWithCalculatedWeights.reduce((sum, pkg) => sum + pkg.dimensionalWeight, 0)
    const totalBillingWeight = packagesWithCalculatedWeights.reduce((sum, pkg) => sum + pkg.billingWeight, 0)
    const totalValue = packagesWithCalculatedWeights.reduce((sum, pkg) => sum + (pkg.declaredValue || 0), 0)

    const { error: updateError } = await supabaseServer
      .from('shipments')
      .update({
        weight: totalBillingWeight,
        declared_value: totalValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)

    if (updateError) {
      console.error('Error updating shipment totals:', updateError)
    }

    // Create event for packages update
    await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'packages_updated',
        event_description: `${packages.length} packages updated for multi-piece shipment`,
        metadata: {
          package_count: packages.length,
          total_actual_weight: totalActualWeight,
          total_dimensional_weight: totalDimensionalWeight,
          total_billing_weight: totalBillingWeight,
          total_declared_value: totalValue,
          is_multi_piece: true
        }
      })

    return NextResponse.json(
      {
        success: true,
        shipmentId,
        packages: insertedPackages?.map((pkg, index) => ({
          ...pkg,
          actualWeight: packagesWithCalculatedWeights[index].actualWeightLbs,
          dimensionalWeight: packagesWithCalculatedWeights[index].dimensionalWeight,
          billingWeight: packagesWithCalculatedWeights[index].billingWeight,
        })),
        totals: {
          actualWeight: totalActualWeight,
          dimensionalWeight: totalDimensionalWeight,
          billingWeight: totalBillingWeight,
          totalValue,
          packageCount: packages.length
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error processing packages request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shipments/:id/packages
 * 
 * Retrieves all packages for a shipment with dimensional weight info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: shipmentId } = await params

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('id, package_type, weight, length, width, height, declared_value, contents_description')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Get packages from shipment_packages table
    const { data: packages, error } = await supabaseServer
      .from('shipment_packages')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('package_index', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    // If no packages in shipment_packages, get from main shipment record
    if (!packages || packages.length === 0) {
      // Calculate dimensional weight
      const dimensionalWeight = calculateDimensionalWeight(
        parseFloat(shipment.length) || 0,
        parseFloat(shipment.width) || 0,
        parseFloat(shipment.height) || 0
      )
      const actualWeight = parseFloat(shipment.weight) || 0

      return NextResponse.json(
        {
          shipmentId,
          packages: [
            {
              package_index: 1,
              package_type: shipment.package_type,
              weight: actualWeight,
              length: parseFloat(shipment.length) || 0,
              width: parseFloat(shipment.width) || 0,
              height: parseFloat(shipment.height) || 0,
              declared_value: parseFloat(shipment.declared_value) || 0,
              contents_description: shipment.contents_description,
              actual_weight: actualWeight,
              dimensional_weight: dimensionalWeight,
              billing_weight: Math.max(actualWeight, dimensionalWeight)
            },
          ],
          totals: {
            actualWeight,
            dimensionalWeight,
            billingWeight: Math.max(actualWeight, dimensionalWeight),
            totalValue: parseFloat(shipment.declared_value) || 0,
            packageCount: 1
          }
        },
        { status: 200 }
      )
    }

    // Calculate dimensional weight for each package
    const packagesWithWeights = packages.map(pkg => {
      const actualWeight = parseFloat(pkg.weight) || 0
      const length = parseFloat(pkg.length) || 0
      const width = parseFloat(pkg.width) || 0
      const height = parseFloat(pkg.height) || 0
      const dimensionalWeight = calculateDimensionalWeight(length, width, height)
      
      return {
        ...pkg,
        actual_weight: actualWeight,
        dimensional_weight: dimensionalWeight,
        billing_weight: Math.max(actualWeight, dimensionalWeight)
      }
    })

    // Calculate totals
    const totalActualWeight = packagesWithWeights.reduce((sum, pkg) => sum + pkg.actual_weight, 0)
    const totalDimensionalWeight = packagesWithWeights.reduce((sum, pkg) => sum + pkg.dimensional_weight, 0)
    const totalBillingWeight = packagesWithWeights.reduce((sum, pkg) => sum + pkg.billing_weight, 0)
    const totalValue = packagesWithWeights.reduce((sum, pkg) => sum + (parseFloat(pkg.declared_value) || 0), 0)

    return NextResponse.json(
      {
        shipmentId,
        packages: packagesWithWeights,
        totals: {
          actualWeight: totalActualWeight,
          dimensionalWeight: totalDimensionalWeight,
          billingWeight: totalBillingWeight,
          totalValue,
          packageCount: packages.length
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipments/:id/packages
 * 
 * Removes all packages from a shipment (reset to single package mode).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: shipmentId } = await params

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check if shipment can be modified
    const modifiableStatuses = ['draft', 'pending_payment']
    if (!modifiableStatuses.includes(shipment.status)) {
      return NextResponse.json(
        { error: `Cannot modify packages for shipment with status '${shipment.status}'` },
        { status: 422 }
      )
    }

    // Delete all packages
    const { error: deleteError } = await supabaseServer
      .from('shipment_packages')
      .delete()
      .eq('shipment_id', shipmentId)

    if (deleteError) {
      console.error('Error deleting packages:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete packages', details: deleteError.message },
        { status: 500 }
      )
    }

    // Create event
    await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'packages_deleted',
        event_description: 'All packages removed from shipment',
        metadata: { deleted_at: new Date().toISOString() }
      })

    return NextResponse.json(
      {
        success: true,
        message: 'All packages removed from shipment'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
