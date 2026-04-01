import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, mimeType = 'image/jpeg', extraInfo = '' } = body

    if (!imageBase64) return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })

    // PASO 1 — EXTRACCIÓN (Claude 3.5)
    const extractionResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: 'Sos un extractor de datos de viajes. Respondé SIEMPRE con JSON válido.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType as any, data: imageBase64 } },
          { type: 'text', text: 'Extraé la info en JSON con destination, country, price, dates, hotel, includes (array), y un searchQuery (en inglés).' }
        ]
      }]
    })

    const flyer = JSON.parse((extractionResponse.content[0] as any).text.replace(/```json|```/g, '').trim())

    // PASO 2 — GENERACIÓN DE TEXTOS (Más estricto)
    const textResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      system: 'Sos un community manager rioplatense experto. Respondé SOLO el JSON puro, sin texto antes ni después.',
      messages: [{
        role: 'user',
        content: `Basado en este paquete: ${JSON.stringify(flyer)}, generá:
        1) Un post de Facebook (extenso, con emojis).
        2) Un caption de Instagram (más corto + 20 hashtags).
        
        Respondé EXACTAMENTE este formato JSON:
        {
          "facebook": "texto de fb aquí",
          "instagram": "texto de ig aquí"
        }`
      }]
    })

    const texts = JSON.parse((textResponse.content[0] as any).text.replace(/```json|```/g, '').trim())

    // PASO 3 — BÚSQUEDA DE IMÁGENES (Pexels)
    let suggestedImages = []
    try {
      const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(flyer.searchQuery)}&per_page=5`, {
        headers: { Authorization: process.env.PEXELS_API_KEY! }
      })
      const pexelsData = await pexelsRes.json()
      suggestedImages = pexelsData.photos?.map((p: any) => p.src.large) || []
    } catch (err) { console.error("Error Pexels:", err) }

    // PASO 4 — GUARDAR EN SUPABASE 🆕
    const { error: dbError } = await supabase
      .from('flyers')
      .insert([{
        destination: flyer.destination,
        country: flyer.country,
        price: flyer.price,
        dates: flyer.dates,
        hotel: flyer.hotel,
        includes: flyer.includes,
        text_facebook: texts.facebook,
        text_instagram: texts.instagram,
        image_url: suggestedImages[0] || null
      }])

    if (dbError) console.error("Error Supabase:", dbError)

    return NextResponse.json({
      ...flyer,
      textFacebook: texts.facebook,
      textInstagram: texts.instagram,
      images: suggestedImages
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}