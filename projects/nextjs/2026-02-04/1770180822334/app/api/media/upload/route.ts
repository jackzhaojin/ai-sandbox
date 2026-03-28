import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { media } from '@/lib/db/schema'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const siteId = formData.get('siteId') as string
    const folderId = formData.get('folderId') as string | null

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 files allowed' }, { status: 400 })
    }

    const uploadedMedia = []
    const errors = []

    // Process each file
    for (const file of files) {
      try {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          errors.push({ filename: file.name, error: 'File too large (max 10MB)' })
          continue
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const extension = file.name.split('.').pop()
        const filename = `${timestamp}-${randomString}.${extension}`
        const storagePath = folderId
          ? `${siteId}/${folderId}/${filename}`
          : `${siteId}/${filename}`

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Extract image dimensions if image
        let width: number | null = null
        let height: number | null = null

        if (file.type.startsWith('image/')) {
          try {
            const metadata = await sharp(buffer).metadata()
            width = metadata.width || null
            height = metadata.height || null
          } catch (error) {
            console.error('Error extracting image metadata:', error)
          }
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          errors.push({ filename: file.name, error: uploadError.message })
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath)

        // Insert media record into database
        const [mediaRecord] = await db.insert(media).values({
          siteId,
          folderId: folderId || null,
          filename,
          originalFilename: file.name,
          storagePath,
          mimeType: file.type,
          fileSize: file.size,
          width,
          height,
          uploadedBy: user.id,
        }).returning()

        uploadedMedia.push({
          id: mediaRecord.id,
          filename: mediaRecord.filename,
          originalFilename: mediaRecord.originalFilename,
          mimeType: mediaRecord.mimeType,
          fileSize: mediaRecord.fileSize,
          width: mediaRecord.width,
          height: mediaRecord.height,
          url: publicUrl,
          thumbnailUrl: width && height
            ? `${publicUrl}?width=200&height=200&resize=cover`
            : publicUrl,
          mediumUrl: width && height
            ? `${publicUrl}?width=800&height=800&resize=inside`
            : publicUrl,
          largeUrl: width && height
            ? `${publicUrl}?width=1600&height=1600&resize=inside`
            : publicUrl,
        })
      } catch (error) {
        console.error('Error processing file:', error)
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: uploadedMedia.length > 0,
      uploaded: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
