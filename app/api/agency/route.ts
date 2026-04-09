import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

/** Identifier: email si existe, sino Facebook userId como fallback */
function getUserId(session: any): string | null {
  return session?.user?.email || session?.userId || null
}

// GET /api/agency — trae logo_data y agency_name del usuario logueado
export async function GET() {
  const session: any = await getServerSession(authOptions)
  const userId = getUserId(session)
  if (!userId) {
    return NextResponse.json({ agency_name: null, logo_data: null })
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('agency_name, logo_data')
    .eq('email', userId)
    .single()

  return NextResponse.json({
    agency_name: data?.agency_name ?? null,
    logo_data: data?.logo_data ?? null,
  })
}

// POST /api/agency — guarda logo_data y/o agency_name
export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions)
  const userId = getUserId(session)
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { agency_name, logo_data } = body

  // Validar tamaño del logo (max 500KB en base64)
  if (logo_data && logo_data.length > 700_000) {
    return NextResponse.json({ error: 'Logo demasiado grande (máx 500KB)' }, { status: 400 })
  }

  const upsertData: Record<string, string> = { email: userId, plan: 'free' }
  if (agency_name !== undefined) upsertData.agency_name = agency_name
  if (logo_data !== undefined) upsertData.logo_data = logo_data

  const { error } = await supabaseAdmin
    .from('users')
    .upsert(upsertData, { onConflict: 'email' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
