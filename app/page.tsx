'use client'
import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Upload, Bot, Image as ImageIcon, Palette, Rocket, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FlyerResult {
  destination: string
  country: string
  price: string
  dates: string
  nights: string
  hotel: string
  includes: string[]
  textFacebook: string
  textInstagram: string
  searchQuery: string
}

interface Photo {
  id: string
  url: string
  thumbnail: string
  photographer: string
  photographerUrl: string
  source: string
}

const STYLES = [
  { id: 'none',     label: 'Original',  emoji: '✨', filter: '' },
  { id: 'warm',     label: 'Cálido',    emoji: '🌅', filter: 'sepia(0.4) saturate(1.3)' },
  { id: 'cool',     label: 'Fresco',    emoji: '🌊', filter: 'hue-rotate(180deg) saturate(0.8)' },
  { id: 'dramatic', label: 'Dramático', emoji: '🌙', filter: 'brightness(0.7) contrast(1.3)' },
  { id: 'vivid',    label: 'Vibrante',  emoji: '🎨', filter: 'saturate(2) brightness(1.1)' },
]

// ─── Helper: convierte cualquier valor a string seguro ───────────────────────
function toStr(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const { data: session } = useSession()

  const [uiStep, setUiStep] = useState<'upload' | 'processing' | 'images' | 'style' | 'preview'>('upload')
  const [animDir, setAnimDir] = useState<'left' | 'right' | 'up'>('up')
  const [currentStep, setCurrentStep] = useState(0)

  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [flyerBase64, setFlyerBase64] = useState<string | null>(null)
  const [flyerMime, setFlyerMime] = useState('image/jpeg')
  const [result, setResult] = useState<FlyerResult | null>(null)
  const [images, setImages] = useState<Photo[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0])
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram'>('instagram')

  // ─── Navegación con animación ────────────────────────────────────────────────
  const goTo = (step: typeof uiStep, dir: typeof animDir = 'left') => {
    setAnimDir(dir)
    setUiStep(step)
  }

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
    goTo('processing', 'left')
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

      // Normalise all fields — prevents "Objects are not valid as React child"
      const normalized: FlyerResult = {
        destination:   toStr(data.destination),
        country:       toStr(data.country),
        price:         toStr(data.price),
        dates:         toStr(data.dates),
        nights:        toStr(data.nights),
        hotel:         toStr(data.hotel),
        includes:      Array.isArray(data.includes) ? data.includes.map(toStr) : [],
        textFacebook:  toStr(data.textFacebook),
        textInstagram: toStr(data.textInstagram),
        searchQuery:   toStr(data.searchQuery) || toStr(data.destination),
      }

      setResult(normalized)
      setCurrentStep(3)
      setCarouselIndex(0)

      // Pass destination separately for precision matching
      const params = new URLSearchParams({
        q: normalized.searchQuery,
        destination: normalized.destination,
      })
      fetch(`/api/suggest-images?${params}`)
        .then(r => r.json())
        .then(d => setImages(Array.isArray(d.images) ? d.images : []))
        .catch(() => {})

      goTo('images', 'left')
    } catch (err: any) {
      setError(err.message || 'Error procesando el flyer')
      goTo('upload', 'right')
      setCurrentStep(1)
    }
  }

  const handleSelectImage = (img: Photo) => {
    setSelectedImage(img)
    setCurrentStep(4)
    goTo('style', 'left')
  }

  const handleSelectStyle = (style: typeof STYLES[0]) => {
    setSelectedStyle(style)
    setCurrentStep(5)
    goTo('preview', 'left')
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
    setAnimDir('right')
    setUiStep('upload')
    setCurrentStep(0)
    setFlyerPreview(null)
    setFlyerBase64(null)
    setResult(null)
    setImages([])
    setCarouselIndex(0)
    setSelectedImage(null)
    setSelectedStyle(STYLES[0])
    setPublished(false)
    setError(null)
  }

  const animClass =
    animDir === 'left'  ? 'animate-fade-left'  :
    animDir === 'right' ? 'animate-fade-right' :
    'animate-fade-up'

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-indigo-500/30">

      {/* ── HEADER FIJO ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800/60">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <button onClick={reset} className="text-2xl font-bold tracking-tighter hover:opacity-80 transition">
            Post <span className="text-indigo-500">Viajes</span>
          </button>
          {session ? (
            <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 pr-4 rounded-full border border-slate-800">
              <img src={session.user?.image || ''} className="w-8 h-8 rounded-full border border-indigo-500" alt="" />
              <span className="text-sm text-slate-300 hidden sm:block">{session.user?.name?.split(' ')[0]}</span>
              <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition">Salir</button>
            </div>
          ) : (
            <button
              onClick={() => signIn('facebook')}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-full font-bold transition text-sm shadow-lg shadow-indigo-500/20"
            >
              Conectá para publicar
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      <main className="max-w-5xl mx-auto pt-28 pb-16 px-4 text-center">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-4 pb-2 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          De flyer a post <br /> en segundos
        </h1>
        <p className="text-slate-400 mb-10 text-lg">La IA analiza tu flyer, escribe el texto y lo publica por vos.</p>

        {/* ── PASO 1 y 2: Upload + Processing — card centrada ── */}
        {(uiStep === 'upload' || uiStep === 'processing') && (
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl max-w-2xl mx-auto mb-8 overflow-hidden">
            {uiStep === 'upload' && (
              <div key="upload" className={`space-y-5 ${animClass}`}>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-3 text-sm">{error}</div>
                )}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className={`border-2 border-dashed rounded-3xl p-14 transition-all duration-500 ${flyerPreview ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/20 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5'}`}>
                    {flyerPreview ? (
                      <img src={flyerPreview} className="max-h-52 mx-auto rounded-2xl shadow-2xl" alt="Flyer" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition">
                          <Upload className="w-8 h-8 text-indigo-500" />
                        </div>
                        <p className="font-semibold text-white">Click para cargar tu flyer</p>
                        <p className="text-sm">o arrastrá la imagen aquí</p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={processFlyer}
                  disabled={!flyerBase64}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 text-lg"
                >
                  <Bot className="w-5 h-5" />
                  Generá tu post con IA ✨
                </button>
              </div>
            )}

            {uiStep === 'processing' && (
              <div key="processing" className={`py-12 flex flex-col items-center gap-6 ${animClass}`}>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Bot className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">La IA está leyendo tu flyer…</p>
                  <p className="text-slate-400 text-sm mt-1">Detectando destino, precio y escribiendo los textos</p>
                </div>
                {flyerPreview && <img src={flyerPreview} className="max-h-32 rounded-xl opacity-40" alt="" />}
              </div>
            )}
          </div>
        )}

        {/* ── PASO 3: Elegir foto — layout 2 columnas ── */}
        {uiStep === 'images' && result && (
          <div key="images" className={`${animClass}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">

              {/* Columna izquierda: carousel de fotos */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-400 font-bold tracking-widest mb-0.5">PASO 2 DE 4</p>
                    <h3 className="text-lg font-bold">Elegí la foto 🖼️</h3>
                    <p className="text-slate-400 text-xs">Fotos de <span className="text-white font-medium">{result.destination}</span></p>
                  </div>
                  <button onClick={reset} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition">
                    <ArrowLeft className="w-3 h-3" /> Volver
                  </button>
                </div>

                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    <p className="text-sm">Buscando fotos…</p>
                  </div>
                ) : (
                  <div>
                    {/* Foto principal — formato retrato estilo Instagram */}
                    <div className="relative bg-slate-800" style={{ aspectRatio: '4/5' }}>
                      <img
                        key={carouselIndex}
                        src={images[carouselIndex]?.thumbnail}
                        alt=""
                        className="w-full h-full object-cover animate-fade-left"
                      />
                      {/* Flechas */}
                      <button
                        onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                        disabled={carouselIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 disabled:opacity-20 rounded-full p-2.5 transition backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setCarouselIndex(i => Math.min(images.length - 1, i + 1))}
                        disabled={carouselIndex === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 disabled:opacity-20 rounded-full p-2.5 transition backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      {/* Info fotógrafo */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 pt-8 p-3 flex justify-between items-end">
                        <div>
                          <p className="text-white text-xs font-medium truncate">{images[carouselIndex]?.photographer}</p>
                          <p className="text-white/50 text-[10px]">{images[carouselIndex]?.source}</p>
                        </div>
                        <span className="text-[10px] text-white/60">{carouselIndex + 1} / {images.length}</span>
                      </div>
                    </div>

                    {/* Tira de thumbnails */}
                    <div className="flex gap-1.5 overflow-x-auto p-3 bg-slate-900/80">
                      {images.map((img, i) => (
                        <button
                          key={img.id}
                          onClick={() => setCarouselIndex(i)}
                          className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === carouselIndex ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                          style={{ width: 52, height: 52 }}
                        >
                          <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      <button
                        onClick={() => handleSelectImage(images[carouselIndex])}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Elegir esta foto →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha: preview del post */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-800">
                  <p className="text-xs text-slate-400 font-bold tracking-widest mb-0.5">TU POST</p>
                  <h3 className="text-lg font-bold">
                    {result.destination}
                    {result.nights && <span className="text-slate-400 font-normal text-sm"> · {result.nights} nts</span>}
                  </h3>
                  {result.dates && <p className="text-indigo-300 text-xs mt-0.5">📅 {result.dates}</p>}
                  {result.price && <p className="text-green-400 text-sm font-bold mt-1">💵 {result.price}</p>}
                </div>
                {/* Tabs FB / IG */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab('instagram')}
                    className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'instagram' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    📸 Instagram
                  </button>
                  <button
                    onClick={() => setActiveTab('facebook')}
                    className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'facebook' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    👍 Facebook
                  </button>
                </div>
                <div className="flex-1 p-5">
                  <PostCard
                    text={activeTab === 'instagram' ? result.textInstagram : result.textFacebook}
                    color={activeTab === 'instagram' ? 'text-pink-400' : 'text-blue-400'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 4: Elegir estilo — layout 2 columnas ── */}
        {uiStep === 'style' && selectedImage && result && (
          <div key="style" className={`${animClass}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">

              {/* Columna izquierda: grilla de estilos */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-400 font-bold tracking-widest mb-0.5">PASO 3 DE 4</p>
                    <h3 className="text-lg font-bold">Elegí el estilo 🎨</h3>
                  </div>
                  <button onClick={() => goTo('images', 'right')} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition">
                    <ArrowLeft className="w-3 h-3" /> Volver
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleSelectStyle(style)}
                      className="rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-[1.02]"
                    >
                      <div className="overflow-hidden" style={{ aspectRatio: '4/5' }}>
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

              {/* Columna derecha: preview del post */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-800">
                  <p className="text-xs text-slate-400 font-bold tracking-widest mb-0.5">TU POST</p>
                  <h3 className="text-lg font-bold">
                    {result.destination}
                    {result.nights && <span className="text-slate-400 font-normal text-sm"> · {result.nights} nts</span>}
                  </h3>
                  {result.dates && <p className="text-indigo-300 text-xs mt-0.5">📅 {result.dates}</p>}
                  {result.price && <p className="text-green-400 text-sm font-bold mt-1">💵 {result.price}</p>}
                </div>
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab('instagram')}
                    className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'instagram' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    📸 Instagram
                  </button>
                  <button
                    onClick={() => setActiveTab('facebook')}
                    className={`flex-1 py-3 text-sm font-bold transition ${activeTab === 'facebook' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}
                  >
                    👍 Facebook
                  </button>
                </div>
                <div className="flex-1 p-5">
                  <PostCard
                    text={activeTab === 'instagram' ? result.textInstagram : result.textFacebook}
                    color={activeTab === 'instagram' ? 'text-pink-400' : 'text-blue-400'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 5: Preview y publicar ── */}
        {uiStep === 'preview' && result && selectedImage && (
          <div key="preview" className={`max-w-2xl mx-auto ${animClass}`}>
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl text-left">
              {published ? (
                <div className="py-10 text-center space-y-4 animate-fade-up">
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-2xl font-black text-white">¡Publicado!</h3>
                  <p className="text-slate-400">El post está live en tus redes</p>
                  <button onClick={reset} className="mt-4 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl font-bold transition">
                    Crear otro post →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs text-green-400 font-bold tracking-widest mb-1">PASO 4 DE 4</p>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle className="text-green-500 w-5 h-5" />
                        <span>{result.destination}</span>
                        {result.nights && <span className="text-slate-400 text-sm font-normal">· {result.nights} nts</span>}
                      </h3>
                      {result.dates && <p className="text-indigo-300 text-sm mt-0.5">📅 {result.dates}</p>}
                      {result.price && <p className="text-green-400 text-base font-bold mt-0.5">💵 {result.price}</p>}
                    </div>
                    <button onClick={() => goTo('style', 'right')} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition mt-1">
                      <ArrowLeft className="w-3 h-3" /> Volver
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden mb-5" style={{ aspectRatio: '4/5', maxHeight: 340 }}>
                    <img
                      src={selectedImage.thumbnail}
                      alt={result.destination}
                      className="w-full h-full object-cover"
                      style={{ filter: selectedStyle.filter }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    <PostCard title="FACEBOOK" text={result.textFacebook} color="text-blue-400" />
                    <PostCard title="INSTAGRAM" text={result.textInstagram} color="text-pink-400" />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-3 text-sm mb-4">{error}</div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={!session || publishing}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 py-5 rounded-2xl transition-all font-black text-lg shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
                  >
                    {publishing
                      ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Publicando…</>
                      : session
                        ? <><Rocket className="w-6 h-6" /> Publicalo en tus redes 🚀</>
                        : '🔒 Conectá tu cuenta para publicar'
                    }
                  </button>
                  {!session && (
                    <button
                      onClick={() => signIn('facebook')}
                      className="w-full mt-3 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 py-3 rounded-2xl text-sm font-medium transition"
                    >
                      Conectá para publicar →
                    </button>
                  )}
                  <button onClick={reset} className="w-full mt-3 text-slate-500 hover:text-white text-sm transition">
                    Empezar de nuevo
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── INDICADORES DE PASO ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8 mb-16">
          <Step active={currentStep >= 1} icon={Upload}    step="1" title="Subís tu flyer" />
          <Step active={currentStep >= 2} icon={Bot}       step="2" title="IA analiza y escribe el post" />
          <Step active={currentStep >= 3} icon={ImageIcon} step="3" title="Elegí la foto que más te guste" />
          <Step active={currentStep >= 4} icon={Palette}   step="4" title="Elegí el estilo de foto" />
          <Step active={currentStep >= 5} icon={Rocket}    step="5" title="Publicalo en tus redes" />
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 bg-[#020617]/80 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Post<span className="text-indigo-500">Viajes</span></span>
            <span>·</span>
            <span>Hecho con ♥ por <span className="text-slate-300">Emiliano Crespo</span></span>
          </div>
          <div className="flex gap-6 text-xs">
            <span>Las imágenes son provistas por Pexels y Unsplash y pertenecen a sus respectivos autores.</span>
          </div>
          <div className="flex gap-4 text-xs">
            <a href="mailto:emiliano.crespo.tw@gmail.com" className="hover:text-white transition">Contacto</a>
            <span>·</span>
            <span>© {new Date().getFullYear()} PostViajes</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

/** PostCard sin título (para el panel lateral) */
function PostCard({ title, text, color }: { title?: string; text: string; color: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text || '')
      } else {
        const el = document.createElement('textarea')
        el.value = text || ''
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* silently ignore */ }
  }
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-3xl relative group h-full">
      {title && <p className={`text-[10px] font-black tracking-widest mb-2 ${color}`}>{title}</p>}
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {text || <span className="text-slate-500 italic">Sin texto generado</span>}
      </p>
      <button
        onClick={copy}
        className="mt-3 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-xl transition font-medium"
      >
        {copied ? '✓ Copiado' : 'Copiar texto'}
      </button>
    </div>
  )
}

function Step({ active, icon: Icon, step, title }: { active: boolean; icon: any; step: string; title: string }) {
  return (
    <div className={`p-4 rounded-[2rem] border transition-all duration-700 ${active ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10' : 'border-slate-800 bg-slate-900/30'}`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${active ? 'text-green-400' : 'text-slate-600'}`} />
      <p className={`text-xs font-bold transition-colors duration-700 ${active ? 'text-green-400' : 'text-slate-600'}`}>{step}</p>
      <p className={`text-xs mt-0.5 transition-colors duration-700 leading-tight ${active ? 'text-slate-300' : 'text-slate-600'}`}>{title}</p>
    </div>
  )
}
