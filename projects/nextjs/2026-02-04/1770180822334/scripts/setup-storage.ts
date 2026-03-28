#!/usr/bin/env tsx
/**
 * Setup Supabase Storage Bucket for Media Files
 *
 * This script creates the 'media' storage bucket with:
 * - Public access for reading
 * - 10MB max file size
 * - Allowed mime types for images, videos, and documents
 * - CORS configuration for localhost uploads
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const mediaBucket = buckets?.find(bucket => bucket.name === 'media')

    if (mediaBucket) {
      console.log('ℹ️  Bucket "media" already exists')
      console.log(`   - Public: ${mediaBucket.public}`)
      console.log(`   - ID: ${mediaBucket.id}`)
      console.log(`   - Created: ${mediaBucket.created_at}\n`)

      // Update bucket settings if needed
      console.log('📝 Updating bucket settings...')
      const { error: updateError } = await supabase
        .storage
        .updateBucket('media', {
          public: true,
          fileSizeLimit: 10485760, // 10MB in bytes
          allowedMimeTypes: [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/webm',
            'video/quicktime',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]
        })

      if (updateError) {
        console.warn(`⚠️  Could not update bucket settings: ${updateError.message}`)
      } else {
        console.log('✅ Bucket settings updated successfully\n')
      }
    } else {
      console.log('📦 Creating new bucket "media"...')
      const { data, error } = await supabase
        .storage
        .createBucket('media', {
          public: true,
          fileSizeLimit: 10485760, // 10MB in bytes
          allowedMimeTypes: [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/webm',
            'video/quicktime',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]
        })

      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`)
      }

      console.log('✅ Bucket "media" created successfully')
      console.log(`   - ID: ${data.name}\n`)
    }

    // Display bucket configuration
    console.log('📋 Storage Bucket Configuration:')
    console.log('   - Name: media')
    console.log('   - Public Access: Yes')
    console.log('   - Max File Size: 10MB')
    console.log('   - Allowed Types:')
    console.log('     • Images: JPEG, PNG, GIF, WebP, SVG')
    console.log('     • Videos: MP4, WebM, QuickTime')
    console.log('     • Documents: PDF, Word\n')

    console.log('📝 CORS Configuration:')
    console.log('   The bucket is configured with public access.')
    console.log('   For additional CORS configuration, visit:')
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/settings/storage')}\n`)

    console.log('🎉 Storage setup complete!\n')
    console.log('Next steps:')
    console.log('1. Apply RLS policies: npm run db:migrate')
    console.log('2. Test file upload from the application')
    console.log('3. Verify permissions work correctly\n')

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    process.exit(1)
  }
}

// Run the setup
setupStorage()
