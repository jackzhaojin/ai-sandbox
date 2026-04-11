import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock address database for autocomplete
// In a real implementation, this would call a geocoding service like Google Places, Mapbox, or Smarty Streets
const MOCK_ADDRESS_DB: Array<{
  id: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}> = [
  // US Addresses
  { id: 'addr-1', address: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'US' },
  { id: 'addr-2', address: '456 Broadway', city: 'New York', state: 'NY', postalCode: '10013', country: 'US' },
  { id: 'addr-3', address: '789 Park Ave', city: 'New York', state: 'NY', postalCode: '10021', country: 'US' },
  { id: 'addr-4', address: '1600 Pennsylvania Ave NW', city: 'Washington', state: 'DC', postalCode: '20500', country: 'US' },
  { id: 'addr-5', address: '1 Infinite Loop', city: 'Cupertino', state: 'CA', postalCode: '95014', country: 'US' },
  { id: 'addr-6', address: '350 5th Ave', city: 'New York', state: 'NY', postalCode: '10118', country: 'US' },
  { id: 'addr-7', address: '410 Terry Ave N', city: 'Seattle', state: 'WA', postalCode: '98109', country: 'US' },
  { id: 'addr-8', address: '1 Hacker Way', city: 'Menlo Park', state: 'CA', postalCode: '94025', country: 'US' },
  { id: 'addr-9', address: '221B Baker St', city: 'San Francisco', state: 'CA', postalCode: '94102', country: 'US' },
  { id: 'addr-10', address: '875 N Michigan Ave', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'US' },
  { id: 'addr-11', address: '600 Montgomery St', city: 'San Francisco', state: 'CA', postalCode: '94111', country: 'US' },
  { id: 'addr-12', address: '1600 Amphitheatre Pkwy', city: 'Mountain View', state: 'CA', postalCode: '94043', country: 'US' },
  { id: 'addr-13', address: '1 Microsoft Way', city: 'Redmond', state: 'WA', postalCode: '98052', country: 'US' },
  { id: 'addr-14', address: '1515 Wynkoop St', city: 'Denver', state: 'CO', postalCode: '80202', country: 'US' },
  { id: 'addr-15', address: '500 W 2nd St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
  // Canadian Addresses
  { id: 'addr-ca-1', address: '100 Queen St W', city: 'Toronto', state: 'ON', postalCode: 'M5H 2N2', country: 'CA' },
  { id: 'addr-ca-2', address: '453 Boulevard René-Lévesque O', city: 'Montreal', state: 'QC', postalCode: 'H2Z 1Y2', country: 'CA' },
  { id: 'addr-ca-3', address: '800 Robson St', city: 'Vancouver', state: 'BC', postalCode: 'V6Z 2E7', country: 'CA' },
  // Mexican Addresses
  { id: 'addr-mx-1', address: 'Paseo de la Reforma 505', city: 'Ciudad de Mexico', state: 'CMX', postalCode: '06500', country: 'MX' },
  { id: 'addr-mx-2', address: 'Av. Insurgentes Sur 1605', city: 'Ciudad de Mexico', state: 'CMX', postalCode: '03940', country: 'MX' },
  { id: 'addr-mx-3', address: 'Blvd. Agua Caliente 10488', city: 'Tijuana', state: 'BCN', postalCode: '22014', country: 'MX' },
]

/**
 * Address search endpoint
 * GET /api/address-search?q={query}
 * 
 * Returns address suggestions based on the search query.
 * Minimum 3 characters required for search.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase().trim() || ''

    // Validate query length
    if (query.length < 3) {
      return NextResponse.json(
        { 
          suggestions: [],
          error: 'Query must be at least 3 characters'
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Filter addresses based on query
    const suggestions = MOCK_ADDRESS_DB.filter((addr) => {
      const searchText = `${addr.address} ${addr.city} ${addr.state} ${addr.postalCode}`.toLowerCase()
      return searchText.includes(query)
    }).slice(0, 10) // Limit to 10 results

    return NextResponse.json(
      { 
        suggestions,
        count: suggestions.length,
        query
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        }
      }
    )
  } catch (error) {
    console.error('Error searching addresses:', error)
    return NextResponse.json(
      { 
        suggestions: [],
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
