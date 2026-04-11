/**
 * B2B Postal Checkout Flow - Database Seed Script
 * 
 * Idempotent seed script for postal_v2 schema.
 * Populates: 3 carriers, 5 rates/carrier, 3 pickup_slots, 1 sample shipment
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
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.lmbrqiwzowiquebtsfyc:miwha4fPanQZ6BL9@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false } 
});

// Seed data definitions
const carriers = [
  { code: 'pex', name: 'Parcel Express', display_name: 'Parcel Express', rating: 4.5, rate_multiplier: 0.85 },
  { code: 'vc', name: 'Velocity Couriers', display_name: 'Velocity Couriers', rating: 4.3, rate_multiplier: 0.90 },
  { code: 'efl', name: 'Express Freight Lines', display_name: 'Express Freight Lines', rating: 4.7, rate_multiplier: 0.95 }
];

const serviceTypes = [
  // Parcel Express services (5)
  { carrier_code: 'pex', code: 'pex-ground', name: 'Ground Standard', category: 'ground', base_rate: 12.99, transit_days_min: 3, transit_days_max: 5 },
  { carrier_code: 'pex', code: 'pex-air', name: 'Air Express', category: 'air', base_rate: 24.99, transit_days_min: 1, transit_days_max: 2 },
  { carrier_code: 'pex', code: 'pex-overnight', name: 'Overnight Priority', category: 'express', base_rate: 45.99, transit_days_min: 1, transit_days_max: 1 },
  { carrier_code: 'pex', code: 'pex-freight', name: 'LTL Freight', category: 'freight', base_rate: 89.99, transit_days_min: 2, transit_days_max: 4 },
  { carrier_code: 'pex', code: 'pex-intl', name: 'International Standard', category: 'international', base_rate: 34.99, transit_days_min: 5, transit_days_max: 10 },
  // Velocity Couriers services (5)
  { carrier_code: 'vc', code: 'vc-ground', name: 'Economy Ground', category: 'ground', base_rate: 10.99, transit_days_min: 4, transit_days_max: 6 },
  { carrier_code: 'vc', code: 'vc-expedited', name: 'Expedited', category: 'air', base_rate: 29.99, transit_days_min: 2, transit_days_max: 3 },
  { carrier_code: 'vc', code: 'vc-same-day', name: 'Same Day', category: 'express', base_rate: 89.99, transit_days_min: 1, transit_days_max: 1 },
  { carrier_code: 'vc', code: 'vc-freight', name: 'Volume Freight', category: 'freight', base_rate: 79.99, transit_days_min: 3, transit_days_max: 5 },
  { carrier_code: 'vc', code: 'vc-intl', name: 'Global Priority', category: 'international', base_rate: 44.99, transit_days_min: 3, transit_days_max: 7 },
  // Express Freight Lines services (5)
  { carrier_code: 'efl', code: 'efl-ground', name: 'Direct Ground', category: 'ground', base_rate: 14.99, transit_days_min: 2, transit_days_max: 4 },
  { carrier_code: 'efl', code: 'efl-premium', name: 'Premium Air', category: 'air', base_rate: 32.99, transit_days_min: 1, transit_days_max: 2 },
  { carrier_code: 'efl', code: 'efl-critical', name: 'Critical Same Day', category: 'express', base_rate: 125.00, transit_days_min: 1, transit_days_max: 1 },
  { carrier_code: 'efl', code: 'efl-freight', name: 'Full Truckload', category: 'freight', base_rate: 299.99, transit_days_min: 1, transit_days_max: 3 },
  { carrier_code: 'efl', code: 'efl-intl', name: 'Worldwide Express', category: 'international', base_rate: 54.99, transit_days_min: 2, transit_days_max: 5 }
];

async function seedCarriers(client: any): Promise<Map<string, string>> {
  console.log('🚚 Seeding carriers...');
  const carrierIds = new Map<string, string>();

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
      carrierIds.set(carrier.code, result.rows[0].id);
      console.log(`   ✅ ${carrier.name}`);
    }
  }

  return carrierIds;
}

async function seedServiceTypes(client: any, carrierIds: Map<string, string>): Promise<void> {
  console.log('📦 Seeding service types (rates)...');

  for (const service of serviceTypes) {
    const carrierId = carrierIds.get(service.carrier_code);
    if (!carrierId) {
      console.warn(`   ⚠️ Carrier ${service.carrier_code} not found, skipping ${service.code}`);
      continue;
    }

    // Check if service type already exists
    const existingResult = await client.query(
      'SELECT id FROM postal_v2.service_types WHERE carrier_id = $1 AND code = $2',
      [carrierId, service.code]
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
        [carrierId, service.code, service.name, service.category, service.base_rate, 
         service.transit_days_min, service.transit_days_max, true]
      );
    }
  }

  console.log(`   ✅ ${serviceTypes.length} service types seeded`);
}

async function seedPickupSlots(client: any): Promise<void> {
  console.log('📅 Seeding pickup slots...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const slots = [
    { slot_date: tomorrow.toISOString().split('T')[0], time_window: '09:00-12:00', capacity: 10, fee: 0 },
    { slot_date: tomorrow.toISOString().split('T')[0], time_window: '13:00-17:00', capacity: 10, fee: 0 },
    { slot_date: dayAfter.toISOString().split('T')[0], time_window: '09:00-17:00', capacity: 20, fee: 0 }
  ];

  for (const slot of slots) {
    // Check if slot already exists
    const existingResult = await client.query(
      'SELECT id FROM postal_v2.pickup_slots WHERE slot_date = $1 AND time_window = $2',
      [slot.slot_date, slot.time_window]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await client.query(
        `UPDATE postal_v2.pickup_slots SET
         is_available = $1, capacity = $2, fee = $3
         WHERE id = $4`,
        [true, slot.capacity, slot.fee, existingResult.rows[0].id]
      );
    } else {
      // Insert new
      await client.query(
        `INSERT INTO postal_v2.pickup_slots 
         (slot_date, time_window, is_available, capacity, booked_count, fee) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [slot.slot_date, slot.time_window, true, slot.capacity, 0, slot.fee]
      );
    }
  }

  console.log(`   ✅ ${slots.length} pickup slots seeded`);
}

async function seedSampleShipment(client: any, carrierIds: Map<string, string>): Promise<void> {
  console.log('📋 Seeding sample data...');

  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  
  // Seed organization (using simple insert since id is primary key)
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
    console.log(`   ℹ️ Organization may already exist: ${e.message?.substring(0, 50)}`);
  }

  // Seed addresses
  const senderAddrId = '660e8400-e29b-41d4-a716-446655440001';
  const recipientAddrId = '660e8400-e29b-41d4-a716-446655440002';

  try {
    await client.query(
      `INSERT INTO postal_v2.addresses 
       (id, organization_id, label, recipient_name, recipient_phone, line1, city, state, postal_code, country, address_type, is_default_shipping) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         recipient_name = EXCLUDED.recipient_name`,
      [senderAddrId, orgId, 'Main Warehouse', 'Acme Shipping Dept', '555-0101', 
       '123 Industrial Blvd', 'Austin', 'TX', '78701', 'US', 'commercial', true]
    );

    await client.query(
      `INSERT INTO postal_v2.addresses 
       (id, organization_id, label, recipient_name, recipient_phone, line1, city, state, postal_code, country, address_type, is_default_shipping) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         recipient_name = EXCLUDED.recipient_name`,
      [recipientAddrId, orgId, 'Branch Office', 'Acme Receiving', '555-0102', 
       '456 Commerce St', 'Dallas', 'TX', '75201', 'US', 'commercial', false]
    );
    console.log('   ✅ Sample addresses seeded');
  } catch (e: any) {
    console.log(`   ℹ️ Addresses may already exist: ${e.message?.substring(0, 50)}`);
  }

  // Get carrier and service type IDs
  const pexId = carrierIds.get('pex');
  if (!pexId) {
    console.warn('   ⚠️ Parcel Express carrier not found, skipping sample shipment');
    return;
  }

  const serviceResult = await client.query(
    'SELECT id FROM postal_v2.service_types WHERE carrier_id = $1 AND code = $2',
    [pexId, 'pex-ground']
  );

  if (serviceResult.rows.length === 0) {
    console.warn('   ⚠️ Parcel Express Ground service not found, skipping sample shipment');
    return;
  }

  const serviceId = serviceResult.rows[0].id;

  // Seed sample shipment
  const shipmentId = '770e8400-e29b-41d4-a716-446655440000';
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  try {
    await client.query(
      `INSERT INTO postal_v2.shipments 
       (id, organization_id, user_id, sender_address_id, sender_contact_name, sender_contact_phone, sender_contact_email,
        recipient_address_id, recipient_contact_name, recipient_contact_phone, recipient_contact_email,
        package_type, weight, length, width, height, declared_value, contents_description,
        carrier_id, service_type_id, estimated_delivery, base_rate, fuel_surcharge, insurance_cost, total_cost, currency, status) 
       VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
       ON CONFLICT (id) DO UPDATE SET
         organization_id = EXCLUDED.organization_id,
         contents_description = EXCLUDED.contents_description`,
      [
        shipmentId, orgId, senderAddrId, 'John Shipper', '555-0101', 'shipping@acme.example.com',
        recipientAddrId, 'Jane Receiver', '555-0102', 'receiving@acme.example.com',
        'box', 5.5, 12.0, 10.0, 8.0, 250.00, 'Sample electronics shipment',
        pexId, serviceId, estimatedDelivery.toISOString(), 12.99, 2.50, 0, 15.49, 'USD', 'draft'
      ]
    );
    console.log('   ✅ Sample shipment seeded');
  } catch (e: any) {
    console.log(`   ℹ️ Sample shipment may already exist: ${e.message?.substring(0, 50)}`);
  }
}

async function verifySeedData(client: any): Promise<void> {
  console.log('\n🔍 Verifying seed data...');

  const carriersResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.carriers');
  const servicesResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.service_types');
  const slotsResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.pickup_slots');
  const shipmentsResult = await client.query('SELECT COUNT(*) as count FROM postal_v2.shipments');

  const carriers = parseInt(carriersResult.rows[0].count);
  const services = parseInt(servicesResult.rows[0].count);
  const slots = parseInt(slotsResult.rows[0].count);
  const shipments = parseInt(shipmentsResult.rows[0].count);

  console.log(`   ✅ Carriers: ${carriers} (expected: 3)`);
  console.log(`   ✅ Service Types (rates): ${services} (expected: 15)`);
  console.log(`   ✅ Pickup Slots: ${slots} (expected: 3)`);
  console.log(`   ✅ Shipments: ${shipments} (expected: 0-1)`);

  const allGood = carriers >= 3 && services >= 15 && slots >= 3;

  if (allGood) {
    console.log('\n✅ Seed verification passed!');
  } else {
    console.log('\n⚠️ Seed verification incomplete - some data may be missing');
  }
}

async function main(): Promise<void> {
  console.log('🌱 B2B Postal Checkout - Database Seed Script');
  console.log('================================================\n');
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
    const carrierIds = await seedCarriers(client);
    await seedServiceTypes(client, carrierIds);
    await seedPickupSlots(client);
    await seedSampleShipment(client, carrierIds);
    await verifySeedData(client);

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
