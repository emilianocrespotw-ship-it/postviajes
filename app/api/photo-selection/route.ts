import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/photo-selection
 * Registra qué foto eligió el usuario para un destino dado.
 * Hace upsert en `photo_selections`: incrementa selected_count si ya existe.
 *
 * SQL para crear la tabla (correr una vez en Supabase):
 *
 * CREATE TABLE IF NOT EXISTS photo_selections (
 *   id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   destination     text NOT NULL,
 *   photo_url       text NOT NULL,
 *   source          text,
 *   photographer    text,
 *   selected_count  integer NOT NULL DEFAULT 1,
 *   created_at      timestamptz DEFAULT now(),
 *   updated_at      timestamptz DEFAULT now(),
 *   UNIQUE (destination, photo_url)
 * );
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { destination, photoUrl, source, photographer } = await req.json()

    if (!destination || !photoUrl) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const destNorm = destination.toLowerCase().trim()

    // Intentar incrementar si ya existe
    const { data: existing } = await supabaseAdmin
      .from('photo_selections')
      .select('id, selected_count')
      .eq('destination', destNorm)
      .eq('photo_url', photoUrl)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('photo_selections')
        .update({ selected_count: existing.selected_count + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('photo_selections')
        .insert({ destination: destNorm, photo_url: photoUrl, source, photographer, selected_count: 1 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // No bloquear al usuario si falla el tracking
    console.error('photo-selection error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
