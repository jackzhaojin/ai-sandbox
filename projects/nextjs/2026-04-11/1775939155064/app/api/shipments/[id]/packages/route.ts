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

interface PackageInput {
  packageIndex?: number
  packageType: string
  weight: number
  length: number
  width: number
  height: number
  declaredValue?: number
  contentsDescription?: string
}

/**
 * POST /api/shipments/:id/packages
 * 
 * Adds or updates packages for an existing shipment.
 * For single-package shipments, updates the main shipment record.
 * For multi-piece shipments, creates records in shipment_packages table.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const shipmentId = params.id

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

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('id, status, package_type')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Map package type to enum
    const packageTypeMap: Record<string, string> = {
      'envelope': 'envelope',
      'small-box': 'box',
      'medium-box': 'box',
      'large-box': 'box',
      'extra-large': 'box',
      'pallet': 'pallet',
      'custom': 'box',
      'box': 'box',
      'tube': 'tube',
    }

    // For single package shipments, update the main shipment record
    if (!isMultiPiece && packages.length === 1) {
      const pkg = packages[0]
      
      const { error: updateError } = await supabaseServer
        .from('shipments')
        .update({
          package_type: packageTypeMap[pkg.packageType] || 'box',
          weight: pkg.weight,
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
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

      return NextResponse.json(
        {
          success: true,
          shipmentId,
          packages: [pkg],
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
    const packageRecords = packages.map((pkg, index) => ({
      shipment_id: shipmentId,
      package_index: pkg.packageIndex || index + 1,
      package_type: packageTypeMap[pkg.packageType] || 'box',
      weight: pkg.weight,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
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
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0)
    const totalValue = packages.reduce((sum, pkg) => sum + (pkg.declaredValue || 0), 0)

    const { error: updateError } = await supabaseServer
      .from('shipments')
      .update({
        weight: totalWeight,
        declared_value: totalValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)

    if (updateError) {
      console.error('Error updating shipment totals:', updateError)
    }

    return NextResponse.json(
      {
        success: true,
        shipmentId,
        packages: insertedPackages,
        totalWeight,
        totalValue,
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
 * Retrieves all packages for a shipment.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const shipmentId = params.id

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
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
      const { data: shipment, error: shipmentError } = await supabaseServer
        .from('shipments')
        .select('package_type, weight, length, width, height, declared_value, contents_description')
        .eq('id', shipmentId)
        .single()

      if (shipmentError || !shipment) {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          shipmentId,
          packages: [
            {
              package_index: 1,
              package_type: shipment.package_type,
              weight: shipment.weight,
              length: shipment.length,
              width: shipment.width,
              height: shipment.height,
              declared_value: shipment.declared_value,
              contents_description: shipment.contents_description,
            },
          ],
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        shipmentId,
        packages,
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
