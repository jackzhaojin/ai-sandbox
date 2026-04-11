# Supabase Client Configuration

## postal_v2 Schema

This project uses a dedicated `postal_v2` schema in Supabase for the B2B Postal Checkout Flow.

## Access Methods

### 1. Direct PostgreSQL (Recommended for Server Components/API Routes)

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// All tables are prefixed with postal_v2
const result = await pool.query('SELECT * FROM postal_v2.shipments LIMIT 10');
```

### 2. Supabase Client with Schema Option

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  db: { schema: 'postal_v2' }
});

const { data } = await supabase.from('shipments').select('*');
```

### 3. REST API with Schema Header

**Note:** The postal_v2 schema must be exposed in Supabase Dashboard for REST API access.

```bash
curl "${SUPABASE_URL}/rest/v1/shipments?select=*" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Accept-Profile: postal_v2"
```

## Exposing Schema to REST API

To enable REST API access:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/api
2. Navigate to "API Settings"
3. Under "Exposed Schemas", add `postal_v2`
4. Save changes

## Schema Contents

- **27 tables** - Full B2B postal shipment domain model
- **11 enum types** - Status codes, payment methods, package types
- **52 indexes** - Optimized for common query patterns
- **40 foreign keys** - Relationship integrity
- **27 RLS policies** - Permissive for development
- **9 triggers** - Auto-update timestamps, tracking number generation

## Tables

### Core
- `organizations` - B2B customer organizations
- `users` - Organization members
- `addresses` - Shipping/billing addresses

### Shipping
- `shipments` - Main shipment records
- `shipment_packages` - Multi-piece support
- `shipment_special_handling` - Fragile, hazmat, etc.
- `shipment_delivery_preferences` - Delivery instructions
- `hazmat_details` - Hazardous materials info
- `shipment_events` - Tracking history

### Carriers & Rates
- `carriers` - Shipping carriers (PEX, VC, EFL, FS)
- `service_types` - Carrier service levels
- `quotes` - Rate quotes for shipments

### Payments
- `payment_info` - Parent table for payment methods
- `payment_purchase_orders` - PO payment details
- `payment_net_terms` - Net 15/30/60 terms
- `payment_net_terms_references` - References for net terms
- `payment_bills_of_lading` - BOL payments
- `payment_third_party` - Third-party billing
- `payment_corporate_accounts` - Corporate account billing
- `payments` - Transaction records

### Pickup
- `pickup_slots` - Available time windows
- `pickup_details` - Scheduled pickups
- `pickup_contacts` - Pickup contact persons
- `pickup_access_requirements` - Gate codes, etc.
- `pickup_equipment_needs` - Liftgate, pallet jack
- `pickup_authorized_personnel` - Authorized pickup persons
- `pickup_notifications` - Pickup notifications

## Enums

- `user_role` - admin, manager, user
- `organization_status` - active, suspended, inactive
- `payment_term` - immediate, net15, net30, net60
- `address_type` - residential, commercial
- `package_type` - box, envelope, tube, pallet
- `shipment_status` - draft, pending_payment, paid, label_generated, picked_up, in_transit, delivered, cancelled
- `carrier_code` - pex, vc, efl, fs
- `service_category` - ground, air, express, freight, international
- `payment_method_type` - purchase_order, net_terms, bill_of_lading, third_party, corporate_account
- `payment_status` - pending, processing, succeeded, failed, refunded
- `handling_type` - fragile, hazardous, temperature_controlled, signature_required, adult_signature, hold_for_pickup, appointment_delivery
