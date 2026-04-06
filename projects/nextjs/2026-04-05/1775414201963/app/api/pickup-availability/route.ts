/**
 * B2B Postal Checkout Flow - Pickup Availability API
 * GET /api/pickup-availability - Get available pickup dates and time slots
 * 
 * Query Parameters:
 * - zip_code: string (required) - ZIP code for service area lookup
 * - date: string (optional) - Specific date for time slots (YYYY-MM-DD)
 * - start_date: string (optional) - Start of date range (YYYY-MM-DD)
 * - end_date: string (optional) - End of date range (YYYY-MM-DD)
 * - service_level: string (optional) - Service level (standard, premium)
 * 
 * Response:
 * - If date provided: Time slots for that date
 * - If date range provided: Available dates in range
 * - Default: 90-day availability calendar
 */

import { NextRequest, NextResponse } from "next/server";
import {
  successResponse,
  errors,
  noCacheHeaders,
  cacheHeaders,
} from "@/lib/api/response";
import {
  calculatePickupAvailability,
  getTimeSlotsForDate,
  isValidServiceArea,
  getServiceAreaZone,
  getServiceAreaConfig,
  calculatePickupFees,
  type ServiceAreaZone,
} from "@/lib/pickup/availability";
import type {
  PickupAvailabilityResponse,
  TimeSlotsResponse,
} from "@/types/pickup";

export const dynamic = "force-dynamic";

// ============================================
// VALIDATION
// ============================================

function validateDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + "T00:00:00");
  return !isNaN(date.getTime());
}

// ============================================
// GET HANDLER
// ============================================

/**
 * GET /api/pickup-availability
 * Get pickup availability based on ZIP code and optional date/range
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const zipCode = searchParams.get("zip_code");
  const date = searchParams.get("date");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const serviceLevel = searchParams.get("service_level") || "standard";
  
  // Validate required parameters
  if (!zipCode) {
    return errors.validation("ZIP code is required", {
      zip_code: ["ZIP code parameter is required"],
    });
  }
  
  // Validate ZIP code format
  if (!isValidServiceArea(zipCode)) {
    return errors.validation("Invalid ZIP code", {
      zip_code: ["Please provide a valid 5-digit ZIP code"],
    });
  }
  
  // Validate service level
  const validServiceLevels = ["standard", "premium", "enterprise"];
  if (!validServiceLevels.includes(serviceLevel)) {
    return errors.validation("Invalid service level", {
      service_level: [`Must be one of: ${validServiceLevels.join(", ")}`],
    });
  }
  
  try {
    // Get service area info
    const zone = getServiceAreaZone(zipCode);
    const zoneConfig = getServiceAreaConfig(zone);
    
    // If specific date provided, return time slots for that date
    if (date) {
      if (!validateDateFormat(date)) {
        return errors.validation("Invalid date format", {
          date: ["Date must be in YYYY-MM-DD format"],
        });
      }
      
      const slotsResponse = getTimeSlotsForDate(date, zipCode, serviceLevel);
      
      // Calculate fees for each slot
      const slotsWithFees = slotsResponse.slots.map((group) => ({
        ...group,
        slots: group.slots.map((slot) => {
          const fees = calculatePickupFees(date, slot.id, zipCode, serviceLevel);
          return {
            ...slot,
            fee: fees.totalFee,
            feeBreakdown: {
              baseFee: fees.baseFee,
              weekendFee: fees.weekendFee,
              eveningFee: fees.eveningFee,
              remoteAreaFee: fees.remoteAreaFee,
            },
          };
        }),
      }));
      
      const response = {
        date,
        zip_code: zipCode,
        service_level: serviceLevel,
        service_area: {
          zone,
          description: zoneConfig.description,
        },
        slots: slotsWithFees,
      };
      
      return successResponse(response, 200, {
        ...cacheHeaders(300), // Cache for 5 minutes
      });
    }
    
    // If date range provided, return availability for that range
    if (startDate && endDate) {
      if (!validateDateFormat(startDate) || !validateDateFormat(endDate)) {
        return errors.validation("Invalid date format", {
          date: ["Dates must be in YYYY-MM-DD format"],
        });
      }
      
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      
      if (end < start) {
        return errors.validation("Invalid date range", {
          end_date: ["End date must be after start date"],
        });
      }
      
      const maxRangeDays = 90;
      const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff > maxRangeDays) {
        return errors.validation("Date range too large", {
          date_range: [`Maximum range is ${maxRangeDays} days`],
        });
      }
      
      const availability = calculatePickupAvailability({
        zipCode,
        serviceLevel,
        referenceDate: start,
        maxAdvanceDays: dayDiff + 1,
      });
      
      const response = {
        start_date: startDate,
        end_date: endDate,
        zip_code: zipCode,
        service_level: serviceLevel,
        service_area: {
          zone,
          description: zoneConfig.description,
        },
        ...availability,
      };
      
      return successResponse(response, 200, {
        ...cacheHeaders(300),
      });
    }
    
    // Default: return 90-day availability calendar
    const availability = calculatePickupAvailability({
      zipCode,
      serviceLevel,
    });
    
    const response = {
      zip_code: zipCode,
      service_level: serviceLevel,
      service_area: {
        zone,
        description: zoneConfig.description,
        weekend_available: zoneConfig.weekendPickupAvailable,
        evening_available: zoneConfig.eveningPickupAvailable,
        min_lead_time_days: zoneConfig.minLeadTimeDays,
      },
      ...availability,
    };
    
    return successResponse(response, 200, {
      ...cacheHeaders(300),
    });
    
  } catch (error) {
    console.error("Error calculating pickup availability:", error);
    return errors.internal("Failed to calculate pickup availability");
  }
}

// ============================================
// POST HANDLER (for bulk requests)
// ============================================

/**
 * POST /api/pickup-availability
 * Bulk availability check for multiple dates or locations
 * 
 * Request Body:
 * {
 *   requests: [
 *     { zip_code: "10001", date: "2026-04-15", service_level: "standard" },
 *     { zip_code: "90210", date: "2026-04-16", service_level: "premium" }
 *   ]
 * }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    if (!body.requests || !Array.isArray(body.requests)) {
      return errors.validation("Invalid request format", {
        requests: ["Array of requests is required"],
      });
    }
    
    if (body.requests.length > 10) {
      return errors.validation("Too many requests", {
        requests: ["Maximum 10 requests per batch"],
      });
    }
    
    const results = await Promise.all(
      body.requests.map(async (req: { zip_code: string; date?: string; service_level?: string }) => {
        const { zip_code, date, service_level = "standard" } = req;
        
        if (!isValidServiceArea(zip_code)) {
          return {
            zip_code,
            error: "Invalid ZIP code",
            available: false,
          };
        }
        
        const zone = getServiceAreaZone(zip_code);
        const zoneConfig = getServiceAreaConfig(zone);
        
        if (date) {
          const slotsResponse = getTimeSlotsForDate(date, zip_code, service_level);
          const availableSlots = slotsResponse.slots.flatMap((g) =>
            g.slots.filter((s) => s.available)
          );
          
          return {
            zip_code,
            date,
            service_level,
            service_area: {
              zone,
              description: zoneConfig.description,
            },
            available: availableSlots.length > 0,
            available_slots_count: availableSlots.length,
          };
        }
        
        return {
          zip_code,
          service_level,
          service_area: {
            zone,
            description: zoneConfig.description,
            weekend_available: zoneConfig.weekendPickupAvailable,
            evening_available: zoneConfig.eveningPickupAvailable,
          },
        };
      })
    );
    
    return successResponse({ results }, 200, noCacheHeaders);
    
  } catch (error) {
    console.error("Error processing bulk availability request:", error);
    return errors.internal("Failed to process availability requests");
  }
}

// ============================================
// OPTIONS HANDLER (CORS)
// ============================================

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
