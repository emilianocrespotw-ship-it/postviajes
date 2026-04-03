import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({
      error: 'No autenticado. Conectá tu cuenta de Facebook primero.',
      code: 'NOT_AUTHENTICATED',
    }, { status: 401 })
  }

  try {
    const { imageUrl, textFacebook, textInstagram } = await req.json()

    if (!imageUrl || !textFacebook) {
      return NextResponse.json({
        error: 'Faltan datos: imageUrl y textFacebook son requeridos.',
      }, { status: 400 })
    }

    // 1. Obtener páginas de Facebook del usuario
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
        error: 'Tu cuenta de Facebook no tiene páginas de empresa vinculadas. Para publicar necesitás ser administrador de una Página de Facebook.',
        code: 'NO_PAGES',
      }, { status: 404 })
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

    // 3. Publicar en Instagram (si la página tiene IG vinculado)
    try {
      const igAccountRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      )
      const igAccountData = await igAccountRes.json()
      const igAccountId = igAccountData.instagram_business_account?.id

      if (igAccountId) {
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
      pageName: page.name,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('ERROR en /api/publish:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
