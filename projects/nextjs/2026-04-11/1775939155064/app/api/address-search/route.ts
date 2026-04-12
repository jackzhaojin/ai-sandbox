import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Address Suggestion Type
 * Matches the requirements from Step 38
 */
interface AddressSuggestion {
  id: string
  street: string
  suite?: string
  city: string
  state: string
  zip: string
  country: string
  is_residential: boolean
  location_type: 'residential' | 'commercial' | 'mixed_use'
  confidence: number
}

/**
 * Mock Address Database
 * Common US addresses with variety of location types
 */
const MOCK_ADDRESS_DB: AddressSuggestion[] = [
  // Commercial addresses
  {
    id: 'addr-1',
    street: '123 Main St',
    suite: 'Suite 400',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.98
  },
  {
    id: 'addr-2',
    street: '456 Broadway',
    city: 'New York',
    state: 'NY',
    zip: '10013',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.97
  },
  {
    id: 'addr-3',
    street: '350 5th Ave',
    suite: 'Floor 76',
    city: 'New York',
    state: 'NY',
    zip: '10118',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.99
  },
  {
    id: 'addr-4',
    street: '1600 Pennsylvania Ave NW',
    city: 'Washington',
    state: 'DC',
    zip: '20500',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.99
  },
  {
    id: 'addr-5',
    street: '1 Infinite Loop',
    city: 'Cupertino',
    state: 'CA',
    zip: '95014',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.96
  },
  {
    id: 'addr-6',
    street: '410 Terry Ave N',
    city: 'Seattle',
    state: 'WA',
    zip: '98109',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.95
  },
  {
    id: 'addr-7',
    street: '1 Hacker Way',
    city: 'Menlo Park',
    state: 'CA',
    zip: '94025',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.94
  },
  {
    id: 'addr-8',
    street: '1600 Amphitheatre Pkwy',
    city: 'Mountain View',
    state: 'CA',
    zip: '94043',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.98
  },
  {
    id: 'addr-9',
    street: '1 Microsoft Way',
    city: 'Redmond',
    state: 'WA',
    zip: '98052',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.97
  },
  {
    id: 'addr-10',
    street: '1515 Wynkoop St',
    suite: 'Unit 200',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.93
  },
  // Residential addresses
  {
    id: 'addr-11',
    street: '789 Park Ave',
    city: 'New York',
    state: 'NY',
    zip: '10021',
    country: 'US',
    is_residential: true,
    location_type: 'residential',
    confidence: 0.92
  },
  {
    id: 'addr-12',
    street: '221B Baker St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
    is_residential: true,
    location_type: 'residential',
    confidence: 0.89
  },
  {
    id: 'addr-13',
    street: '875 N Michigan Ave',
    apt: 'Apt 32B',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',
    country: 'US',
    is_residential: true,
    location_type: 'residential',
    confidence: 0.91
  },
  {
    id: 'addr-14',
    street: '600 Montgomery St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94111',
    country: 'US',
    is_residential: true,
    location_type: 'mixed_use',
    confidence: 0.88
  },
  {
    id: 'addr-15',
    street: '500 W 2nd St',
    apt: 'Unit 1205',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    country: 'US',
    is_residential: true,
    location_type: 'residential',
    confidence: 0.90
  },
  // Additional residential addresses
  {
    id: 'addr-16',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    country: 'US',
    is_residential: true,
    location_type: 'residential',
    confidence: 0.85
  },
  {
    id: 'addr-17',
    street: '1060 W Addison St',
    city: 'Chicago',
    state: 'IL',
    zip: '60613',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.94
  },
  {
    id: 'addr-18',
    street: '901 Bagby St',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.87
  },
  {
    id: 'addr-19',
    street: '1000 Vin Scully Ave',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.93
  },
  {
    id: 'addr-20',
    street: '700 Clark Ave',
    city: 'St. Louis',
    state: 'MO',
    zip: '63102',
    country: 'US',
    is_residential: false,
    location_type: 'commercial',
    confidence: 0.91
  }
].map(addr => ({
  ...addr,
  // Normalize suite/apt to suite field
  suite: (addr as unknown as { suite?: string; apt?: string }).suite || 
         (addr as unknown as { apt?: string }).apt || 
         undefined
}))

/**
 * Calculate relevance score based on how well address matches query
 */
function calculateRelevance(address: AddressSuggestion, query: string): number {
  const searchText = `${address.street} ${address.city} ${address.state} ${address.zip}`.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Exact match gets highest score
  if (searchText.includes(queryLower)) {
    return address.confidence
  }
  
  // Partial word matches
  const queryWords = queryLower.split(/\s+/)
  const matchCount = queryWords.filter(word => searchText.includes(word)).length
  const matchRatio = matchCount / queryWords.length
  
  return address.confidence * (0.5 + 0.5 * matchRatio)
}

/**
 * Address search endpoint
 * GET /api/address-search?q={query}
 * 
 * Returns address suggestions based on the search query.
 * Minimum 3 characters required for search.
 * Returns up to 10 results sorted by confidence score.
 * 
 * Response format:
 * {
 *   suggestions: Array<{
 *     id: string
 *     street: string
 *     suite?: string
 *     city: string
 *     state: string
 *     zip: string
 *     country: string
 *     is_residential: boolean
 *     location_type: 'residential' | 'commercial' | 'mixed_use'
 *     confidence: number
 *   }>
 *   count: number
 *   query: string
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    // Validate query length
    if (query.length < 3) {
      return NextResponse.json(
        { 
          suggestions: [],
          count: 0,
          query,
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

    const queryLower = query.toLowerCase()
    
    // Filter and score addresses
    const scoredAddresses = MOCK_ADDRESS_DB
      .map(addr => ({
        ...addr,
        relevance: calculateRelevance(addr, queryLower)
      }))
      .filter(addr => addr.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(({ relevance, ...addr }) => ({
        ...addr,
        confidence: Math.round(addr.confidence * 100) / 100
      }))

    return NextResponse.json(
      { 
        suggestions: scoredAddresses,
        count: scoredAddresses.length,
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
        count: 0,
        query: '',
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
