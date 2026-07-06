import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/download-image?url=https://...&name=file.jpg&mode=proxy
 *
 * Proxy para imágenes de Pexels/Unsplash/Supabase.
 * mode=proxy  → Content-Disposition: inline  (para canvas / img.src en Safari)
 * mode omitido → Content-Disposition: attachment (para descarga directa)
 */
export async function GET(req: NextRequest) {
  const url      = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('name') || 'postviajes-photo.jpg'
  const mode     = req.nextUrl.searchParams.get('mode')  // 'proxy' | null

  if (!url) {
    return NextResponse.json({ error: 'Falta el parámetro url' }, { status: 400 })
  }

  // Solo permitir URLs de fuentes conocidas — BUG-08: usar punto para evitar notsupabase.co
  const ALLOWED_HOSTS = [
    'images.pexels.com',
    'images.unsplash.com',
    'cdn.unsplash.com',
  ]
  const ALLOWED_SUFFIX = '.supabase.co'   // Sólo subdominios reales de Supabase

  try {
    const parsed = new URL(url)
    const host   = parsed.hostname
    const ok =
      ALLOWED_HOSTS.includes(host) ||
      host.endsWith(ALLOWED_SUFFIX)
    if (!ok) {
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
    const buffer      = await imgRes.arrayBuffer()

    // BUG-06: mode=proxy → inline (Safari/canvas acepta inline, rechaza attachment)
    const disposition = mode === 'proxy'
      ? 'inline'
      : `attachment; filename="${filename}"`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': disposition,
        'Cache-Control':       'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
