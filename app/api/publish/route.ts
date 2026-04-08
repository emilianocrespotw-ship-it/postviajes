import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getUserUsage, incrementPostCount } from '@/lib/usage'

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({
      error: 'No autenticado. Conectá tu cuenta de Facebook primero.',
      code: 'NOT_AUTHENTICATED',
    }, { status: 401 })
  }

  // ── Chequeo de límite de uso ─────────────────────────────────────────────────
  const email = session.user?.email
  if (email) {
    const usage = await getUserUsage(email)
    if (usage.limitReached) {
      return NextResponse.json({
        error: 'Límite mensual alcanzado',
        code: 'LIMIT_REACHED',
        postsThisMonth: usage.postsThisMonth,
      }, { status: 403 })
    }
  }

  try {
    const { imageUrl, textFacebook, textInstagram } = await req.json()
    if (!imageUrl || !textFacebook) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    // 1. Obtener páginas de Facebook
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${session.accessToken}`
    )
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      return NextResponse.json({
        error: `Error de Facebook: ${pagesData.error.message}`,
        code: 'FB_TOKEN_ERROR',
      }, { status: 401 })
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({
        error: 'Tu cuenta no tiene Páginas de Facebook. Necesitás ser administrador de una Página para publicar automáticamente.',
        code: 'NO_PAGES',
      }, { status: 404 })
    }

    const page = pagesData.data[0]
    const pageId = page.id
    const pageToken = page.access_token

    // 2. Descargar la imagen en el servidor → evita que Facebook rechace la URL del CDN
    let imageBlob: Blob | null = null
    try {
      const imgRes = await fetch(imageUrl, {
        headers: { 'User-Agent': 'PostViajes/1.0 (travel agency social media tool)' },
      })
      if (imgRes.ok) {
        imageBlob = await imgRes.blob()
      }
    } catch (e) {
      console.warn('No se pudo descargar la imagen, se usará URL directa:', e)
    }

    const errors: string[] = []
    let fbPostId: string | null = null
    let igPostId: string | null = null

    // 3. Publicar en Facebook — binario si está disponible, URL como fallback
    try {
      let fbRes: Response

      if (imageBlob) {
        // Upload binario (más confiable — evita bloqueos de CDN)
        const form = new FormData()
        form.append('source', imageBlob, 'photo.jpg')
        form.append('caption', textFacebook)
        form.append('access_token', pageToken)
        fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
          method: 'POST',
          body: form,
        })
      } else {
        // Fallback a URL si el download falló
        fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrl, caption: textFacebook, access_token: pageToken }),
        })
      }

      const fbData = await fbRes.json()
      if (fbData.error) {
        errors.push(`Facebook: ${fbData.error.message}`)
      } else {
        fbPostId = fbData.id
      }
    } catch (e: any) {
      errors.push(`Facebook: ${e.message}`)
    }

    // 4. Publicar en Instagram (si la página tiene IG vinculado)
    try {
      const igAccountRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      )
      const igAccountData = await igAccountRes.json()
      const igAccountId = igAccountData.instagram_business_account?.id

      if (igAccountId) {
        // IG solo acepta URL pública — usar la URL original
        const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: textInstagram || textFacebook,
            access_token: pageToken,
          }),
        })
        const containerData = await containerRes.json()

        if (containerData.id) {
          const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id, access_token: pageToken }),
          })
          const publishData = await publishRes.json()
          if (publishData.error) {
            errors.push(`Instagram: ${publishData.error.message}`)
          } else {
            igPostId = publishData.id
          }
        }
      }
    } catch (e: any) {
      errors.push(`Instagram: ${e.message}`)
    }

    if (!fbPostId && errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 500 })
    }

    // ── Incrementar contador de uso ──────────────────────────────────────────
    if (email) {
      await incrementPostCount(email)
    }

    return NextResponse.json({
      success: true,
      fbPostId,
      igPostId,
      pageName: page.name,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('ERROR en /api/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
