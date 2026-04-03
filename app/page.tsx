'use client'
import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Upload, Bot, Rocket, CheckCircle, ArrowLeft,
  ChevronLeft, ChevronRight, Copy, Check, RefreshCw,
} from 'lucide-react'

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
  { id: 'warm',     label: 'Cálido',    emoji: '🌅', filter: 'sepia(0.35) saturate(1.4) brightness(1.05)' },
  { id: 'cool',     label: 'Fresco',    emoji: '🌊', filter: 'hue-rotate(170deg) saturate(0.85) brightness(1.05)' },
  { id: 'dramatic', label: 'Dramático', emoji: '🌙', filter: 'brightness(0.75) contrast(1.35) saturate(0.9)' },
  { id: 'vivid',    label: 'Vibrante',  emoji: '🎨', filter: 'saturate(1.9) brightness(1.08) contrast(1.05)' },
]

function toStr(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

// ─── Hook: clipboard ─────────────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement('textarea')
        el.value = text
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return { copied, copy }
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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [photoIdx, setPhotoIdx] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0])
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook'>('instagram')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishResult, setPublishResult] = useState<{ pageName?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const goTo = (step: typeof uiStep, dir: typeof animDir = 'left') => {
    setAnimDir(dir)
    setUiStep(step)
  }

  const animClass =
    animDir === 'left'  ? 'animate-fade-left'  :
    animDir === 'right' ? 'animate-fade-right' :
    'animate-fade-up'

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
      setPhotoIdx(0)

      const params = new URLSearchParams({ q: normalized.searchQuery, destination: normalized.destination })
      fetch(`/api/suggest-images?${params}`)
        .then(r => r.json())
        .then(d => setPhotos(Array.isArray(d.images) ? d.images : []))
        .catch(() => {})

      goTo('images', 'left')
    } catch (err: any) {
      setError(err.message || 'Error procesando el flyer')
      goTo('upload', 'right')
      setCurrentStep(1)
    }
  }

  const handlePublish = async () => {
    if (!selectedPhoto || !result) return
    setPublishing(true)
    setError(null)
    setErrorCode(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedPhoto.url,
          textFacebook: result.textFacebook,
          textInstagram: result.textInstagram,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPublished(true)
        setPublishResult({ pageName: data.pageName })
      } else {
        setError(data.error || data.errors?.join(', ') || 'Error al publicar')
        setErrorCode(data.code || null)
      }
    } catch {
      setError('Error de red al publicar')
    } finally {
      setPublishing(false)
    }
  }

  const reset = () => {
    setUiStep('upload')
    setAnimDir('right')
    setCurrentStep(0)
    setFlyerPreview(null)
    setFlyerBase64(null)
    setResult(null)
    setPhotos([])
    setPhotoIdx(0)
    setSelectedPhoto(null)
    setSelectedStyle(STYLES[0])
    setPublished(false)
    setPublishResult(null)
    setError(null)
    setErrorCode(null)
  }

  const currentPhoto = photos[photoIdx]

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#06080f] text-white font-sans">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#06080f]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
          <button onClick={reset} className="flex items-center gap-2 group">
            <span className="text-xl font-black tracking-tight group-hover:opacity-80 transition">
              Post<span className="text-indigo-400">Viajes</span>
            </span>
          </button>
          {session ? (
            <div className="flex items-center gap-3">
              <img src={session.user?.image || ''} className="w-8 h-8 rounded-full ring-2 ring-indigo-500/50" alt="" />
              <span className="text-sm text-white/60 hidden sm:block">{session.user?.name?.split(' ')[0]}</span>
              <button onClick={() => signOut()} className="text-xs text-white/30 hover:text-white/70 transition px-2 py-1 rounded-lg hover:bg-white/5">
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('facebook')}
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-bold transition text-sm"
            >
              Conectar Facebook
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-24 pb-20 px-4">

        {/* ── HERO ── */}
        {(uiStep === 'upload' || uiStep === 'processing') && (
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-3 leading-none">
              Flyer a post<br />
              <span className="text-indigo-400">en segundos</span>
            </h1>
            <p className="text-white/40 text-base">La IA lee tu flyer y escribe el post por vos.</p>
          </div>
        )}

        {/* ── PASO 1: Upload ── */}
        {uiStep === 'upload' && (
          <div className={`${animClass}`}>
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}
            <div
              className="relative cursor-pointer group rounded-3xl overflow-hidden mb-4"
              onClick={() => document.getElementById('file-input')?.click()}
              style={{ aspectRatio: flyerPreview ? '3/4' : '3/2' }}
            >
              <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {flyerPreview ? (
                <>
                  <img src={flyerPreview} className="w-full h-full object-cover" alt="Flyer" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                      Cambiar imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-white/[0.03] border-2 border-dashed border-white/10 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/5 transition flex flex-col items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 transition flex items-center justify-center">
                    <Upload className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white/80">Cargá tu flyer</p>
                    <p className="text-sm text-white/30 mt-1">JPG, PNG · arrastrá o hacé click</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={processFlyer}
              disabled={!flyerBase64}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed
                bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-500/20"
            >
              <Bot className="w-5 h-5" />
              Generá tu post con IA ✨
            </button>
          </div>
        )}

        {/* ── PASO 2: Procesando ── */}
        {uiStep === 'processing' && (
          <div className={`flex flex-col items-center gap-6 py-16 ${animClass}`}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Bot className="w-9 h-9 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black">Leyendo tu flyer…</p>
              <p className="text-white/40 text-sm mt-2">Detectando destino, fechas y escribiendo el post</p>
            </div>
            {flyerPreview && (
              <img src={flyerPreview} className="w-32 rounded-2xl opacity-30 blur-sm" alt="" />
            )}
          </div>
        )}

        {/* ── PASO 3: Elegir foto ── */}
        {uiStep === 'images' && result && (
          <div className={`${animClass}`}>
            {/* Info del paquete */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-black text-indigo-400 tracking-widest mb-1">ELEGÍ UNA FOTO</p>
                <h2 className="text-2xl font-black leading-tight">{result.destination}</h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {result.dates && <span className="text-white/50 text-sm">📅 {result.dates}</span>}
                  {result.price && <span className="text-green-400 text-sm font-bold">💵 {result.price}</span>}
                </div>
              </div>
              <button onClick={reset} className="text-white/30 hover:text-white transition flex items-center gap-1 text-xs mt-1">
                <ArrowLeft className="w-3 h-3" /> Volver
              </button>
            </div>

            {photos.length === 0 ? (
              /* Loading de fotos */
              <div className="rounded-3xl overflow-hidden bg-white/[0.03] flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <div className="text-center text-white/30">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Buscando fotos de {result.destination}…</p>
                </div>
              </div>
            ) : (
              <>
                {/* Foto principal — ocupa todo el ancho */}
                <div className="relative rounded-3xl overflow-hidden mb-3" style={{ aspectRatio: '3/4' }}>
                  <img
                    key={photoIdx}
                    src={currentPhoto?.thumbnail}
                    alt={result.destination}
                    className="w-full h-full object-cover animate-fade-left"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Flechas */}
                  <button
                    onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                    disabled={photoIdx === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-0 transition backdrop-blur-md flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                    disabled={photoIdx === photos.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-0 transition backdrop-blur-md flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>

                  {/* Contador + fuente */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{currentPhoto?.photographer}</p>
                      <p className="text-white/50 text-xs">{currentPhoto?.source}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`rounded-full transition-all ${i === photoIdx ? 'bg-white w-5 h-1.5' : 'bg-white/30 w-1.5 h-1.5'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botón elegir */}
                <button
                  onClick={() => { setSelectedPhoto(currentPhoto); setCurrentStep(4); goTo('style', 'left') }}
                  className="w-full py-4 rounded-2xl font-black text-lg bg-white text-black hover:bg-white/90 transition flex items-center justify-center gap-2 shadow-xl"
                >
                  Elegir esta foto →
                </button>
              </>
            )}

            {/* Preview del texto (expandible) */}
            {result.textInstagram && (
              <div className="mt-4">
                <PostTextCard
                  textFacebook={result.textFacebook}
                  textInstagram={result.textInstagram}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PASO 4: Elegir estilo ── */}
        {uiStep === 'style' && selectedPhoto && result && (
          <div className={`${animClass}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-black text-indigo-400 tracking-widest mb-1">ELEGÍ UN ESTILO</p>
                <h2 className="text-2xl font-black">{result.destination}</h2>
              </div>
              <button onClick={() => goTo('images', 'right')} className="text-white/30 hover:text-white transition flex items-center gap-1 text-xs">
                <ArrowLeft className="w-3 h-3" /> Volver
              </button>
            </div>

            {/* Foto actual con estilo aplicado — full width */}
            <div className="relative rounded-3xl overflow-hidden mb-4" style={{ aspectRatio: '3/4' }}>
              <img
                src={selectedPhoto.thumbnail}
                alt={result.destination}
                className="w-full h-full object-cover transition-all duration-500"
                style={{ filter: selectedStyle.filter }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-md
                      ${selectedStyle.id === style.id
                        ? 'bg-white text-black shadow-lg scale-105'
                        : 'bg-black/40 text-white/70 hover:bg-black/60 border border-white/10'
                      }`}
                  >
                    {style.emoji}<br />{style.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setCurrentStep(5); goTo('preview', 'left') }}
              className="w-full py-4 rounded-2xl font-black text-lg bg-white text-black hover:bg-white/90 transition flex items-center justify-center gap-2 shadow-xl"
            >
              Usar este estilo →
            </button>

            {result.textInstagram && (
              <div className="mt-4">
                <PostTextCard
                  textFacebook={result.textFacebook}
                  textInstagram={result.textInstagram}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PASO 5: Preview y publicar ── */}
        {uiStep === 'preview' && result && selectedPhoto && (
          <div className={`${animClass}`}>
            {published ? (
              <div className="text-center py-16 space-y-4 animate-fade-up">
                <div className="text-7xl">🎉</div>
                <h2 className="text-3xl font-black">¡Publicado!</h2>
                {publishResult?.pageName && (
                  <p className="text-white/50">en <span className="text-white font-medium">{publishResult.pageName}</span></p>
                )}
                <button onClick={reset} className="mt-6 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl font-bold transition">
                  Crear otro post →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-black text-green-400 tracking-widest mb-1">LISTO PARA PUBLICAR</p>
                    <h2 className="text-2xl font-black">{result.destination}</h2>
                    <div className="flex flex-wrap gap-x-3 mt-1">
                      {result.dates && <span className="text-white/50 text-sm">📅 {result.dates}</span>}
                      {result.price && <span className="text-green-400 text-sm font-bold">💵 {result.price}</span>}
                    </div>
                  </div>
                  <button onClick={() => goTo('style', 'right')} className="text-white/30 hover:text-white transition flex items-center gap-1 text-xs mt-1">
                    <ArrowLeft className="w-3 h-3" /> Volver
                  </button>
                </div>

                {/* Foto con filtro — full width */}
                <div className="rounded-3xl overflow-hidden mb-4" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={selectedPhoto.thumbnail}
                    alt={result.destination}
                    className="w-full h-full object-cover"
                    style={{ filter: selectedStyle.filter }}
                  />
                </div>

                {/* Texto del post */}
                <PostTextCard
                  textFacebook={result.textFacebook}
                  textInstagram={result.textInstagram}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />

                {/* Error */}
                {error && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm">
                    <p className="font-bold mb-1">
                      {errorCode === 'NO_PAGES' ? '📄 No encontramos páginas de Facebook' : '❌ Error al publicar'}
                    </p>
                    <p className="text-red-400/80">{error}</p>
                    {errorCode === 'NO_PAGES' && (
                      <p className="mt-2 text-red-400/60 text-xs">
                        Necesitás ser administrador de una Página de Facebook (no es tu perfil personal).
                        {' '}
                        <button onClick={() => signIn('facebook')} className="underline hover:text-red-300">
                          Reconectá tu cuenta →
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* Botón publicar */}
                <button
                  onClick={handlePublish}
                  disabled={!session || publishing}
                  className="mt-4 w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                    disabled:bg-white/5 disabled:text-white/20
                    bg-green-500 hover:bg-green-400 text-black shadow-2xl shadow-green-500/20"
                >
                  {publishing
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-black/40 border-t-black" /> Publicando…</>
                    : session
                      ? <><Rocket className="w-5 h-5" /> Publicar en redes 🚀</>
                      : '🔒 Conectá Facebook para publicar'
                  }
                </button>
                {!session && (
                  <button
                    onClick={() => signIn('facebook')}
                    className="mt-3 w-full py-3 rounded-2xl text-sm font-bold border border-white/10 hover:bg-white/5 transition"
                  >
                    Conectar Facebook →
                  </button>
                )}
                <button onClick={reset} className="mt-3 w-full text-white/25 hover:text-white/60 text-sm transition">
                  Empezar de nuevo
                </button>
              </>
            )}
          </div>
        )}

        {/* ── STEPS ── */}
        {uiStep !== 'processing' && (
          <div className="flex justify-center gap-2 mt-10">
            {[
              { step: 1, label: 'Flyer' },
              { step: 2, label: 'Foto' },
              { step: 3, label: 'Estilo' },
              { step: 4, label: 'Publicar' },
            ].map(({ step, label }) => (
              <div key={step} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  currentStep >= step ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${currentStep >= step ? 'text-white/60' : 'text-white/20'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-6 px-6 text-center">
        <p className="text-white/20 text-xs">
          PostViajes · Hecho por <span className="text-white/40">Emiliano Crespo</span>
          {' · '}Fotos por Pexels y Unsplash
          {' · '}© {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}

// ─── PostTextCard ─────────────────────────────────────────────────────────────
function PostTextCard({
  textFacebook, textInstagram, activeTab, setActiveTab,
}: {
  textFacebook: string
  textInstagram: string
  activeTab: 'instagram' | 'facebook'
  setActiveTab: (t: 'instagram' | 'facebook') => void
}) {
  const { copied, copy } = useCopy()
  const text = activeTab === 'instagram' ? textInstagram : textFacebook

  return (
    <div className="rounded-3xl overflow-hidden bg-white/[0.04] border border-white/8">
      {/* Tabs */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex-1 py-3 text-sm font-bold transition ${
            activeTab === 'instagram'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border-b-2 border-pink-400'
              : 'text-white/30 hover:text-white/60 border-b border-white/5'
          }`}
        >
          📸 Instagram
        </button>
        <button
          onClick={() => setActiveTab('facebook')}
          className={`flex-1 py-3 text-sm font-bold transition ${
            activeTab === 'facebook'
              ? 'bg-blue-500/10 text-blue-300 border-b-2 border-blue-400'
              : 'text-white/30 hover:text-white/60 border-b border-white/5'
          }`}
        >
          👍 Facebook
        </button>
      </div>
      {/* Texto */}
      <div className="p-5 relative">
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
          {text || <span className="text-white/20 italic">Sin texto generado</span>}
        </p>
        <button
          onClick={() => copy(text)}
          className="mt-4 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> <span className="text-green-400">Copiado</span></> : <><Copy className="w-3.5 h-3.5" /> Copiar texto</>}
        </button>
      </div>
    </div>
  )
}
