#!/usr/bin/env tsx
/**
 * Database Seed Script
 * Idempotent seeding of carriers, service types, and sample data
 */

import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.app
dotenv.config({ path: resolve(process.cwd(), '.env.app') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Carrier definitions
const CARRIERS = [
  {
    code: 'pex',
    name: 'Parcel Express',
    display_name: 'PEX - Parcel Express',
    description: 'Reliable ground shipping with competitive rates',
    base_rate_multiplier: 1.0,
    fuel_surcharge_multiplier: 1.0,
    reliability_rating: 4.5,
    speed_rating: 4.0,
    value_rating: 4.5,
    customer_service_rating: 4.3,
    sort_order: 1,
  },
  {
    code: 'vc',
    name: 'Velocity Courier',
    display_name: 'VC - Velocity Courier',
    description: 'Premium express and overnight delivery services',
    base_rate_multiplier: 1.15,
    fuel_surcharge_multiplier: 1.1,
    reliability_rating: 4.8,
    speed_rating: 4.9,
    value_rating: 3.8,
    customer_service_rating: 4.6,
    sort_order: 2,
  },
  {
    code: 'efl',
    name: 'Eagle Freight Lines',
    display_name: 'EFL - Eagle Freight Lines',
    description: 'LTL and FTL freight solutions for heavy shipments',
    base_rate_multiplier: 0.9,
    fuel_surcharge_multiplier: 0.95,
    reliability_rating: 4.2,
    speed_rating: 3.8,
    value_rating: 4.7,
    customer_service_rating: 4.1,
    sort_order: 3,
  },
  {
    code: 'fs',
    name: 'FastShip Global',
    display_name: 'FS - FastShip Global',
    description: 'International and cross-border shipping specialists',
    base_rate_multiplier: 1.2,
    fuel_surcharge_multiplier: 1.15,
    reliability_rating: 4.0,
    speed_rating: 4.2,
    value_rating: 3.9,
    customer_service_rating: 3.8,
    sort_order: 4,
  },
];

// Service type definitions by carrier
const SERVICE_TYPES = {
  pex: [
    { code: 'PEX_GROUND', name: 'Standard Ground', display_name: 'PEX Standard Ground', category: 'ground', min_delivery_days: 3, max_delivery_days: 5, base_rate: 8.99, rate_per_kg: 0.45 },
    { code: 'PEX_EXPRESS', name: 'Express Saver', display_name: 'PEX Express Saver', category: 'express', min_delivery_days: 2, max_delivery_days: 3, base_rate: 14.99, rate_per_kg: 0.75 },
    { code: 'PEX_OVERNIGHT', name: 'Priority Overnight', display_name: 'PEX Priority Overnight', category: 'express', min_delivery_days: 1, max_delivery_days: 1, base_rate: 29.99, rate_per_kg: 1.25 },
    { code: 'PEX_2DAY', name: '2-Day Air', display_name: 'PEX 2-Day Air', category: 'air', min_delivery_days: 2, max_delivery_days: 2, base_rate: 19.99, rate_per_kg: 0.95 },
    { code: 'PEX_INTERNATIONAL', name: 'International Economy', display_name: 'PEX International Economy', category: 'international', min_delivery_days: 5, max_delivery_days: 10, base_rate: 45.99, rate_per_kg: 2.5, is_international: true },
  ],
  vc: [
    { code: 'VC_SAME_DAY', name: 'Same Day', display_name: 'VC Same Day Delivery', category: 'express', min_delivery_days: 0, max_delivery_days: 0, base_rate: 49.99, rate_per_kg: 2.0 },
    { code: 'VC_OVERNIGHT', name: 'Overnight Priority', display_name: 'VC Overnight Priority', category: 'express', min_delivery_days: 1, max_delivery_days: 1, base_rate: 34.99, rate_per_kg: 1.5 },
    { code: 'VC_EARLY_AM', name: 'Early AM Delivery', display_name: 'VC Early AM (8:30 AM)', category: 'express', min_delivery_days: 1, max_delivery_days: 1, base_rate: 44.99, rate_per_kg: 1.75 },
    { code: 'VC_2DAY', name: '2-Day Express', display_name: 'VC 2-Day Express', category: 'air', min_delivery_days: 2, max_delivery_days: 2, base_rate: 24.99, rate_per_kg: 1.1 },
    { code: 'VC_GROUND', name: 'Ground Advantage', display_name: 'VC Ground Advantage', category: 'ground', min_delivery_days: 2, max_delivery_days: 4, base_rate: 12.99, rate_per_kg: 0.55 },
    { code: 'VC_INTERNATIONAL', name: 'Worldwide Express', display_name: 'VC Worldwide Express', category: 'international', min_delivery_days: 2, max_delivery_days: 5, base_rate: 59.99, rate_per_kg: 3.0, is_international: true },
  ],
  efl: [
    { code: 'EFL_LTL', name: 'LTL Standard', display_name: 'EFL LTL Standard', category: 'freight', min_delivery_days: 3, max_delivery_days: 7, base_rate: 125.0, rate_per_kg: 0.15, max_weight: 20000 },
    { code: 'EFL_LTL_EXPedited', name: 'LTL Expedited', display_name: 'EFL LTL Expedited', category: 'freight', min_delivery_days: 1, max_delivery_days: 3, base_rate: 195.0, rate_per_kg: 0.25, max_weight: 20000 },
    { code: 'EFL_FTL', name: 'Full Truckload', display_name: 'EFL Full Truckload', category: 'freight', min_delivery_days: 1, max_delivery_days: 5, base_rate: 850.0, rate_per_kg: 0.05, max_weight: 45000 },
    { code: 'EFL_PARTIAL', name: 'Partial Truckload', display_name: 'EFL Partial Truckload', category: 'freight', min_delivery_days: 2, max_delivery_days: 6, base_rate: 350.0, rate_per_kg: 0.1, max_weight: 15000 },
    { code: 'EFL_FLATBED', name: 'Flatbed Service', display_name: 'EFL Flatbed Service', category: 'freight', min_delivery_days: 2, max_delivery_days: 5, base_rate: 1200.0, rate_per_kg: 0.08, max_weight: 48000 },
  ],
  fs: [
    { code: 'FS_INTL_PRIORITY', name: 'International Priority', display_name: 'FS International Priority', category: 'international', min_delivery_days: 1, max_delivery_days: 3, base_rate: 75.99, rate_per_kg: 3.5, is_international: true },
    { code: 'FS_INTL_ECONOMY', name: 'International Economy', display_name: 'FS International Economy', category: 'international', min_delivery_days: 4, max_delivery_days: 8, base_rate: 49.99, rate_per_kg: 2.25, is_international: true },
    { code: 'FS_CROSS_BORDER', name: 'Cross Border Express', display_name: 'FS Cross Border Express', category: 'international', min_delivery_days: 2, max_delivery_days: 4, base_rate: 35.99, rate_per_kg: 1.5, is_international: true },
    { code: 'FS_OCEAN', name: 'Ocean Freight', display_name: 'FS Ocean Freight', category: 'freight', min_delivery_days: 15, max_delivery_days: 45, base_rate: 250.0, rate_per_kg: 0.08, is_international: true },
  ],
};

async function seed() {
  console.log('🌱 B2B Postal Checkout - Database Seeding');
  console.log('='.repeat(50));
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    db: { schema: 'postal_v2' },
  });

  // Check if schema exists
  console.log('\n🔍 Checking schema...');
  const { error: schemaError } = await supabase.from('carriers').select('id', { count: 'exact', head: true });

  if (schemaError) {
    console.error('❌ Schema not found. Please run migration first:');
    console.error('   npm run db:migrate');
    process.exit(1);
  }

  console.log('✅ Schema exists, proceeding with seed...');

  // ============================================
  // 1. Seed Carriers
  // ============================================
  console.log('\n📦 Seeding carriers...');

  const carrierIds: Record<string, string> = {};

  for (const carrier of CARRIERS) {
    const { data, error } = await supabase
      .from('carriers')
      .upsert(
        { code: carrier.code, ...carrier },
        { onConflict: 'code', ignoreDuplicates: false }
      )
      .select('id, code');

    if (error) {
      console.error(`  ❌ Failed to seed carrier ${carrier.code}:`, error.message);
      continue;
    }

    if (data && data[0]) {
      carrierIds[carrier.code] = data[0].id;
      console.log(`  ✅ ${carrier.display_name}`);
    }
  }

  console.log(`✅ Seeded ${Object.keys(carrierIds).length} carriers`);

  // ============================================
  // 2. Seed Service Types
  // ============================================
  console.log('\n📋 Seeding service types...');

  let serviceTypeCount = 0;

  for (const [carrierCode, services] of Object.entries(SERVICE_TYPES)) {
    const carrierId = carrierIds[carrierCode];
    if (!carrierId) {
      console.error(`  ⚠️  Carrier ${carrierCode} not found, skipping services`);
      continue;
    }

    for (const service of services) {
      const { error } = await supabase
        .from('service_types')
        .upsert(
          {
            carrier_id: carrierId,
            code: service.code,
            name: service.name,
            display_name: service.display_name,
            category: service.category,
            min_delivery_days: service.min_delivery_days,
            max_delivery_days: service.max_delivery_days,
            base_rate: service.base_rate,
            rate_per_kg: service.rate_per_kg,
            max_weight: service.max_weight || 150,
            is_international: service.is_international || false,
          },
          { onConflict: 'carrier_id, code', ignoreDuplicates: false }
        );

      if (error) {
        console.error(`  ❌ Failed to seed service ${service.code}:`, error.message);
        continue;
      }

      serviceTypeCount++;
    }
  }

  console.log(`✅ Seeded ${serviceTypeCount} service types`);

  // ============================================
  // 3. Seed Sample Organization & Data
  // ============================================
  console.log('\n🏢 Seeding sample organization...');

  // Create sample organization (idempotent by using a fixed UUID)
  const orgId = '11111111-1111-1111-1111-111111111111';
  const { error: orgError } = await supabase
    .from('organizations')
    .upsert(
      {
        id: orgId,
        name: 'Acme Corporation',
        slug: 'acme-corporation',
        tax_id: '12-3456789',
        billing_email: 'billing@acme-corp.example.com',
        payment_terms: 'net30',
        credit_limit: 50000.0,
        status: 'active',
      },
      { onConflict: 'id' }
    );

  if (orgError) {
    console.error('  ❌ Failed to seed organization:', orgError.message);
  } else {
    console.log('  ✅ Acme Corporation');
  }

  // Create sample addresses
  const senderAddressId = '22222222-2222-2222-2222-222222222222';
  const recipientAddressId = '33333333-3333-3333-3333-333333333333';

  const { error: addr1Error } = await supabase
    .from('addresses')
    .upsert(
      {
        id: senderAddressId,
        organization_id: orgId,
        label: 'Main Warehouse',
        recipient_name: 'Acme Shipping Department',
        recipient_phone: '614-555-0100',
        line1: '123 Commerce Street',
        line2: 'Suite 100',
        city: 'Columbus',
        state: 'OH',
        postal_code: '43215',
        country: 'US',
        address_type: 'commercial',
        is_default_shipping: true,
      },
      { onConflict: 'id' }
    );

  if (addr1Error) {
    console.error('  ❌ Failed to seed sender address:', addr1Error.message);
  } else {
    console.log('  ✅ Columbus OH address (sender)');
  }

  const { error: addr2Error } = await supabase
    .from('addresses')
    .upsert(
      {
        id: recipientAddressId,
        organization_id: orgId,
        label: 'Atlanta Distribution Center',
        recipient_name: 'Acme Atlanta Branch',
        recipient_phone: '404-555-0200',
        line1: '456 Peachtree Road',
        line2: 'Building B',
        city: 'Atlanta',
        state: 'GA',
        postal_code: '30309',
        country: 'US',
        address_type: 'commercial',
        is_default_shipping: false,
      },
      { onConflict: 'id' }
    );

  if (addr2Error) {
    console.error('  ❌ Failed to seed recipient address:', addr2Error.message);
  } else {
    console.log('  ✅ Atlanta GA address (recipient)');
  }

  // ============================================
  // 4. Seed Sample Shipment
  // ============================================
  console.log('\n📦 Seeding sample shipment...');

  // Get PEX Ground service type for the sample
  const { data: pexService } = await supabase
    .from('service_types')
    .select('id')
    .eq('code', 'PEX_GROUND')
    .single();

  const pexCarrierId = carrierIds['pex'];
  const serviceTypeId = pexService?.id;

  // Calculate pickup date (3 days out)
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 3);

  const shipmentId = '44444444-4444-4444-4444-444444444444';

  const { error: shipmentError } = await supabase
    .from('shipments')
    .upsert(
      {
        id: shipmentId,
        organization_id: orgId,
        user_id: orgId, // Using org as placeholder user
        shipment_number: 'SHP-2026-000001',
        reference_number: 'REF-ACME-12345',
        po_number: 'PO-2026-9876',
        sender_address_id: senderAddressId,
        sender_contact_name: 'John Shipping',
        sender_contact_phone: '614-555-0100',
        sender_contact_email: 'shipping@acme-corp.example.com',
        recipient_address_id: recipientAddressId,
        recipient_contact_name: 'Jane Receiving',
        recipient_contact_phone: '404-555-0200',
        recipient_contact_email: 'receiving@acme-corp.example.com',
        package_type: 'box',
        weight: 15.5,
        length: 18.0,
        width: 14.0,
        height: 12.0,
        declared_value: 250.0,
        contents_description: 'Electronic components - fragile equipment',
        carrier_id: pexCarrierId,
        service_type_id: serviceTypeId,
        status: 'draft',
        base_rate: 45.67,
        fuel_surcharge: 8.23,
        handling_fees: 12.50,
        total_cost: 66.40,
        special_instructions: 'Handle with care - fragile contents',
      },
      { onConflict: 'id' }
    );

  if (shipmentError) {
    console.error('  ❌ Failed to seed shipment:', shipmentError.message);
  } else {
    console.log('  ✅ Sample shipment (Columbus → Atlanta)');
  }

  // Add special handling (fragile + signature)
  const { error: handling1Error } = await supabase
    .from('shipment_special_handling')
    .upsert(
      {
        shipment_id: shipmentId,
        handling_type: 'fragile',
        is_applied: true,
        fee: 7.50,
        instructions: 'Fragile electronic components',
      },
      { onConflict: 'shipment_id, handling_type' }
    );

  if (handling1Error) {
    console.error('  ❌ Failed to add fragile handling:', handling1Error.message);
  } else {
    console.log('  ✅ Fragile handling applied');
  }

  const { error: handling2Error } = await supabase
    .from('shipment_special_handling')
    .upsert(
      {
        shipment_id: shipmentId,
        handling_type: 'signature_required',
        is_applied: true,
        fee: 5.00,
        instructions: 'Adult signature required upon delivery',
      },
      { onConflict: 'shipment_id, handling_type' }
    );

  if (handling2Error) {
    console.error('  ❌ Failed to add signature handling:', handling2Error.message);
  } else {
    console.log('  ✅ Signature required applied');
  }

  // ============================================
  // 5. Seed Sample Payment Info (PO)
  // ============================================
  console.log('\n💳 Seeding sample payment info...');

  const paymentInfoId = '55555555-5555-5555-5555-555555555555';

  const { error: paymentInfoError } = await supabase
    .from('payment_info')
    .upsert(
      {
        id: paymentInfoId,
        organization_id: orgId,
        payment_type: 'purchase_order',
        display_name: 'Standard PO Payment',
        is_default: true,
        is_verified: true,
        status: 'active',
      },
      { onConflict: 'id' }
    );

  if (paymentInfoError) {
    console.error('  ❌ Failed to seed payment info:', paymentInfoError.message);
  } else {
    console.log('  ✅ Payment info created');
  }

  const { error: poError } = await supabase
    .from('payment_purchase_orders')
    .upsert(
      {
        payment_info_id: paymentInfoId,
        po_number: 'PO-2026-9876',
        po_expiry_date: '2026-12-31',
        authorized_amount: 5000.0,
        remaining_amount: 4933.60,
        department: 'Operations',
        cost_center: 'CC-001-SHIPPING',
        gl_account: '6100-SHIPPING',
        approver_name: 'Sarah Johnson',
        approver_email: 'sarah.johnson@acme-corp.example.com',
      },
      { onConflict: 'payment_info_id' }
    );

  if (poError) {
    console.error('  ❌ Failed to seed PO details:', poError.message);
  } else {
    console.log('  ✅ Purchase order details');
  }

  // ============================================
  // 6. Seed Sample Pickup Details
  // ============================================
  console.log('\n🚚 Seeding sample pickup details...');

  const pickupId = '66666666-6666-6666-6666-666666666666';

  const { error: pickupError } = await supabase
    .from('pickup_details')
    .upsert(
      {
        id: pickupId,
        shipment_id: shipmentId,
        pickup_number: 'PUP-2026-000001',
        carrier_id: pexCarrierId,
        pickup_address_id: senderAddressId,
        pickup_date: pickupDate.toISOString().split('T')[0],
        ready_time: '09:00:00',
        close_time: '17:00:00',
        status: 'pending',
        special_instructions: 'Please call 30 minutes before arrival',
        driver_instructions: 'Loading dock is in the rear of building',
      },
      { onConflict: 'id' }
    );

  if (pickupError) {
    console.error('  ❌ Failed to seed pickup details:', pickupError.message);
  } else {
    console.log(`  ✅ Pickup scheduled for ${pickupDate.toISOString().split('T')[0]}`);
  }

  // Add pickup contact
  const { error: contactError } = await supabase
    .from('pickup_contacts')
    .upsert(
      {
        pickup_id: pickupId,
        contact_name: 'John Shipping',
        contact_phone: '614-555-0100',
        contact_email: 'shipping@acme-corp.example.com',
        is_primary: true,
        available_from: '08:00:00',
        available_until: '18:00:00',
      },
      { onConflict: 'pickup_id, contact_name' }
    );

  if (contactError) {
    console.error('  ❌ Failed to seed pickup contact:', contactError.message);
  } else {
    console.log('  ✅ Pickup contact added');
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETE');
  console.log('='.repeat(50));
  console.log(`📦 Carriers: ${Object.keys(carrierIds).length}`);
  console.log(`📋 Service Types: ${serviceTypeCount}`);
  console.log(`🏢 Organization: 1 (Acme Corporation)`);
  console.log(`📍 Addresses: 2 (Columbus OH, Atlanta GA)`);
  console.log(`📦 Sample Shipment: 1 (with fragile + signature)`);
  console.log(`💳 Payment Info: 1 (PO-based)`);
  console.log(`🚚 Pickup: 1 (scheduled ${pickupDate.toISOString().split('T')[0]})`);
  console.log('\n✅ All seed data is idempotent - safe to run multiple times');
}

seed().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
