'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const ADMIN_EMAIL = 'emiliano.crespo.tw@gmail.com'
const FREE_LIMIT = 10

interface UserRow {
  email: string
  plan: 'free' | 'pro'
  posts_this_month: number
  posts_reset_month: string
  agency_name: string | null
  created_at: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')

  const isAdmin = session?.user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (status === 'loading') return
    if (!isAdmin) { setLoading(false); return }
    fetchUsers()
  }, [status, isAdmin])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  async function togglePlan(email: string, currentPlan: 'free' | 'pro') {
    const newPlan = currentPlan === 'free' ? 'pro' : 'free'
    setUpdating(email)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan: newPlan }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.email === email ? { ...u, plan: newPlan } : u))
      setMsg(`✓ ${email} → ${newPlan.toUpperCase()}`)
      setTimeout(() => setMsg(''), 3000)
    }
    setUpdating(null)
  }

  async function resetCounter(email: string) {
    setUpdating(email + '-reset')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCounter: true }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.email === email ? { ...u, posts_this_month: 0 } : u))
      setMsg(`✓ Contador de ${email} reseteado`)
      setTimeout(() => setMsg(''), 3000)
    }
    setUpdating(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-gray-500">Necesitás iniciar sesión.</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-gray-500">Acceso restringido.</div>
      </div>
    )
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.agency_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const proCount = users.filter(u => u.plan === 'pro').length
  const freeCount = users.filter(u => u.plan === 'free').length
  const nearLimit = users.filter(u => u.plan === 'free' && u.posts_this_month >= FREE_LIMIT - 2).length

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#111827]">Panel de admin</h1>
          <p className="text-gray-500 text-sm mt-1">PostViajes · {session.user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-black text-[#111827]">{users.length}</div>
            <div className="text-gray-500 text-sm mt-1">Usuarios totales</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-black text-[#E8782E]">{proCount}</div>
            <div className="text-gray-500 text-sm mt-1">Plan Pro</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-black text-amber-500">{nearLimit}</div>
            <div className="text-gray-500 text-sm mt-1">Cerca del límite</div>
          </div>
        </div>

        {/* Flash message */}
        {msg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por email o agencia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#E8782E]/30"
          />
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-4 font-semibold">Usuario</th>
                <th className="text-left px-4 py-4 font-semibold">Plan</th>
                <th className="text-left px-4 py-4 font-semibold">Posts este mes</th>
                <th className="text-right px-5 py-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-10">
                    {search ? 'Sin resultados' : 'No hay usuarios registrados aún'}
                  </td>
                </tr>
              )}
              {filtered.map(u => {
                const isNearLimit = u.plan === 'free' && u.posts_this_month >= FREE_LIMIT - 2
                const atLimit = u.plan === 'free' && u.posts_this_month >= FREE_LIMIT
                return (
                  <tr key={u.email} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#111827]">{u.email}</div>
                      {u.agency_name && (
                        <div className="text-xs text-gray-400 mt-0.5">{u.agency_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.plan === 'pro'
                          ? 'bg-[#E8782E]/10 text-[#E8782E]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.plan === 'pro' ? '⭐ PRO' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${atLimit ? 'bg-red-400' : isNearLimit ? 'bg-amber-400' : 'bg-[#E8782E]'}`}
                            style={{ width: u.plan === 'pro' ? '0%' : `${Math.min(100, (u.posts_this_month / FREE_LIMIT) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${atLimit ? 'text-red-500' : 'text-gray-500'}`}>
                          {u.plan === 'pro' ? '∞' : `${u.posts_this_month}/${FREE_LIMIT}`}
                        </span>
                        {atLimit && <span className="text-xs text-red-400 font-bold">LÍMITE</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset counter button */}
                        {u.plan === 'free' && u.posts_this_month > 0 && (
                          <button
                            onClick={() => resetCounter(u.email)}
                            disabled={updating === u.email + '-reset'}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                          >
                            {updating === u.email + '-reset' ? '...' : 'Reset'}
                          </button>
                        )}
                        {/* Toggle plan button */}
                        <button
                          onClick={() => togglePlan(u.email, u.plan)}
                          disabled={updating === u.email}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                            u.plan === 'pro'
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-[#E8782E] text-white hover:bg-[#d06820]'
                          }`}
                        >
                          {updating === u.email ? '...' : u.plan === 'pro' ? '↓ Bajar a Free' : '↑ Subir a Pro'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          {filtered.length} de {users.length} usuarios
        </p>
      </div>
    </div>
  )
}
