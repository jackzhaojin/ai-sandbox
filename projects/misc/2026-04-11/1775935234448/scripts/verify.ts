#!/usr/bin/env tsx
/**
 * Database Verification Script
 * Verifies the postal_v2 schema is correctly set up
 */

import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.app') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const EXPECTED_TABLES = [
  'organizations',
  'users',
  'addresses',
  'carriers',
  'service_types',
  'shipments',
  'shipment_packages',
  'shipment_special_handling',
  'shipment_delivery_preferences',
  'hazmat_details',
  'quotes',
  'payment_info',
  'payment_purchase_orders',
  'payment_bills_of_lading',
  'payment_third_party',
  'payment_net_terms',
  'payment_net_terms_references',
  'payment_corporate_accounts',
  'pickup_details',
  'pickup_contacts',
  'pickup_access_requirements',
  'pickup_equipment_needs',
  'pickup_authorized_personnel',
  'pickup_notifications',
  'shipment_events',
  'payment_methods',
  'payments',
  'activity_log',
];

async function verify() {
  console.log('🔍 B2B Postal Checkout - Database Verification');
  console.log('='.repeat(50));
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    db: { schema: 'postal_v2' },
  });

  let allPassed = true;

  // Verify connection
  console.log('\n📡 Testing connection...');
  const { error: connError } = await supabase.from('carriers').select('count', { count: 'exact', head: true });

  if (connError && connError.code === '42P01') {
    console.error('❌ postal_v2 schema not found!');
    console.error('   Run: npm run db:migrate');
    process.exit(1);
  }

  console.log('✅ Connected to postal_v2 schema');

  // Check tables
  console.log('\n📋 Verifying tables...');
  const missingTables: string[] = [];

  for (const table of EXPECTED_TABLES) {
    const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
      missingTables.push(table);
      console.log(`  ❌ ${table}`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${table}`);
    }
  }

  // Check seed data
  console.log('\n🌱 Verifying seed data...');

  const { data: carriers, error: carriersError } = await supabase.from('carriers').select('code, name');
  if (carriersError || !carriers || carriers.length === 0) {
    console.log('  ❌ No carriers found');
    allPassed = false;
  } else {
    console.log(`  ✅ Carriers: ${carriers.length} (${carriers.map(c => c.code).join(', ')})`);
  }

  const { count: serviceCount, error: serviceError } = await supabase
    .from('service_types')
    .select('*', { count: 'exact', head: true });
  if (serviceError || !serviceCount) {
    console.log('  ❌ No service types found');
    allPassed = false;
  } else {
    console.log(`  ✅ Service types: ${serviceCount}`);
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', 'acme-corporation')
    .single();
  if (orgError || !org) {
    console.log('  ❌ Sample organization not found');
    allPassed = false;
  } else {
    console.log(`  ✅ Organization: ${org.name}`);
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('shipment_number, status')
    .eq('shipment_number', 'SHP-2026-000001')
    .single();
  if (shipmentError || !shipment) {
    console.log('  ❌ Sample shipment not found');
    allPassed = false;
  } else {
    console.log(`  ✅ Sample shipment: ${shipment.shipment_number} (${shipment.status})`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 VERIFICATION PASSED');
    console.log('✅ Database is correctly configured with postal_v2 schema');
    console.log('✅ All seed data is present');
    process.exit(0);
  } else {
    console.log('⚠️  VERIFICATION FAILED');
    if (missingTables.length > 0) {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('   Run: npm run db:migrate');
    }
    console.log('❌ Some checks failed');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
