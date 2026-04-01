import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const API_VERSION = 'v21.0'
const BASE = `https://graph.facebook.com/${API_VERSION}`

/**
 * POST /api/publish
 *
 * Publica en Facebook e Instagram.
 * Body:
 * {
 *   postId: string,           // ID del post en Supabase
 *   pageId: string,
 *   pageToken: string,
 *   igUserId: string,
 *   imageUrl: string,         // URL pública de la imagen (Pexels o Storage)
 *   textFacebook: string,
 *   textInstagram: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      postId,
      pageId,
      pageToken,
      igUserId,
      imageUrl,
      textFacebook,
      textInstagram,
    } = await req.json()

    const results: { facebook?: any; instagram?: any; errors: string[] } = { errors: [] }

    // ── FACEBOOK ──────────────────────────────────────────────────────────
    try {
      // 1. Subir foto sin publicar para obtener photo_id y CDN URL
      const uploadResp = await fetch(`${BASE}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,         // Pexels acepta subida por URL
          published: false,
          access_token: pageToken,
        }),
      })

      if (!uploadResp.ok) {
        const err = await uploadResp.json()
        throw new Error(err.error?.message || 'Error subiendo foto a Facebook')
      }

      const uploadData = await uploadResp.json()
      const photoId = uploadData.id

      // 2. Obtener URL pública del CDN de Facebook (para usar en Instagram)
      const cdnResp = await fetch(`${BASE}/${photoId}?fields=images&access_token=${pageToken}`)
      const cdnData = await cdnResp.json()
      const cdnUrl: string | null = cdnData.images?.[0]?.source ?? null

      // 3. Publicar el post de Facebook con la foto adjunta
      const postResp = await fetch(`${BASE}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textFacebook,
          attached_media: JSON.stringify([{ media_fbid: photoId }]),
          access_token: pageToken,
        }),
      })

      if (!postResp.ok) {
        const err = await postResp.json()
        throw new Error(err.error?.message || 'Error publicando en Facebook')
      }

      const postData = await postResp.json()
      results.facebook = { postId: postData.id, cdnUrl }

    } catch (fbError: any) {
      results.errors.push(`Facebook: ${fbError.message}`)
    }

    // ── INSTAGRAM ─────────────────────────────────────────────────────────
    if (igUserId && results.facebook?.cdnUrl) {
      const igImageUrl = results.facebook.cdnUrl  // Usamos la URL del CDN de Facebook

      try {
        // 1. Crear container de media
        const containerResp = await fetch(`${BASE}/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: igImageUrl,
            caption: textInstagram,
            access_token: pageToken,
          }),
        })

        if (!containerResp.ok) {
          const err = await containerResp.json()
          throw new Error(err.error?.message || 'Error creando container en Instagram')
        }

        const { id: containerId } = await containerResp.json()

        // Esperar 2 segundos (recomendado por Meta)
        await new Promise(r => setTimeout(r, 2000))

        // 2. Publicar
        const pubResp = await fetch(`${BASE}/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: pageToken,
          }),
        })

        if (!pubResp.ok) {
          const err = await pubResp.json()
          throw new Error(err.error?.message || 'Error publicando en Instagram')
        }

        const { id: mediaId } = await pubResp.json()
        results.instagram = { mediaId }

      } catch (igError: any) {
        results.errors.push(`Instagram: ${igError.message}`)
      }
    }

    // ── Actualizar estado en Supabase ─────────────────────────────────────
    if (postId) {
      await supabase
        .from('posts')
        .update({
          status: results.errors.length === 0 ? 'published' : 'error',
          fb_post_id: results.facebook?.postId ?? null,
          ig_media_id: results.instagram?.mediaId ?? null,
          published_at: new Date().toISOString(),
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: results.errors.length < 2, // al menos uno publicado
      facebook: results.facebook,
      instagram: results.instagram,
      errors: results.errors,
    })

  } catch (error: any) {
    console.error('Error en /api/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
