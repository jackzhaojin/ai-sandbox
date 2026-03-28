import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('URL:', supabaseUrl)
console.log('Has key:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDB() {
  // Check what we CAN query
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Ingredients error:', error)
  } else {
    console.log('✅ Found ingredients table (this is wrong database!)')
    console.log('Sample:', data)
  }
}

checkDB()
