import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const FREE_LIMIT = 999

// Registra o recupera usuario y verifica su plan/uso mensual
async function checkAndTrackUsage(email: string): Promise<{ allowed: boolean; isProUser: boolean; usedCount: number }> {
  const month = new Date().toISOString().slice(0, 7) // '2026-04'

  // Upsert usuario (crea si no existe)
  await supabaseAdmin
    .from('users')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

  // Leer plan del usuario
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('email', email)
    .single()

  const isPro = user?.plan === 'pro'
  if (isPro) return { allowed: true, isProUser: true, usedCount: 0 }

  // Leer o crear registro de uso mensual
  const { data: usageRow } = await supabaseAdmin
    .from('usage')
    .select('count')
    .eq('email', email)
    .eq('month', month)
    .single()

  const currentCount = usageRow?.count ?? 0
  if (currentCount >= FREE_LIMIT) {
    return { allowed: false, isProUser: false, usedCount: currentCount }
  }

  // Incrementar uso
  await supabaseAdmin
    .from('usage')
    .upsert(
      { email, month, count: currentCount + 1 },
      { onConflict: 'email,month' }
    )

  return { allowed: true, isProUser: false, usedCount: currentCount + 1 }
}

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

/** Limpia precios inválidos: "USD 0", "desde USD 0", "0", "N/A", etc. */
function cleanPrice(raw: string): string {
  const s = raw.trim()
  if (!s || s === 'N/A' || s === '-' || s === '0') return ''
  // Eliminar si el número es 0 o no hay número real
  if (/\b0\b/.test(s) && !/[1-9]/.test(s)) return ''
  return s
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg', email } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
    }

    // ── Verificar plan y límite de uso ────────────────────────────────────────
    if (!email) {
      return NextResponse.json({ error: 'Email requerido', code: 'NO_EMAIL' }, { status: 400 })
    }
    const { allowed, isProUser, usedCount } = await checkAndTrackUsage(email)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Límite del plan gratuito alcanzado', code: 'LIMIT_REACHED', usedCount },
        { status: 403 }
      )
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
  "postType": "salida" o "promocion" — "salida" si el flyer tiene fecha de viaje concreta y/o precio de paquete. "promocion" si es una promoción genérica, descuento de aerolínea, tarifa especial sin fecha/precio de paquete, o publicidad de destino sin precio concreto.",
  "destination": "nombre de la ciudad o destino (ej: Buzios, Aruba, Cancun)",
  "country": "nombre del país",
  "price": "Si hay precio de paquete turístico: formato 'desde USD XXXX' con el más bajo en base doble (ej: desde USD 1700). Si NO hay precio o es solo una promoción/descuento sin monto: dejar vacío ''.",
  "dates": "Fecha de salida del viaje como string (ej: 02/01/2026). Solo si es una salida concreta. Si no hay fecha de viaje, dejar vacío ''.",
  "nights": "cantidad de noches como string (ej: 7)",
  "hotel": "nombre del hotel principal",
  "includes": ["item1", "item2", "item3"],
  "searchQuery": "3-6 palabras en inglés para buscar fotos del destino (ej: 'Aruba beach turquoise sea', 'Buzios Brazil coast', 'Cancun resort beach Mexico')"
}
IMPORTANTE:
- "price": solo poner si hay un precio real de paquete. Si no hay precio, poner "". NUNCA inventar ni poner "desde USD 0".
- "dates": solo poner si hay una fecha de salida concreta del viaje. Si no, poner "".
- "includes" debe ser un array de strings cortos (vacío [] si no aplica).
- "searchQuery" DEBE incluir el nombre del destino + 2-3 descriptores geográficos/visuales específicos.`,
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

    const isPromocion = toStr(flyer.postType) === 'promocion'

    const systemPrompt = isPromocion
      ? `Sos un community manager rioplatense de una agencia de viajes.
Respondé SOLO con JSON válido: {"facebook": "...", "instagram": "..."}

Este es un flyer de PROMOCIÓN o descuento especial (no una salida con fecha/precio fijo).
Generá un post entusiasta que comunique la oportunidad/destino, sin mencionar fechas de salida ni precios de paquete.

ESTRUCTURA para post promocional:
[Frase llamativa sobre el destino o la promoción]
[2-3 líneas destacando qué hace especial este destino o descuento]
[Call to action para consultar / reservar]
📲 WhatsApp

REGLAS:
- Usá SIEMPRE emojis Unicode reales: ✈️ 🏖️ 🌴 🌟 🔥 💫 🎉 👉 📲 🗺️
- NUNCA menciones precios ni fechas de salida
- Estilo: rioplatense, entusiasta, máximo 150 palabras por red.`
      : `Sos un community manager rioplatense de una agencia de viajes.
Respondé SOLO con JSON válido: {"facebook": "...", "instagram": "..."}

Generá el texto para el post siguiendo estrictamente esta estructura:
[Frase inicial vendedora]
✈️ SALIDA: [Fecha si existe, sino omitir esta línea]
✅ INCLUYE:
✈️ Vuelos desde Buenos Aires
🏨 Hotel: [Nombre del hotel] con [Régimen]
🚌 Traslados de llegada y salida
⭐ Asistencia al viajero
${flyer.price ? '💰 VALOR: [Precio] por persona en base doble' : ''}
[Frase de cierre invitando a la acción]
📲 WhatsApp

REGLAS DE EMOJIS (MUY IMPORTANTE):
- Usá SIEMPRE emojis Unicode reales: ✈️ 🏨 🌴 🏖️ 🗓️ 💰 🎉 🌟 ⭐ 🍳 🚌 🛡️ 📍 💫 🔥 👉 📲
- NUNCA uses ◆ ◇ ► ▶ ● ni caracteres geométricos
- Si no hay fecha, omitir la línea de SALIDA. Si no hay precio, omitir la línea de VALOR.
- Estilo: rioplatense, entusiasta, máximo 200 palabras por red.`

    const textResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generá los textos para este flyer:\n${flyerSummary}`
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
      await supabaseAdmin.from('flyers').insert([{
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
      price:         cleanPrice(toStr(flyer.price)),
      dates:         toStr(flyer.dates),
      postType:      toStr(flyer.postType) || 'salida',
      nights:        toStr(flyer.nights),
      hotel:         toStr(flyer.hotel),
      includes:      Array.isArray(flyer.includes) ? flyer.includes.map(toStr) : [],
      searchQuery:   toStr(flyer.searchQuery) || toStr(flyer.destination),
      textFacebook:  toStr(texts.facebook),
      textInstagram: toStr(texts.instagram),
      images,
      isPro: isProUser,
      usedCount,
    })

  } catch (error: any) {
    console.error('ERROR GENERAL:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
