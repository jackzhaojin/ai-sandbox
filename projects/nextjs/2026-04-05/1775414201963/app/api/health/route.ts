/**
 * B2B Postal Checkout Flow - Health Check API
 * GET /api/health - Service health check with database connectivity test
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, errors, cacheHeaders } from '@/lib/api/response';
import { ApiErrorCodes } from '@/types/api';
import type { HealthCheckData } from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Returns service health status including database connectivity
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  
  // Check database connectivity
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const supabase = await createClient();
    const dbStartTime = Date.now();
    
    // Simple query to test connection
    const { error } = await supabase.from('carriers').select('id').limit(1);
    
    dbLatencyMs = Date.now() - dbStartTime;
    
    if (!error) {
      dbStatus = 'connected';
    } else {
      console.error('Database health check failed:', error);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    dbLatencyMs = Date.now() - startTime;
  }

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (dbStatus === 'disconnected') {
    status = 'unhealthy';
  } else if (dbLatencyMs > 1000) {
    status = 'degraded';
  }

  const healthData: HealthCheckData = {
    status,
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      api: {
        status: status === 'healthy' ? 'operational' : status === 'degraded' ? 'degraded' : 'down',
      },
    },
  };

  // Return appropriate status code based on health
  if (status === 'unhealthy') {
    return errorResponse(
      ApiErrorCodes.CONNECTION_ERROR,
      'Service is unhealthy',
      undefined,
      503
    );
  }

  // Short cache for health checks (10 seconds)
  return successResponse(healthData, 200, cacheHeaders(10));
}
