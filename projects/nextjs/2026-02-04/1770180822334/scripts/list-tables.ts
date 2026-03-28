import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listTables() {
  const { data, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
    })

  if (error) {
    // Try alternative approach
    const tables = ['profiles', 'sites', 'pages', 'components', 'templates', 'menus', 'media']
    console.log('Checking tables...\n')
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (tableError) {
        console.log(`❌ ${table} - ${tableError.message}`)
      } else {
        console.log(`✅ ${table}`)
      }
    }
  } else {
    console.log('Tables:', data)
  }
}

listTables()
