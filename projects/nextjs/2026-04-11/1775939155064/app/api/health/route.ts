import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Track server start time for uptime calculation
const START_TIME = Date.now()

// Get version from package.json or environment
const SERVICE_NAME = 'b2b-postal-checkout'
const VERSION = process.env.npm_package_version || '1.0.0'
const ENVIRONMENT = process.env.NODE_ENV || 'development'

interface HealthCheck {
  status: 'connected' | 'disconnected' | 'degraded'
  latency_ms: number
}

interface MemoryInfo {
  used_mb: number
  total_mb: number
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  service: string
  version: string
  uptime_seconds: number
  environment: string
  checks: {
    database: HealthCheck
    memory: MemoryInfo
  }
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthCheck> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      status: 'disconnected',
      latency_ms: 0
    }
  }

  const startTime = Date.now()
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'postal_v2' },
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // Simple query to check connectivity
    const { error } = await supabase
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      console.error('Health check - database error:', error)
      return {
        status: 'disconnected',
        latency_ms: latency
      }
    }
    
    return {
      status: 'connected',
      latency_ms: latency
    }
  } catch (error) {
    console.error('Health check - database exception:', error)
    return {
      status: 'disconnected',
      latency_ms: Date.now() - startTime
    }
  }
}

/**
 * Get memory usage information
 */
function getMemoryInfo(): MemoryInfo {
  const usage = process.memoryUsage()
  
  return {
    used_mb: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100,
    total_mb: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100
  }
}

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns service health status including:
 * - status: 'healthy' | 'unhealthy' | 'degraded'
 * - timestamp: ISO 8601 timestamp
 * - service: service name
 * - version: service version
 * - uptime_seconds: server uptime in seconds
 * - environment: 'development' | 'production' | etc.
 * - checks: {
 *     database: { status: 'connected'|'disconnected', latency_ms: number }
 *     memory: { used_mb: number, total_mb: number }
 *   }
 * 
 * HTTP Status Codes:
 * - 200: All checks passed (healthy)
 * - 503: One or more critical checks failed (unhealthy)
 */
export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString()
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000)
  
  // Run all health checks
  const [dbCheck, memoryInfo] = await Promise.all([
    checkDatabase(),
    Promise.resolve(getMemoryInfo())
  ])
  
  // Determine overall health status
  let status: 'healthy' | 'unhealthy' | 'degraded'
  
  if (dbCheck.status === 'connected' && dbCheck.latency_ms < 20) {
    status = 'healthy'
  } else if (dbCheck.status === 'connected' && dbCheck.latency_ms >= 20) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }
  
  const response: HealthResponse = {
    status,
    timestamp,
    service: SERVICE_NAME,
    version: VERSION,
    uptime_seconds: uptimeSeconds,
    environment: ENVIRONMENT,
    checks: {
      database: dbCheck,
      memory: memoryInfo
    }
  }
  
  const httpStatus = status === 'unhealthy' ? 503 : 200
  
  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}
