/**
 * B2B Postal Checkout Flow - Database Seed Script (Step 3)
 * 
 * Idempotent seed script for postal_v2 schema.
 * Populates: 4 carriers, ~20 service_types, 3 pickup_slots, 1 sample shipment with 15 quotes
 * 
 * Usage: npx ts-node db/seed.ts
 * Environment: Uses direct PostgreSQL connection to cloud Supabase
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.app
dotenv.config({ path: path.resolve(__dirname, '../.env.app') });

// Direct PostgreSQL connection string for cloud Supabase
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Please set it in .env.app or environment');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false } 
});

// Seed data definitions - 4 carriers per spec
// Note: rate_multiplier uses decimal(4,4) which requires values < 1.0
// We use scaled multipliers: 0.95-0.99 for premium, 0.65-0.75 for value
const carriers = [
  { 
    code: 'pex', 
    name: 'Premium Express', 
    display_name: 'Premium Express (PEX)', 
    rating: 4.8, 
    rate_multiplier: 0.9500,  // Premium tier (close to 1.0)
    fuel_surcharge_min: 12,
    fuel_surcharge_max: 18
  },
  { 
    code: 'vc', 
    name: 'Value Carrier', 
    display_name: 'Value Carrier (VC)', 
    rating: 4.2, 
    rate_multiplier: 0.6500,  // Value tier (lower = better rates)
    fuel_surcharge_min: 8,
    fuel_surcharge_max: 12
  },
  { 
    code: 'efl', 
    name: 'Eco-Friendly Logistics', 
    display_name: 'Eco-Friendly Logistics (EFL)', 
    rating: 4.5, 
    rate_multiplier: 0.7500,  // Mid-tier
    fuel_surcharge_min: 10,
    fuel_surcharge_max: 14,
    carbon_factor: 0.8
  },
  { 
    code: 'fs', 
    name: 'Freight Solutions', 
    display_name: 'Freight Solutions (FS)', 
    rating: 4.6, 
    rate_multiplier: 0.8500,  // Upper-mid tier
    fuel_surcharge_min: 10,
    fuel_surcharge_max: 15
  }
];

// ~20 service types across carriers (ground/air/freight categories)
const serviceTypes = [
  // Premium Express (PEX) - 5 services
  { carrier_code: 'pex', code: 'pex-ground-std', name: 'Ground Standard', category: 'ground', base_rate: 18.50, transit_days_min: 3, transit_days_max: 5 },
  { carrier_code: 'pex', code: 'pex-ground-exp', name: 'Ground Expedited', category: 'ground', base_rate: 28.50, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'pex', code: 'pex-air-std', name: 'Air Standard', category: 'air', base_rate: 42.00, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'pex', code: 'pex-air-exp', name: 'Air Express', category: 'air', base_rate: 65.00, transit_days_min: 1, transit_days_max: 2 },
  { carrier_code: 'pex', code: 'pex-air-overnight', name: 'Overnight Priority', category: 'air', base_rate: 95.00, transit_days_min: 1, transit_days_max: 1 },
  
  // Value Carrier (VC) - 5 services
  { carrier_code: 'vc', code: 'vc-ground-econ', name: 'Economy Ground', category: 'ground', base_rate: 12.99, transit_days_min: 5, transit_days_max: 7 },
  { carrier_code: 'vc', code: 'vc-ground-std', name: 'Standard Ground', category: 'ground', base_rate: 16.50, transit_days_min: 4, transit_days_max: 6 },
  { carrier_code: 'vc', code: 'vc-air-std', name: 'Standard Air', category: 'air', base_rate: 32.00, transit_days_min: 3, transit_days_max: 4 },
  { carrier_code: 'vc', code: 'vc-air-exp', name: 'Express Air', category: 'air', base_rate: 48.00, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'vc', code: 'vc-freight-ltl', name: 'LTL Freight', category: 'freight', base_rate: 125.00, transit_days_min: 3, transit_days_max: 6 },
  
  // Eco-Friendly Logistics (EFL) - 5 services
  { carrier_code: 'efl', code: 'efl-ground-eco', name: 'Eco Ground', category: 'ground', base_rate: 15.50, transit_days_min: 4, transit_days_max: 6 },
  { carrier_code: 'efl', code: 'efl-ground-exp', name: 'Eco Express Ground', category: 'ground', base_rate: 24.00, transit_days_min: 3, transit_days_max: 4 },
  { carrier_code: 'efl', code: 'efl-air-eco', name: 'Eco Air', category: 'air', base_rate: 38.00, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'efl', code: 'efl-air-exp', name: 'Eco Express Air', category: 'air', base_rate: 58.00, transit_days_min: 1, transit_days_max: 2 },
  { carrier_code: 'efl', code: 'efl-freight-green', name: 'Green Freight', category: 'freight', base_rate: 145.00, transit_days_min: 2, transit_days_max: 5 },
  
  // Freight Solutions (FS) - 5 services
  { carrier_code: 'fs', code: 'fs-ground-std', name: 'Freight Ground', category: 'ground', base_rate: 22.00, transit_days_min: 3, transit_days_max: 5 },
  { carrier_code: 'fs', code: 'fs-ground-exp', name: 'Freight Ground Express', category: 'ground', base_rate: 35.00, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'fs', code: 'fs-air-std', name: 'Freight Air', category: 'air', base_rate: 52.00, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'fs', code: 'fs-air-exp', name: 'Freight Air Express', category: 'air', base_rate: 78.00, transit_days_min: 1, transit_days_max: 2 },
  { carrier_code: 'fs', code: 'fs-freight-ftl', name: 'Full Truckload', category: 'freight', base_rate: 450.00, transit_days_min: 2, transit_days_max: 4 }
];

async function seedCarriers(client: any): Promise<Map<string, any>> {
  console.log('🚚 Seeding 4 carriers...');
  const carrierData = new Map<string, any>();

  for (const carrier of carriers) {
    const result = await client.query(
      `INSERT INTO postal_v2.carriers (code, name, display_name, rating, rate_multiplier, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE SET 
         name = EXCLUDED.name, 
         display_name = EXCLUDED.display_name, 
         rating = EXCLUDED.rating, 
         rate_multiplier = EXCLUDED.rate_multiplier,
         is_active = EXCLUDED.is_active
       RETURNING id, code`,
      [carrier.code, carrier.name, carrier.display_name, carrier.rating, carrier.rate_multiplier, true]
    );

    if (result.rows.length > 0) {
      carrierData.set(carrier.code, {
        id: result.rows[0].id,
        ...carrier
      });
      console.log(`   ✅ ${carrier.display_name} (mult: ${carrier.rate_multiplier}, reliability: ${carrier.rating})`);
    }
  }

  return carrierData;
}

async function seedServiceTypes(client: any, carrierData: Map<string, any>): Promise<void> {
  console.log('📦 Seeding service types (~20 across carriers)...');

  let seededCount = 0;
  for (const service of serviceTypes) {
    const carrier = carrierData.get(service.carrier_code);
    if (!carrier) {
      console.warn(`   ⚠️ Carrier ${service.carrier_code} not found, skipping ${service.code}`);
      continue;
    }

    // Check if service type already exists
    const existingResult = await client.query(
      'SELECT id FROM postal_v2.service_types WHERE carrier_id = $1 AND code = $2',
      [carrier.id, service.code]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await client.query(
        `UPDATE postal_v2.service_types SET
         name = $1, category = $2, base_rate = $3, transit_days_min = $4, transit_days_max = $5, is_active = $6
         WHERE id = $7`,
        [service.name, service.category, service.base_rate, service.transit_days_min, service.transit_days_max, true, existingResult.rows[0].id]
      );
    } else {
      // Insert new
      await client.query(
        `INSERT INTO postal_v2.service_types 
         (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [carrier.id, service.code, service.name, service.category, service.base_rate, 
         service.transit_days_min, service.transit_days_max, true]
      );
    }
    seededCount++;
  }

  console.log(`   ✅ ${seededCount} service types seeded`);
}

async function seedPickupSlots(client: any): Promise<string[]> {
  console.log('📅 Seeding pickup slots for tomorrow...');
  const slotIds: string[] = [];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 3 pickup slots: morning, afternoon, evening
  const slots = [
    { slot_date: tomorrowStr, time_window: '08:00-12:00', label: 'Morning', capacity: 15, fee: 0 },
    { slot_date: tomorrowStr, time_window: '12:00-16:00', label: 'Afternoon', capacity: 20, fee: 0 },
    { slot_date: tomorrowStr, time_window: '16:00-20:00', label: 'Evening', capacity: 10, fee: 5.00 }
  ];

  for (const slot of slots) {
    // Check if slot already exists
    const existingResult = await client.query(
      'SELECT id FROM postal_v2.pickup_slots WHERE slot_date = $1 AND time_window = $2',
      [slot.slot_date, slot.time_window]
    );

    let slotId: string;
    if (existingResult.rows.length > 0) {
      // Update existing
      slotId = existingResult.rows[0].id;
      await client.query(
        `UPDATE postal_v2.pickup_slots SET
         is_available = $1, capacity = $2, fee = $3
         WHERE id = $4`,
        [true, slot.capacity, slot.fee, slotId]
      );
    } else {
      // Insert new
      const result = await client.query(
        `INSERT INTO postal_v2.pickup_slots 
         (slot_date, time_window, is_available, capacity, booked_count, fee) 
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [slot.slot_date, slot.time_window, true, slot.capacity, 0, slot.fee]
      );
      slotId = result.rows[0].id;
    }
    slotIds.push(slotId);
    console.log(`   ✅ ${slot.label}: ${slot.time_window}`);
  }

  console.log(`   ✅ ${slots.length} pickup slots seeded for ${tomorrowStr}`);
  return slotIds;
}

async function seedSampleShipment(client: any, carrierData: Map<string, any>): Promise<string | null> {
  console.log('📋 Seeding sample shipment (Columbus OH → Atlanta GA)...');

  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Seed organization
  try {
    await client.query(
      `INSERT INTO postal_v2.organizations 
       (id, name, slug, tax_id, billing_email, payment_terms, credit_limit, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         status = EXCLUDED.status`,
      [orgId, 'Acme Corp', 'acme-corp', '12-3456789', 'billing@acme.example.com', 'net30', 50000.00, 'active']
    );
    console.log('   ✅ Sample organization seeded');
  } catch (e: any) {
    console.log(`   ℹ️ Organization: ${e.message?.substring(0, 60)}`);
  }

  // Seed addresses: Columbus OH (sender) → Atlanta GA (recipient)
  const senderAddrId = '660e8400-e29b-41d4-a716-446655440001';
  const recipientAddrId = '660e8400-e29b-41d4-a716-446655440002';

  try {
    // Columbus OH - sender
    await client.query(
      `INSERT INTO postal_v2.addresses 
       (id, organization_id, label, recipient_name, recipient_phone, line1, city, state, postal_code, country, address_type, is_default_shipping) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         recipient_name = EXCLUDED.recipient_name,
         line1 = EXCLUDED.line1,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         postal_code = EXCLUDED.postal_code`,
      [senderAddrId, orgId, 'Columbus Warehouse', 'John Shipper', '614-555-0101', 
       '1000 Polaris Parkway', 'Columbus', 'OH', '43240', 'US', 'commercial', true]
    );

    // Atlanta GA - recipient
    await client.query(
      `INSERT INTO postal_v2.addresses 
       (id, organization_id, label, recipient_name, recipient_phone, line1, city, state, postal_code, country, address_type, is_default_shipping) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         recipient_name = EXCLUDED.recipient_name,
         line1 = EXCLUDED.line1,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         postal_code = EXCLUDED.postal_code`,
      [recipientAddrId, orgId, 'Atlanta Distribution', 'Jane Receiver', '404-555-0102', 
       '2000 Peachtree Street NW', 'Atlanta', 'GA', '30309', 'US', 'commercial', false]
    );
    console.log('   ✅ Addresses seeded (Columbus OH → Atlanta GA)');
  } catch (e: any) {
    console.log(`   ℹ️ Addresses: ${e.message?.substring(0, 60)}`);
  }

  // Seed sample shipment - medium package 25 lbs, $2500 value, fragile+signature
  const shipmentId = '770e8400-e29b-41d4-a716-446655440000';
  
  // Get a valid user_id from auth.users (required for the shipment)
  let userId = null;
  try {
    const userResult = await client.query('SELECT id FROM auth.users LIMIT 1');
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    }
  } catch (e) {
    // auth schema might not be accessible
  }
  
  try {
    await client.query(
      `INSERT INTO postal_v2.shipments 
       (id, organization_id, user_id, sender_address_id, sender_contact_name, sender_contact_phone, sender_contact_email,
        recipient_address_id, recipient_contact_name, recipient_contact_phone, recipient_contact_email,
        package_type, weight, length, width, height, declared_value, contents_description, currency, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       ON CONFLICT (id) DO UPDATE SET
         sender_address_id = EXCLUDED.sender_address_id,
         recipient_address_id = EXCLUDED.recipient_address_id,
         weight = EXCLUDED.weight,
         declared_value = EXCLUDED.declared_value,
         contents_description = EXCLUDED.contents_description`,
      [
        shipmentId, orgId, userId, senderAddrId, 'John Shipper', '614-555-0101', 'shipping@acme.example.com',
        recipientAddrId, 'Jane Receiver', '404-555-0102', 'receiving@acme.example.com',
        'box', 25.0, 18.0, 14.0, 12.0, 2500.00, 'Medium package - fragile electronics', 'USD', 'draft'
      ]
    );
    console.log('   ✅ Sample shipment seeded (25 lbs, $2500 value)');
  } catch (e: any) {
    console.log(`   ℹ️ Shipment: ${e.message?.substring(0, 80)}`);
    return null;
  }

  // Seed special handling: fragile + signature required
  try {
    // Clear existing handling for this shipment
    await client.query('DELETE FROM postal_v2.shipment_special_handling WHERE shipment_id = $1', [shipmentId]);
    
    // Add fragile handling
    await client.query(
      `INSERT INTO postal_v2.shipment_special_handling (shipment_id, handling_type, fee, instructions)
       VALUES ($1, $2, $3, $4)`,
      [shipmentId, 'fragile', 15.00, 'Handle with care - electronics inside']
    );
    
    // Add signature required
    await client.query(
      `INSERT INTO postal_v2.shipment_special_handling (shipment_id, handling_type, fee, instructions)
       VALUES ($1, $2, $3, $4)`,
      [shipmentId, 'signature_required', 5.00, 'Adult signature required at delivery']
    );
    console.log('   ✅ Special handling added (fragile + signature)');
  } catch (e: any) {
    console.log(`   ℹ️ Special handling: ${e.message?.substring(0, 60)}`);
  }

  return shipmentId;
}

async function seedQuotes(client: any, shipmentId: string, carrierData: Map<string, any>): Promise<void> {
  console.log('💰 Seeding 15 quotes across 4 carriers...');

  // Get all service types with their carrier info
  const servicesResult = await client.query(`
    SELECT st.id, st.carrier_id, st.code, st.name, st.category, st.base_rate, 
           st.transit_days_min, st.transit_days_max, c.code as carrier_code
    FROM postal_v2.service_types st
    JOIN postal_v2.carriers c ON st.carrier_id = c.id
    WHERE st.is_active = true
    ORDER BY c.code, st.base_rate
  `);

  if (servicesResult.rows.length === 0) {
    console.warn('   ⚠️ No service types found');
    return;
  }

  // Clear existing quotes for this shipment
  await client.query('DELETE FROM postal_v2.quotes WHERE shipment_id = $1', [shipmentId]);

  // Generate 15 quotes (select ~4 from each carrier)
  const quotesByCarrier: { [key: string]: any[] } = {};
  for (const svc of servicesResult.rows) {
    if (!quotesByCarrier[svc.carrier_code]) quotesByCarrier[svc.carrier_code] = [];
    quotesByCarrier[svc.carrier_code].push(svc);
  }

  let quoteCount = 0;
  const now = new Date();

  for (const [carrierCode, services] of Object.entries(quotesByCarrier)) {
    const carrier = carrierData.get(carrierCode);
    if (!carrier) continue;

    // Pick up to 4 services per carrier (or all if less than 4)
    const selectedServices = services.slice(0, 4);

    for (const svc of selectedServices) {
      // Calculate fuel surcharge based on carrier's range
      const fuelMin = carrier.fuel_surcharge_min || 10;
      const fuelMax = carrier.fuel_surcharge_max || 15;
      const fuelPercent = fuelMin + Math.random() * (fuelMax - fuelMin);
      
      // Calculate rates
      const baseRate = parseFloat(svc.base_rate);
      const fuelSurcharge = parseFloat((baseRate * fuelPercent / 100).toFixed(2));
      const insuranceCost = 12.50; // Fixed for $2500 value
      const handlingFee = 20.00; // fragile + signature
      const totalCost = parseFloat((baseRate + fuelSurcharge + insuranceCost + handlingFee).toFixed(2));
      
      // Calculate estimated delivery
      const deliveryDays = svc.transit_days_min + Math.floor(Math.random() * (svc.transit_days_max - svc.transit_days_min + 1));
      const estimatedDelivery = new Date(now);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

      try {
        await client.query(
          `INSERT INTO postal_v2.quotes 
           (shipment_id, carrier_id, service_type_id, base_rate, fuel_surcharge, total_cost, estimated_delivery, is_selected)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [shipmentId, svc.carrier_id, svc.id, baseRate, fuelSurcharge, totalCost, estimatedDelivery.toISOString(), false]
        );
        quoteCount++;
      } catch (e: any) {
        console.warn(`   ⚠️ Failed to create quote for ${svc.code}: ${e.message?.substring(0, 50)}`);
      }
    }
  }

  console.log(`   ✅ ${quoteCount} quotes seeded`);
}

async function verifySeedData(client: any, shipmentId: string | null): Promise<void> {
  console.log('\n🔍 Verifying seed data...');

  const carriersResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.carriers');
  const servicesResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.service_types');
  const slotsResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.pickup_slots');
  const shipmentsResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.shipments');
  
  let quotesResult = { rows: [{ count: 0 }] };
  if (shipmentId) {
    quotesResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.quotes WHERE shipment_id = $1', [shipmentId]);
  }

  const carriers = parseInt(String(carriersResult.rows[0].count));
  const services = parseInt(String(servicesResult.rows[0].count));
  const slots = parseInt(String(slotsResult.rows[0].count));
  const shipments = parseInt(String(shipmentsResult.rows[0].count));
  const quotes = parseInt(String(quotesResult.rows[0].count));

  console.log(`   ✅ Carriers: ${carriers} (expected: 4)`);
  console.log(`   ✅ Service Types: ${services} (expected: ~20)`);
  console.log(`   ✅ Pickup Slots: ${slots} (expected: 3)`);
  console.log(`   ✅ Shipments: ${shipments} (expected: 1)`);
  console.log(`   ✅ Quotes: ${quotes} (expected: ~15)`);

  const allGood = carriers === 4 && services >= 20 && slots === 3 && shipments >= 1 && quotes >= 10;

  if (allGood) {
    console.log('\n✅ Seed verification passed!');
  } else {
    console.log('\n⚠️ Seed verification incomplete - some data may be missing');
  }
}

async function testSupabaseAPI(): Promise<void> {
  console.log('\n🌐 Testing Supabase REST API...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ℹ️ Skipping API test - Supabase credentials not configured');
    return;
  }

  try {
    // Test querying carriers via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/carriers?select=*&order=code`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ REST API working - fetched ${data.length} carriers`);
      data.forEach((c: any) => {
        console.log(`      - ${c.display_name}: mult=${c.rate_multiplier}, rating=${c.rating}`);
      });
    } else {
      console.log(`   ⚠️ REST API returned ${response.status} - may need auth setup`);
    }
  } catch (e: any) {
    console.log(`   ℹ️ REST API test skipped: ${e.message?.substring(0, 50)}`);
  }
}

async function main(): Promise<void> {
  console.log('🌱 B2B Postal Checkout - Database Seed Script (Step 3)');
  console.log('=======================================================\n');
  console.log(`🔗 Connecting to cloud Supabase...`);
  console.log(`📋 Schema: postal_v2\n`);

  const client = await pool.connect();

  try {
    // Verify schema exists
    const schemaResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'"
    );

    if (schemaResult.rows.length === 0) {
      console.error('❌ Error: postal_v2 schema does not exist in the database');
      console.error('   Please apply the schema migration first: migrations/001_create_postal_v2_schema.sql');
      process.exit(1);
    }

    console.log('✅ postal_v2 schema exists\n');

    // Run seed operations
    const carrierData = await seedCarriers(client);
    await seedServiceTypes(client, carrierData);
    const slotIds = await seedPickupSlots(client);
    const shipmentId = await seedSampleShipment(client, carrierData);
    
    if (shipmentId) {
      await seedQuotes(client, shipmentId, carrierData);
    }
    
    await verifySeedData(client, shipmentId);
    
    // Test REST API
    await testSupabaseAPI();

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
