import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

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

/** Garantiza que un valor sea siempre un string plano */
function toStr(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
    }

    // ── PASO 1: Extraer datos del flyer con tipos explícitos ──────────────────
    console.log('--- PASO 1: Extrayendo datos del flyer ---')
    const extractionResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Sos un extractor de datos de flyers de viajes. Respondé SOLO con JSON puro, sin texto adicional.
Todos los valores deben ser strings simples (NO objetos, NO arrays anidados).
Formato EXACTO:
{
  "destination": "nombre de la ciudad o destino (ej: Buzios, Aruba, Cancun)",
  "country": "nombre del país",
  "price": "precio por persona como string (ej: USD 1700 por persona)",
  "dates": "fechas del viaje como string (ej: 02/01/2026 al 09/01/2026)",
  "nights": "cantidad de noches como string (ej: 7)",
  "hotel": "nombre del hotel principal",
  "includes": ["item1", "item2", "item3"],
  "searchQuery": "3-6 palabras en inglés para buscar fotos del destino (ej: 'Aruba beach turquoise sea', 'Buzios Brazil coast', 'Cancun resort beach Mexico')"
}
IMPORTANTE:
- "price" debe ser SOLO el precio por persona (string simple, ej: "USD 1700 por persona")
- "includes" debe ser un array de strings cortos
- "searchQuery" DEBE incluir el nombre del destino + 2-3 descriptores geográficos/visuales
  específicos del lugar (playa, montaña, ciudad, etc.) para que las fotos sean del lugar exacto.
  Ejemplo: "Aruba Eagle Beach palm trees" es mejor que solo "Aruba"`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as any, data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Extraé los datos de este flyer de viajes. Respondé SOLO con el JSON indicado.'
          }
        ]
      }]
    })

    const flyer = cleanJSON((extractionResponse.content[0] as any).text)

    // ── PASO 2: Generar textos para redes con formato obligatorio ─────────────
    console.log('--- PASO 2: Generando textos para redes ---')

    // Preparar un resumen limpio para el prompt de generación
    const includes = Array.isArray(flyer.includes)
      ? flyer.includes.map(toStr).join(' / ')
      : toStr(flyer.includes)
    const flyerSummary = [
      `Destino: ${toStr(flyer.destination)}`,
      flyer.country ? `País: ${toStr(flyer.country)}` : '',
      flyer.dates   ? `Fechas: ${toStr(flyer.dates)}`  : '',
      flyer.nights  ? `Noches: ${toStr(flyer.nights)}`  : '',
      flyer.hotel   ? `Hotel: ${toStr(flyer.hotel)}`   : '',
      includes      ? `Incluye: ${includes}`            : '',
      flyer.price   ? `Precio: ${toStr(flyer.price)}`  : '',
    ].filter(Boolean).join('\n')

    const textResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: `Sos un community manager rioplatense de una agencia de viajes.
Respondé SOLO con JSON: {"facebook": "...", "instagram": "..."}

REGLAS DE EMOJIS (MUY IMPORTANTE):
- Usá SIEMPRE emojis Unicode reales: ✈️ 🏨 🌴 🏖️ 🗓️ 💰 🎉 🌟 ⭐ 🍳 🚌 🛡️ 📍 💫 🔥 👉 📲
- NUNCA uses ◆ ◇ ► ▶ ● ni caracteres geométricos como viñetas
- Cada ítem de la lista debe empezar con un emoji temático relevante:
  vuelo → ✈️, hotel → 🏨, traslados → 🚌, desayuno → 🍳, seguro → 🛡️,
  fechas → 🗓️, precio → 💰, noches → 🌙, playa → 🏖️, montaña → 🏔️

Cada texto DEBE incluir (en este orden):
1. Emoji llamativo + nombre del destino en MAYÚSCULAS + cantidad de noches
2. Las fechas de viaje con emoji 🗓️
3. Lista de qué incluye, cada ítem con su emoji temático
4. El precio por persona destacado con 💰
5. Call to action con emoji 📲 o 👉

Estilo: rioplatense, entusiasta, máximo 200 palabras por red.`,
      messages: [{
        role: 'user',
        content: `Generá los textos para este paquete:\n${flyerSummary}`
      }]
    })

    const texts = cleanJSON((textResponse.content[0] as any).text)

    // ── PASO 3: Imágenes de Pexels (backup, el carousel usa suggest-images) ──
    console.log('--- PASO 3: Buscando imágenes en Pexels ---')
    let images: string[] = []
    try {
      const searchQ = toStr(flyer.searchQuery) || toStr(flyer.destination)
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQ)}&per_page=5`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      )
      const data = await pexelsRes.json()
      images = data.photos?.map((p: any) => p.src.large) || []
    } catch (e) {
      console.error('Error Pexels', e)
    }

    // ── Guardar en Supabase (opcional) ────────────────────────────────────────
    try {
      await supabase.from('flyers').insert([{
        destination: toStr(flyer.destination),
        country: toStr(flyer.country),
        text_facebook: toStr(texts.facebook),
        text_instagram: toStr(texts.instagram),
        image_url: images[0] || null
      }])
    } catch (e) {
      console.warn('Supabase: error al guardar', e)
    }

    return NextResponse.json({
      destination:   toStr(flyer.destination),
      country:       toStr(flyer.country),
      price:         toStr(flyer.price),
      dates:         toStr(flyer.dates),
      nights:        toStr(flyer.nights),
      hotel:         toStr(flyer.hotel),
      includes:      Array.isArray(flyer.includes) ? flyer.includes.map(toStr) : [],
      searchQuery:   toStr(flyer.searchQuery) || toStr(flyer.destination),
      textFacebook:  toStr(texts.facebook),
      textInstagram: toStr(texts.instagram),
      images,
    })

  } catch (error: any) {
    console.error('ERROR GENERAL:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
