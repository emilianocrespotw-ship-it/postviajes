'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { Upload, Bot, Image as ImageIcon, Palette, Rocket } from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setCurrentStep(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const processFlyer = async () => {
    if (!preview) return alert('Por favor, seleccioná una imagen')
    setLoading(true)
    setCurrentStep(2)
    try {
      const response = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: preview.split(',')[1],
          extraInfo: '' 
        })
      })
      const data = await response.json()
      setResult(data)
      setCurrentStep(5)
    } catch (error) {
      alert('Error al procesar el flyer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">
          Post <span className="text-indigo-500">Viajes</span>
        </div>
        
        {session ? (
          <div className="flex items-center gap-4">
            <img src={session.user?.image || ''} className="w-8 h-8 rounded-full border border-indigo-500" />
            <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition">Salir</button>
          </div>
        ) : (
          <button onClick={() => signIn('facebook')} className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium transition text-sm">
            Conectar Facebook
          </button>
        )}
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-4xl mx-auto pt-20 pb-12 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-tight">
          De flyer a post publicado <br /> en segundos
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Subís el flyer del paquete. La IA lee la imagen, detecta el destino, genera el texto y buscamos fotos de apoyo. Sin copiar, sin pegar.
        </p>

        {/* HERRAMIENTA DE CARGA */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl max-w-2xl mx-auto mb-20">
          {!result ? (
            <div className="space-y-6">
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-12 transition bg-slate-800/30">
                  {preview ? (
                    <img src={preview} className="max-h-48 mx-auto rounded-lg shadow-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Upload className="w-12 h-12 text-indigo-500" />
                      <p className="font-medium text-lg text-white">Arrastrá tu flyer aquí</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={processFlyer}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {loading ? 'Procesando...' : '¡Generar Posteos! →'}
              </button>
            </div>
          ) : (
            /* RESULTADOS */
            <div className="text-left space-y-6 animate-in fade-in zoom-in duration-500">
                <h3 className="text-2xl font-bold border-b border-slate-800 pb-4">{result.destination}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">Facebook Post</p>
                        <p className="text-sm text-slate-300 leading-relaxed italic line-clamp-6">{result.textFacebook}</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-pink-400 font-bold uppercase mb-2">Instagram Post</p>
                        <p className="text-sm text-slate-300 leading-relaxed italic line-clamp-6">{result.textInstagram}</p>
                    </div>
                </div>
                <button 
                  disabled={!session}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl transition font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    {session ? '🚀 Publicar ahora mismo' : '🔒 Conectá Facebook para publicar'}
                </button>
            </div>
          )}
        </div>

        {/* PASOS ILUMINADOS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-12">
          <Step active={currentStep >= 1} icon={Upload} step="1" title="Subís flyer" />
          <Step active={currentStep >= 2} icon={Bot} step="2" title="IA analiza" />
          <Step active={currentStep >= 3} icon={ImageIcon} step="3" title="Fotos" />
          <Step active={currentStep >= 4} icon={Palette} step="4" title="Estilo" />
          <Step active={currentStep >= 5} icon={Rocket} step="5" title="Publicás" />
        </div>
      </main>
    </div>
  )
}

function Step({ active, icon: Icon, step, title }: any) {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-700 ${active ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-slate-800 bg-slate-900/40'}`}>
      <Icon className={`w-8 h-8 mx-auto mb-4 transition-colors duration-700 ${active ? 'text-green-500' : 'text-slate-600'}`} />
      <p className={`text-[10px] font-bold uppercase mb-1 transition-colors duration-700 ${active ? 'text-green-400' : 'text-slate-500'}`}>PASO {step}</p>
      <h4 className={`font-bold text-sm transition-colors duration-700 ${active ? 'text-white' : 'text-slate-500'}`}>{title}</h4>
    </div>
  )
}