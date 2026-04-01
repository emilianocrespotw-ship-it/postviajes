import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"

export async function POST(req: NextRequest) {
  const session: any = await getServerSession()
  if (!session?.accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const { text, imageUrl } = await req.json()

    // 1. Obtener el ID de tu página de Facebook
    const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${session.accessToken}`)
    const pagesData = await pagesRes.json()
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json({ error: 'No se encontraron páginas de Facebook vinculadas' }, { status: 404 })
    }

    const page = pagesData.data[0] // Usamos la primera página que encuentre
    const pageId = page.id
    const pageToken = page.access_token

    // 2. Publicar la foto con el texto en el muro de la página
    const postRes = await fetch(`https://graph.facebook.com/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        caption: text,
        access_token: pageToken
      })
    })

    const postData = await postRes.json()
    return NextResponse.json({ success: true, postId: postData.id })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}