import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/suggest-images?q=Aruba+beach+Caribbean&destination=Aruba
 *
 * Estrategia de búsqueda en capas para obtener fotos de viaje relevantes:
 * 1. Query principal: destination + "beach travel" (o el searchQuery completo del AI)
 * 2. Si faltan fotos, segunda búsqueda con destination + "tourism landscape"
 * 3. Sin filtro orientation — landscape se recorta bien con CSS object-cover
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''           // searchQuery del AI, ej: "Aruba beach Caribbean"
  const destination = searchParams.get('destination') || q  // ej: "Aruba"

  if (!destination) {
    return NextResponse.json({ error: 'Falta el parámetro q' }, { status: 400 })
  }

  // ── Construir query principal ────────────────────────────────────────────────
  // Si el AI ya generó términos descriptivos (más de una palabra) los usamos.
  // Si es solo el destino, añadimos "travel" para evitar fotos de flores/plantas.
  const words = q.trim().split(/\s+/)
  const primaryQuery = words.length >= 2
    ? q                                             // "Aruba beach Caribbean"
    : `${destination} travel destination`           // "Aruba travel destination"

  // Query de respaldo si los resultados son insuficientes
  const fallbackQuery = `${destination} tourism landmark`

  // ── Buscar en paralelo en Pexels y Unsplash ──────────────────────────────────
  const [pexelsPrimary, unsplashPrimary] = await Promise.allSettled([
    fetchPexels(primaryQuery, 10),
    fetchUnsplash(primaryQuery, 10),
  ])

  let images = [
    ...(pexelsPrimary.status === 'fulfilled' ? pexelsPrimary.value : []),
    ...(unsplashPrimary.status === 'fulfilled' ? unsplashPrimary.value : []),
  ]

  // Si hay menos de 8 fotos, intentar una segunda búsqueda con fallback
  if (images.length < 8) {
    const [pexelsFallback, unsplashFallback] = await Promise.allSettled([
      fetchPexels(fallbackQuery, 6),
      fetchUnsplash(fallbackQuery, 6),
    ])
    const fallback = [
      ...(pexelsFallback.status === 'fulfilled' ? pexelsFallback.value : []),
      ...(unsplashFallback.status === 'fulfilled' ? unsplashFallback.value : []),
    ]
    // Agregar sin duplicar IDs
    const existingIds = new Set(images.map(i => i.id))
    images = [...images, ...fallback.filter(i => !existingIds.has(i.id))]
  }

  if (images.length === 0) {
    return NextResponse.json({ error: 'No se encontraron imágenes' }, { status: 500 })
  }

  // Limitar a 20
  return NextResponse.json({ images: images.slice(0, 20) })
}

async function fetchPexels(query: string, perPage = 10) {
  // SIN orientation=portrait → evita fotos cerradas (flores, retratos)
  // El recorte 3:4 lo maneja CSS con object-cover
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&size=medium`
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY! } })
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return (data.photos || []).map((p: any) => ({
    id: `pexels-${p.id}`,
    url: p.src.large2x || p.src.large,
    thumbnail: p.src.large,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    source: 'Pexels',
  }))
}

async function fetchUnsplash(query: string, perPage = 10) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  // squarish recorta bien, landscape da más paisajes
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((p: any) => ({
    id: `unsplash-${p.id}`,
    url: p.urls.full,
    thumbnail: p.urls.regular,
    photographer: p.user.name,
    photographerUrl: p.user.links.html,
    source: 'Unsplash',
  }))
}
