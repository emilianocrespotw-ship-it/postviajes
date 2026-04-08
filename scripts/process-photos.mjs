// scripts/process-photos.mjs
// Run from project root: node scripts/process-photos.mjs
// Requires: npm install @anthropic-ai/sdk @supabase/supabase-js dotenv sharp

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ── Config ────────────────────────────────────────────────────────────────────
const PHOTOS_DIR = 'C:\\Users\\harry\\OneDrive\\Desktop\\fotos para postviajes'
const BUCKET_NAME = 'travel-photos'
const MAX_SIZE_BYTES = 4 * 1024 * 1024  // 4MB limit for Claude vision
const DELAY_MS = 300  // delay between photos to avoid rate limiting
const BATCH_LOG = 'scripts/process-photos-progress.json'

// ── Init clients ──────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadProgress() {
  if (fs.existsSync(BATCH_LOG)) {
    return JSON.parse(fs.readFileSync(BATCH_LOG, 'utf8'))
  }
  return { processed: [], failed: [] }
}

function saveProgress(progress) {
  fs.writeFileSync(BATCH_LOG, JSON.stringify(progress, null, 2))
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET_NAME)
  if (!exists) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`)
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    console.log(`Bucket created!`)
  } else {
    console.log(`Bucket "${BUCKET_NAME}" exists ✓`)
  }
}

async function resizeIfNeeded(buffer) {
  if (buffer.length <= MAX_SIZE_BYTES) return buffer

  // Try to import sharp for resizing
  try {
    const sharp = (await import('sharp')).default
    // Resize to max 1200px wide, keep aspect ratio
    return await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
  } catch {
    // If sharp not available, just return original and hope it's under limit
    console.warn('  → sharp not installed, using original size')
    return buffer
  }
}

async function identifyDestination(imageBuffer, filename) {
  const resized = await resizeIfNeeded(imageBuffer)
  const base64 = resized.toString('base64')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
        },
        {
          type: 'text',
          text: `This is a travel photo. Identify the travel destination shown.
Reply ONLY with a valid JSON object, no explanation:
{
  "destination": "City or Region name (e.g. Cancún, Patagonia, Aruba)",
  "country": "Country name in Spanish (e.g. México, Argentina, Países Bajos)",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "one sentence description in Spanish"
}
Tags should be relevant keywords like: playa, montaña, ciudad, cultura, naturaleza, nieve, selva, lago, desierto, etc.
If you cannot identify the destination, use "destination": "Destino turístico" and your best guess for tags.`
        }
      ]
    }]
  })

  const text = response.content[0].text.trim()
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  } catch (e) {
    console.warn(`  → Could not parse AI response: ${text.substring(0, 100)}`)
    return {
      destination: 'Destino turístico',
      country: 'Desconocido',
      tags: ['viaje'],
      description: 'Foto de viaje'
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== PostViajes Photo Processor ===\n')

  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY')

  // Ensure bucket exists
  await ensureBucket()

  // Read photo files
  if (!fs.existsSync(PHOTOS_DIR)) {
    throw new Error(`Photos directory not found: ${PHOTOS_DIR}`)
  }
  const allFiles = fs.readdirSync(PHOTOS_DIR)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .sort()
  console.log(`Found ${allFiles.length} photos in ${PHOTOS_DIR}\n`)

  // Load progress (resume capability)
  const progress = loadProgress()
  const alreadyDone = new Set(progress.processed)
  const toProcess = allFiles.filter(f => !alreadyDone.has(f))
  console.log(`Already processed: ${alreadyDone.size} | Remaining: ${toProcess.length}\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < toProcess.length; i++) {
    const filename = toProcess[i]
    const filepath = path.join(PHOTOS_DIR, filename)
    const overallNum = alreadyDone.size + i + 1

    process.stdout.write(`[${overallNum}/${allFiles.length}] ${filename} ... `)

    try {
      const imageBuffer = fs.readFileSync(filepath)

      // Identify destination via Claude
      const info = await identifyDestination(imageBuffer, filename)
      process.stdout.write(`${info.destination} ... `)

      // Upload to Supabase Storage
      const storagePath = `personal/${filename}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath)

      // Insert/upsert into photos table
      const { error: insertError } = await supabase
        .from('photos')
        .upsert({
          filename,
          storage_path: storagePath,
          url: urlData.publicUrl,
          destination: info.destination,
          country: info.country,
          tags: info.tags || [],
          description: info.description || '',
          source: 'personal'
        }, { onConflict: 'filename' })

      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)

      console.log(`✓`)
      progress.processed.push(filename)
      successCount++

    } catch (err) {
      console.log(`✗ ${err.message}`)
      progress.failed.push({ filename, error: err.message })
      errorCount++
    }

    // Save progress every 10 photos
    if ((i + 1) % 10 === 0) {
      saveProgress(progress)
      console.log(`  → Progress saved (${successCount} done, ${errorCount} errors)`)
    }

    // Delay to avoid rate limiting
    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  // Final save
  saveProgress(progress)

  console.log(`\n=== Done! ===`)
  console.log(`✓ Processed: ${successCount}`)
  console.log(`✗ Errors: ${errorCount}`)
  if (errorCount > 0) {
    console.log(`Failed files saved to: ${BATCH_LOG}`)
    console.log('Run the script again to retry failed ones (if you remove them from "failed" and "processed" lists)')
  }
  console.log(`\nTotal photos in Supabase: ${alreadyDone.size + successCount}`)
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
