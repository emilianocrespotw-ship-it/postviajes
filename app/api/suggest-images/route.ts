import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/suggest-images?q=Aruba+Caribe+travel
 *
 * Busca 10 fotos del destino via Pexels API.
 * Retorna array de { url, thumbnail, photographer, source }.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Falta el parámetro q' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()

    const images = data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.src.large2x,   // URL de alta resolución para publicar
      thumbnail: photo.src.medium, // Miniatura para mostrar en la UI
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      source: 'Pexels',
    }))

    return NextResponse.json({ images })

  } catch (error: any) {
    console.error('Error en /api/suggest-images:', error)
    return NextResponse.json(
      { error: error.message || 'Error buscando imágenes' },
      { status: 500 }
    )
  }
}
