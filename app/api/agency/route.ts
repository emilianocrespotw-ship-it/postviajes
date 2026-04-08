import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/agency — trae logo_data y agency_name del usuario logueado
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('agency_name, logo_data')
    .eq('email', session.user.email)
    .single()

  if (error || !data) {
    return NextResponse.json({ agency_name: null, logo_data: null })
  }

  return NextResponse.json(data)
}

// POST /api/agency — guarda logo_data y/o agency_name
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { agency_name, logo_data } = body

  // Validar tamaño del logo (max 500KB en base64)
  if (logo_data && logo_data.length > 700_000) {
    return NextResponse.json({ error: 'Logo demasiado grande (máx 500KB)' }, { status: 400 })
  }

  const update: Record<string, string> = {}
  if (agency_name !== undefined) update.agency_name = agency_name
  if (logo_data !== undefined) update.logo_data = logo_data

  const { error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('email', session.user.email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
