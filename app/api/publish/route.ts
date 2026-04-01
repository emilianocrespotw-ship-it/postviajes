import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'No autenticado. Conectá tu cuenta de Facebook primero.' }, { status: 401 })
  }

  try {
    const { imageUrl, textFacebook, textInstagram } = await req.json()

    if (!imageUrl || !textFacebook) {
      return NextResponse.json({ error: 'Faltan datos: imageUrl y textFacebook son requeridos.' }, { status: 400 })
    }

    // 1. Obtener las páginas de Facebook del usuario
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${session.accessToken}`
    )
    const pagesData = await pagesRes.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: 'No se encontraron páginas de Facebook vinculadas a tu cuenta.' }, { status: 404 })
    }

    const page = pagesData.data[0]
    const pageId = page.id
    const pageToken = page.access_token

    const errors: string[] = []
    let fbPostId: string | null = null
    let igPostId: string | null = null

    // 2. Publicar en Facebook
    try {
      const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          caption: textFacebook,
          access_token: pageToken,
        }),
      })
      const fbData = await fbRes.json()
      if (fbData.error) {
        errors.push(`Facebook: ${fbData.error.message}`)
      } else {
        fbPostId = fbData.id
      }
    } catch (e: any) {
      errors.push(`Facebook: ${e.message}`)
    }

    // 3. Publicar en Instagram (si la página tiene IG conectado)
    try {
      // Buscar cuenta de Instagram Business vinculada a la página
      const igAccountRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      )
      const igAccountData = await igAccountRes.json()
      const igAccountId = igAccountData.instagram_business_account?.id

      if (igAccountId) {
        // Paso 1: Crear container de media
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
          // Paso 2: Publicar el container
          const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: pageToken,
            }),
          })
          const publishData = await publishRes.json()
          if (publishData.error) {
            errors.push(`Instagram: ${publishData.error.message}`)
          } else {
            igPostId = publishData.id
          }
        }
      }
      // Si no tiene IG vinculado, simplemente no publicamos en IG (sin error)
    } catch (e: any) {
      errors.push(`Instagram: ${e.message}`)
    }

    if (!fbPostId && errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      fbPostId,
      igPostId,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('ERROR en /api/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
