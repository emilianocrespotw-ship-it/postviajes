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
            /* RESULTADOS PROFESIONALES */
            <div className="text-left space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="flex justify-between items-end border-b border-slate-800 pb-6">
                    <div>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Destino Detectado</p>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {result.destination} <span className="text-slate-500 font-light">| {result.country}</span>
                        </h3>
                    </div>
                    <button onClick={() => {setResult(null); setPreview(null)}} className="text-xs text-slate-500 hover:text-indigo-400 transition underline underline-offset-4">
                        Procesar otro flyer
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CARD FACEBOOK */}
                    <div className="group relative bg-slate-800/20 border border-slate-700/50 p-5 rounded-2xl hover:bg-slate-800/40 transition">
                        <div className="flex justify-between items-center mb-4">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                Facebook Post
                            </span>
                            <button 
                                onClick={() => {navigator.clipboard.writeText(result.textFacebook); alert('¡Copiado!')}}
                                className="text-[10px] bg-slate-700 hover:bg-indigo-600 px-3 py-1 rounded-full transition"
                            >
                                Copiar
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed overflow-y-auto max-h-[200px] scrollbar-hide">
                            {result.textFacebook}
                        </p>
                    </div>

                    {/* CARD INSTAGRAM */}
                    <div className="group relative bg-slate-800/20 border border-slate-700/50 p-5 rounded-2xl hover:bg-slate-800/40 transition">
                        <div className="flex justify-between items-center mb-4">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
                                Instagram Post
                            </span>
                            <button 
                                onClick={() => {navigator.clipboard.writeText(result.textInstagram); alert('¡Copiado!')}}
                                className="text-[10px] bg-slate-700 hover:bg-indigo-600 px-3 py-1 rounded-full transition"
                            >
                                Copiar
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed overflow-y-auto max-h-[200px] scrollbar-hide">
                            {result.textInstagram}
                        </p>
                    </div>
                </div>

                {/* GALERÍA PEXELS */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Fotos sugeridas (Pexels)</p>
                        <span className="text-[10px] text-slate-500 italic">Click para descargar</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {result.images?.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block group overflow-hidden rounded-xl border border-slate-700 hover:border-indigo-500 transition">
                                <img src={url} className="h-20 w-full object-cover group-hover:scale-110 transition duration-500" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* BOTÓN WHATSAPP COMPARTIR */}
                <button 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Mira este paquete a ${result.destination}: ${result.textFacebook}`)}`)}
                  className="w-full bg-green-600/10 border border-green-500/30 text-green-400 py-3 rounded-xl hover:bg-green-600/20 transition flex items-center justify-center gap-2 text-sm font-bold"
                >
                    Compartir por WhatsApp 💬
                </button>
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