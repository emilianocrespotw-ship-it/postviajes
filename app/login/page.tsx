'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <span className="text-3xl font-black text-indigo-400">Post</span>
          <span className="text-3xl font-black text-white">Viajes</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Bienvenido</h1>
        <p className="text-slate-400 text-sm mb-8">
          Conectá con Facebook para publicar en tu página e Instagram
        </p>

        <button
          onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
          className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Continuar con Facebook
        </button>

        <p className="text-slate-500 text-xs mt-6">
          Al conectar, aceptás los Términos de uso y la Política de privacidad de PostViajes.
        </p>
      </div>
    </div>
  )
}
