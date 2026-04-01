'use client'
import { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { Upload, Bot, Image as ImageIcon, Palette, Rocket, CheckCircle, ArrowLeft } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FlyerResult {
  destination: string
  country: string
  price: string
  dates: string
  includes: string[]
  textFacebook: string
  textInstagram: string
  searchQuery: string
}

interface PexelsImage {
  id: number
  url: string
  thumbnail: string
  photographer: string
}

const STYLES = [
  { id: 'none',      label: 'Original',     emoji: '✨', filter: '' },
  { id: 'warm',      label: 'Cálido',       emoji: '🌅', filter: 'sepia(0.4) saturate(1.3)' },
  { id: 'cool',      label: 'Fresco',       emoji: '🌊', filter: 'hue-rotate(180deg) saturate(0.8)' },
  { id: 'dramatic',  label: 'Dramático',    emoji: '🌙', filter: 'brightness(0.7) contrast(1.3)' },
  { id: 'vivid',     label: 'Vibrante',     emoji: '🎨', filter: 'saturate(2) brightness(1.1)' },
]

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const { data: session } = useSession()

  // Pasos: upload → processing → images → style → preview
  const [uiStep, setUiStep] = useState<'upload' | 'processing' | 'images' | 'style' | 'preview'>('upload')
  const [currentStep, setCurrentStep] = useState(0) // para los indicadores del fondo

  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [flyerBase64, setFlyerBase64] = useState<string | null>(null)
  const [flyerMime, setFlyerMime] = useState('image/jpeg')
  const [result, setResult] = useState<FlyerResult | null>(null)
  const [images, setImages] = useState<PexelsImage[]>([])
  const [selectedImage, setSelectedImage] = useState<PexelsImage | null>(null)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0])
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerMime(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setFlyerPreview(dataUrl)
      setFlyerBase64(dataUrl.split(',')[1])
      setCurrentStep(1)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const processFlyer = async () => {
    if (!flyerBase64) return
    setUiStep('processing')
    setCurrentStep(2)
    setError(null)

    try {
      const res = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: flyerBase64, mimeType: flyerMime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error procesando el flyer')

      setResult(data)
      setCurrentStep(3)

      // Buscar imágenes en paralelo
      fetch(`/api/suggest-images?q=${encodeURIComponent(data.searchQuery)}`)
        .then(r => r.json())
        .then(d => setImages(d.images || []))
        .catch(() => {})

      setUiStep('images')
    } catch (err: any) {
      setError(err.message || 'Error procesando el flyer')
      setUiStep('upload')
      setCurrentStep(1)
    }
  }

  const handleSelectImage = (img: PexelsImage) => {
    setSelectedImage(img)
    setCurrentStep(4)
    setUiStep('style')
  }

  const handleSelectStyle = (style: typeof STYLES[0]) => {
    setSelectedStyle(style)
    setCurrentStep(5)
    setUiStep('preview')
  }

  const handlePublish = async () => {
    if (!selectedImage || !result) return
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage.url,
          textFacebook: result.textFacebook,
          textInstagram: result.textInstagram,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPublished(true)
      } else {
        setError('Error al publicar: ' + (data.errors?.join(', ') || data.error))
      }
    } catch {
      setError('Error de red al publicar')
    } finally {
      setPublishing(false)
    }
  }

  const reset = () => {
    setUiStep('upload')
    setCurrentStep(0)
    setFlyerPreview(null)
    setFlyerBase64(null)
    setResult(null)
    setImages([])
    setSelectedImage(null)
    setSelectedStyle(STYLES[0])
    setPublished(false)
    setError(null)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-indigo-500/30">
      {/* Nav */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">Post <span className="text-indigo-500">Viajes</span></div>
        {session ? (
          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 pr-4 rounded-full border border-slate-800">
            <img src={session.user?.image || ''} className="w-8 h-8 rounded-full border border-indigo-500" alt="" />
            <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition">Salir</button>
          </div>
        ) : (
          <button onClick={() => signIn('facebook')} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full font-bold transition text-sm shadow-lg shadow-indigo-500/20">Conectar Facebook</button>
        )}
      </nav>

      <main className="max-w-4xl mx-auto pt-10 pb-12 text-center px-4">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          De flyer a post <br /> en segundos
        </h1>
        <p className="text-slate-400 mb-10 text-lg">La IA analiza tu flyer, genera el contenido y lo publica por vos.</p>

        {/* Card principal */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl max-w-2xl mx-auto mb-8">

          {/* ── PASO 1: Upload ── */}
          {uiStep === 'upload' && (
            <div className="space-y-5">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-3 text-sm">{error}</div>}
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('file-input')?.click()}>
                <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className={`border-2 border-dashed rounded-3xl p-14 transition-all duration-500 ${flyerPreview ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/20 group-hover:border-indigo-500/50'}`}>
                  {flyerPreview ? (
                    <img src={flyerPreview} className="max-h-52 mx-auto rounded-2xl shadow-2xl" alt="Flyer" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-500">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="font-semibold text-white">Arrastrá tu flyer aquí</p>
                      <p className="text-sm">o hacé clic para elegirlo</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={processFlyer}
                disabled={!flyerBase64}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
              >
                <Bot className="w-5 h-5" />
                ¡Generar Posteos Mágicos! ✨
              </button>
            </div>
          )}

          {/* ── PASO 2: Procesando ── */}
          {uiStep === 'processing' && (
            <div className="py-12 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Bot className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">La IA está leyendo tu flyer…</p>
                <p className="text-slate-400 text-sm mt-1">Detectando destino, precio y generando los textos</p>
              </div>
              {flyerPreview && <img src={flyerPreview} className="max-h-32 rounded-xl opacity-40" alt="" />}
            </div>
          )}

          {/* ── PASO 3: Elegir imagen ── */}
          {uiStep === 'images' && result && (
            <div className="text-left space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 font-bold tracking-widest mb-1">PASO 2 DE 4</p>
                  <h3 className="text-xl font-bold">Elegí la imagen 🖼️</h3>
                  <p className="text-slate-400 text-sm">Fotos de <span className="text-white font-medium">{result.destination}</span> seleccionadas por la IA</p>
                </div>
                <button onClick={reset} className="text-xs text-slate-500 hover:text-white underline">← Volver</button>
              </div>
              {images.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Buscando fotos…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map(img => (
                    <button
                      key={img.id}
                      onClick={() => handleSelectImage(img)}
                      className="relative rounded-2xl overflow-hidden aspect-video group hover:ring-2 hover:ring-indigo-500 transition"
                    >
                      <img src={img.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="bg-white text-black font-bold text-xs px-3 py-1 rounded-full">Elegir →</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
                        <p className="text-white text-[10px] truncate">{img.photographer}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 4: Elegir estilo ── */}
          {uiStep === 'style' && selectedImage && (
            <div className="text-left space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 font-bold tracking-widest mb-1">PASO 3 DE 4</p>
                  <h3 className="text-xl font-bold">Elegí el estilo 🎨</h3>
                </div>
                <button onClick={() => setUiStep('images')} className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Volver
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleSelectStyle(style)}
                    className="rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={selectedImage.thumbnail}
                        alt={style.label}
                        className="w-full h-full object-cover"
                        style={{ filter: style.filter }}
                      />
                    </div>
                    <div className="bg-slate-800 p-2 text-center">
                      <span className="text-sm font-bold">{style.emoji} {style.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 5: Preview y publicar ── */}
          {uiStep === 'preview' && result && selectedImage && (
            <div className="text-left space-y-5">
              {published ? (
                <div className="py-10 text-center space-y-4">
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-2xl font-black text-white">¡Publicado!</h3>
                  <p className="text-slate-400">El post está live en Facebook e Instagram</p>
                  <button onClick={reset} className="mt-4 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl font-bold transition">
                    Crear otro post →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-400 font-bold tracking-widest mb-1">PASO 4 DE 4</p>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle className="text-green-500 w-5 h-5" /> {result.destination}
                        {result.price && <span className="text-green-400 text-base font-normal">· {result.price}</span>}
                      </h3>
                    </div>
                    <button onClick={() => setUiStep('style')} className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Volver
                    </button>
                  </div>

                  {/* Vista previa imagen */}
                  <div className="rounded-2xl overflow-hidden aspect-video">
                    <img
                      src={selectedImage.thumbnail}
                      alt={result.destination}
                      className="w-full h-full object-cover"
                      style={{ filter: selectedStyle.filter }}
                    />
                  </div>

                  {/* Textos generados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <PostCard title="FACEBOOK" text={result.textFacebook} color="text-blue-400" />
                    <PostCard title="INSTAGRAM" text={result.textInstagram} color="text-pink-400" />
                  </div>

                  {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-3 text-sm">{error}</div>}

                  <button
                    onClick={handlePublish}
                    disabled={!session || publishing}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 py-5 rounded-2xl transition-all font-black text-lg shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
                  >
                    {publishing
                      ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Publicando…</>
                      : session
                        ? <><Rocket className="w-6 h-6" /> 🚀 PUBLICAR AHORA MISMO</>
                        : '🔒 CONECTÁ FACEBOOK PARA PUBLICAR'
                    }
                  </button>
                  {!session && (
                    <button onClick={() => signIn('facebook')} className="w-full bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 py-3 rounded-2xl text-sm font-medium transition">
                      Conectar con Facebook →
                    </button>
                  )}
                  <button onClick={reset} className="w-full text-slate-500 hover:text-white text-sm transition">
                    Empezar de nuevo
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Indicadores de paso */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Step active={currentStep >= 1} icon={Upload}    step="1" title="Subís flyer" />
          <Step active={currentStep >= 2} icon={Bot}       step="2" title="IA analiza" />
          <Step active={currentStep >= 3} icon={ImageIcon} step="3" title="Fotos" />
          <Step active={currentStep >= 4} icon={Palette}   step="4" title="Estilo" />
          <Step active={currentStep >= 5} icon={Rocket}    step="5" title="Publicás" />
        </div>
      </main>
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function PostCard({ title, text, color }: { title: string; text: string; color: string }) {
  const copy = () => { navigator.clipboard.writeText(text) }
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-3xl relative group">
      <p className={`text-[10px] font-black tracking-widest mb-2 ${color}`}>{title}</p>
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-6">{text}</p>
      <button onClick={copy} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-[10px]">
        Copiar
      </button>
    </div>
  )
}

function Step({ active, icon: Icon, step, title }: { active: boolean; icon: any; step: string; title: string }) {
  return (
    <div className={`p-5 rounded-[2rem] border transition-all duration-700 ${active ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10' : 'border-slate-800 bg-slate-900/30'}`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${active ? 'text-green-400' : 'text-slate-600'}`} />
      <p className={`text-xs font-bold transition-colors duration-700 ${active ? 'text-green-400' : 'text-slate-600'}`}>{step}</p>
      <p className={`text-xs mt-0.5 transition-colors duration-700 ${active ? 'text-slate-300' : 'text-slate-600'}`}>{title}</p>
    </div>
  )
}