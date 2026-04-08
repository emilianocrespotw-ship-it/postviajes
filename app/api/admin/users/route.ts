import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ADMIN_EMAIL } from '@/lib/usage'

function isAdmin(email: string | null | undefined) {
  return email === ADMIN_EMAIL
}

// GET /api/admin/users — lista todos los usuarios (solo admin)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('email, plan, posts_this_month, posts_reset_month, agency_name, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data || [] })
}

// POST /api/admin/users — upgrade/downgrade de un usuario (solo admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email, plan } = await req.json()
  if (!email || !plan || !['free', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ plan })
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, email, plan })
}
