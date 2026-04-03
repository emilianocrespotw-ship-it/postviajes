import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/download-image?url=https://...
 *
 * Proxy que descarga una imagen de Pexels/Unsplash y la sirve con
 * Content-Disposition: attachment para que el browser la descargue.
 * Necesario porque cross-origin prevents direct download via <a download>.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('name') || 'postviajes-photo.jpg'

  if (!url) {
    return NextResponse.json({ error: 'Falta el parámetro url' }, { status: 400 })
  }

  // Solo permitir URLs de fuentes conocidas
  const allowed = ['images.pexels.com', 'images.unsplash.com', 'cdn.unsplash.com']
  try {
    const parsed = new URL(url)
    if (!allowed.some(host => parsed.hostname.endsWith(host))) {
      return NextResponse.json({ error: 'Fuente de imagen no permitida' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  try {
    const imgRes = await fetch(url, {
      headers: { 'User-Agent': 'PostViajes/1.0' },
    })
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 502 })
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const buffer = await imgRes.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
