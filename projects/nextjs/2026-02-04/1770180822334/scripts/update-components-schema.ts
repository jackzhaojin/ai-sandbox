/**
 * Update Components Schema
 *
 * Adds new fields to the components table:
 * - type (replaces name)
 * - label
 * - icon
 * - sortOrder
 * - Updates propSchema field name
 */

import { db } from '../lib/db/index'
import 'dotenv/config'

async function updateSchema() {
  console.log('🔄 Updating components schema...\n')

  try {
    // Add new columns
    await db.execute(`
      -- Add new columns if they don't exist
      DO $$
      BEGIN
        -- Add type column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'type') THEN
          ALTER TABLE components ADD COLUMN type TEXT;
        END IF;

        -- Add label column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'label') THEN
          ALTER TABLE components ADD COLUMN label TEXT;
        END IF;

        -- Add icon column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'icon') THEN
          ALTER TABLE components ADD COLUMN icon TEXT;
        END IF;

        -- Add sort_order column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'sort_order') THEN
          ALTER TABLE components ADD COLUMN sort_order INTEGER DEFAULT 0 NOT NULL;
        END IF;

        -- Rename prop_schema if it's still props_schema
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'props_schema') THEN
          ALTER TABLE components RENAME COLUMN props_schema TO prop_schema;
        END IF;

        -- Add prop_schema if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'prop_schema') THEN
          ALTER TABLE components ADD COLUMN prop_schema JSONB NOT NULL DEFAULT '{}'::jsonb;
        END IF;
      END $$;
    `)
    console.log('✅ Added new columns')

    // Migrate data from old columns to new (if name exists and type doesn't have data)
    await db.execute(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'name') THEN
          -- Migrate name to type if type is null
          UPDATE components SET type = name WHERE type IS NULL;
          -- Migrate display_name to label if label is null
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'display_name') THEN
            UPDATE components SET label = display_name WHERE label IS NULL;
          END IF;
        END IF;
      END $$;
    `)
    console.log('✅ Migrated existing data')

    // Add constraints after data migration
    await db.execute(`
      DO $$
      BEGIN
        -- Make type NOT NULL and UNIQUE if it exists and has data
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'type') THEN
          -- Update any remaining nulls with a default
          UPDATE components SET type = 'component-' || id::text WHERE type IS NULL;

          -- Add constraints
          ALTER TABLE components ALTER COLUMN type SET NOT NULL;

          -- Add unique constraint if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'components_type_unique') THEN
            ALTER TABLE components ADD CONSTRAINT components_type_unique UNIQUE (type);
          END IF;
        END IF;

        -- Make label and icon NOT NULL
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'label') THEN
          UPDATE components SET label = type WHERE label IS NULL;
          ALTER TABLE components ALTER COLUMN label SET NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'icon') THEN
          UPDATE components SET icon = 'Box' WHERE icon IS NULL;
          ALTER TABLE components ALTER COLUMN icon SET NOT NULL;
        END IF;
      END $$;
    `)
    console.log('✅ Added constraints')

    // Create indexes
    await db.execute(`
      -- Create indexes if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_components_type') THEN
          CREATE INDEX idx_components_type ON components(type);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_components_sort_order') THEN
          CREATE INDEX idx_components_sort_order ON components(sort_order);
        END IF;
      END $$;
    `)
    console.log('✅ Created indexes')

    // Clean up old columns (optional - keep them for now for safety)
    console.log('\nℹ️  Old columns (name, display_name) retained for safety')
    console.log('   You can manually drop them later if desired')

    console.log('\n✨ Schema update completed successfully!')

  } catch (error) {
    console.error('\n❌ Schema update failed:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

updateSchema()
