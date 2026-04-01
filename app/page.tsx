'use client'

import { useState } from 'react'
import { Upload, Bot, Image as ImageIcon, Palette, Rocket, CheckCircle2 } from 'lucide-react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [extraInfo, setExtraInfo] = useState('')
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const processFlyer = async () => {
    if (!preview) return alert('Por favor, seleccioná una imagen')
    setLoading(true)
    try {
      const base64Content = preview.split(',')[1]
      const mimeType = preview.split(';')[0].split(':')[1]
      const response = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Content, mimeType, extraInfo })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      alert('Error al procesar el flyer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">
          Post <span className="text-indigo-500">Viajes</span>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium transition text-sm">
          Empezar gratis
        </button>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-4xl mx-auto pt-20 pb-12 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          Herramienta de social media con IA para agencias de viajes
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          De flyer a post publicado <br /> en segundos
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Subís el flyer del paquete. La IA lee la imagen, detecta el destino, genera el texto y buscamos fotos de apoyo. Sin copiar, sin pegar.
        </p>

        {/* HERRAMIENTA DE CARGA */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl max-w-2xl mx-auto relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-3xl rounded-full group-hover:bg-indigo-600/30 transition duration-500" />
          
          {!result ? (
            <div className="space-y-6">
              <div className="relative group/input">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-700 group-hover/input:border-indigo-500/50 rounded-2xl p-12 transition bg-slate-800/30">
                  {preview ? (
                    <img src={preview} className="max-h-48 mx-auto rounded-lg shadow-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Upload className="w-12 h-12 text-indigo-500" />
                      <p className="font-medium text-lg text-white">Arrastrá tu flyer aquí</p>
                      <p className="text-sm text-slate-500 italic">JPG, PNG o PDF de tu paquete</p>
                    </div>
                  )}
                </div>
              </div>

              <textarea 
                placeholder="Información extra (opcional)..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 transition"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
              />

              <button 
                onClick={processFlyer}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Rocket className="w-5 h-5" />}
                {loading ? 'Procesando flyer...' : '¡Generar Posteos y buscar fotos! →'}
              </button>
              <p className="text-slate-500 text-xs">Sin tarjeta, empezá a procesar gratis.</p>
            </div>
          ) : (
            /* RESULTADOS STYLED */
            <div className="text-left space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="text-xl font-bold">{result.destination} <span className="text-slate-500 font-normal">| {result.country}</span></h3>
                    <button onClick={() => setResult(null)} className="text-xs text-slate-400 hover:text-white underline">Subir otro</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase mb-2">Instagram Post</p>
                        <p className="text-sm text-slate-300 leading-relaxed italic line-clamp-6">"{result.textInstagram}"</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">Facebook Post</p>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">"{result.textFacebook}"</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase">Fotos sugeridas (Pexels)</p>
                    <div className="grid grid-cols-5 gap-2">
                        {result.images?.map((url: string, i: number) => (
                            <img key={i} src={url} className="h-16 w-full object-cover rounded-lg border border-slate-700" />
                        ))}
                    </div>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-2xl font-bold text-center mb-16">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <FeatureCard step="PASO 1" title="Subís el flyer" desc="JPG, PNG o PDF que te dio tu mayorista." Icon={Upload} />
          <FeatureCard step="PASO 2" title="La IA lee todo" desc="Detecta destino, precio, hotel y servicios." Icon={Bot} />
          <FeatureCard step="PASO 3" title="Elegís la imagen" desc="Traemos fotos HD reales del destino." Icon={ImageIcon} />
          <FeatureCard step="PASO 4" title="Elegís el estilo" desc="Entusiasta, profesional o divertido." Icon={Palette} />
          <FeatureCard step="PASO 5" title="Publicás" desc="Directo a Facebook e Instagram sin copiar." Icon={Rocket} />
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ step, title, desc, Icon }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl text-center group hover:border-indigo-500/30 transition">
      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition duration-300">
        <Icon className="w-6 h-6 text-indigo-500" />
      </div>
      <p className="text-indigo-400 text-[10px] font-bold mb-1">{step}</p>
      <h4 className="font-bold mb-2 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}