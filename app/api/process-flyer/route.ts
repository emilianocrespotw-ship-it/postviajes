import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function cleanJSON(text: string) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : JSON.parse(text)
  } catch (e) {
    console.error('Error limpiando JSON:', text)
    throw new Error('La IA no devolvió un formato válido.')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
    }

    console.log('--- PASO 1: Extrayendo datos del flyer ---')
    const extractionResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: 'Sos un extractor de datos de viajes. Respondé SOLO con JSON puro.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as any,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Extraé en JSON: destination, country, price, dates, hotel, includes (array), y searchQuery (en inglés).'
            }
          ]
        }
      ]
    })

    const flyer = cleanJSON((extractionResponse.content[0] as any).text)

    console.log('--- PASO 2: Generando textos para redes ---')
    const textResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2048,
      system:
        'Sos un community manager rioplatense. Respondé SOLO con JSON: {"facebook": "...", "instagram": "..."}',
      messages: [
        {
          role: 'user',
          content: `Generá posteos para: ${JSON.stringify(flyer)}`
        }
      ]
    })

    const texts = cleanJSON((textResponse.content[0] as any).text)

    console.log('--- PASO 3: Buscando imágenes en Pexels ---')
    let images: string[] = []

    try {
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          flyer.searchQuery
        )}&per_page=5`,
        {
          headers: { Authorization: process.env.PEXELS_API_KEY! }
        }
      )

      const data = await pexelsRes.json()
      images = data.photos?.map((p: any) => p.src.large) || []
    } catch (e) {
      console.error('Error Pexels', e)
    }

    // Guardar en Supabase (opcional)
    try {
      await supabase.from('flyers').insert([
        {
          destination: flyer.destination,
          country: flyer.country,
          text_facebook: texts.facebook,
          text_instagram: texts.instagram,
          image_url: images[0] || null
        }
      ])
    } catch (e) {
      console.warn('Supabase: error al guardar', e)
    }

    return NextResponse.json({
      ...flyer,
      textFacebook: texts.facebook,
      textInstagram: texts.instagram,
      images
    })
  } catch (error: any) {
    console.error('ERROR GENERAL:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
