import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, style = 'Standard' } = await req.json()
    
    // 1. IA analiza y genera textos según el ESTILO elegido
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      system: `Sos un experto en marketing de viajes. Estilo solicitado: ${style}. Respondé SOLO JSON puro.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: 'Analizá el flyer y generá: 1) destination, 2) fbText (emotivo, largo), 3) igText (con hashtags), 4) searchKeywords (3 palabras en inglés para fotos).' }
        ]
      }]
    })

    const rawText = (response.content[0] as any).text
    const data = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0])

    // 2. Buscamos 10 opciones de imágenes en Pexels
    const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(data.searchKeywords)}&per_page=10`, {
      headers: { Authorization: process.env.PEXELS_API_KEY! }
    })
    const pexelsData = await pexelsRes.json()
    const images = pexelsData.photos?.map((p: any) => p.src.large) || []

    return NextResponse.json({ ...data, images })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}