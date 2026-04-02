import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/suggest-images?q=Aruba+Caribe+travel
 *
 * Busca fotos en Pexels y Unsplash en paralelo.
 * Retorna array de { id, url, thumbnail, photographer, source }.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Falta el parámetro q' }, { status: 400 })
  }

  const [pexelsImages, unsplashImages] = await Promise.allSettled([
    fetchPexels(query),
    fetchUnsplash(query),
  ])

  const images = [
    ...(pexelsImages.status === 'fulfilled' ? pexelsImages.value : []),
    ...(unsplashImages.status === 'fulfilled' ? unsplashImages.value : []),
  ]

  if (images.length === 0) {
    return NextResponse.json({ error: 'No se encontraron imágenes' }, { status: 500 })
  }

  return NextResponse.json({ images })
}

async function fetchPexels(query: string) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  )
  if (!res.ok) throw new Error(`Pexels error: ${res.status}`)
  const data = await res.json()
  return (data.photos || []).map((photo: any) => ({
    id: `pexels-${photo.id}`,
    url: photo.src.large2x,
    thumbnail: photo.src.medium,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    source: 'Pexels',
  }))
}

async function fetchUnsplash(query: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } }
  )
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((photo: any) => ({
    id: `unsplash-${photo.id}`,
    url: photo.urls.full,
    thumbnail: photo.urls.small,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    source: 'Unsplash',
  }))
}
