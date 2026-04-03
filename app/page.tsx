'use client'
import { useState, useRef, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Upload, Bot, Rocket, ArrowLeft,
  ChevronLeft, ChevronRight, Copy, Check, Download,
} from 'lucide-react'

// ─── Brand icons ──────────────────────────────────────────────────────────────
function IgIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}
function FbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}
function WaIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

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

// Filtros inspirados en los más usados de Instagram
const STYLES = [
  { id: 'none',       label: 'Original',   emoji: '✨', filter: '' },
  { id: 'clarendon', label: 'Clarendon',  emoji: '💎', filter: 'brightness(1.1) contrast(1.2) saturate(1.35)' },
  { id: 'aden',      label: 'Aden',       emoji: '🌅', filter: 'sepia(0.2) brightness(1.15) saturate(0.85) hue-rotate(20deg)' },
  { id: 'cairo',     label: 'El Cairo',   emoji: '🏛️', filter: 'sepia(0.45) saturate(1.4) contrast(1.08) brightness(0.96) hue-rotate(8deg)' },
  { id: 'vivid',     label: 'Vibrante',   emoji: '🎨', filter: 'saturate(1.9) brightness(1.08) contrast(1.05)' },
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

// ─── Hook: swipe táctil ───────────────────────────────────────────────────────
function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }, [])
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    if (delta < -45) onLeft()
    else if (delta > 45) onRight()
    startX.current = null
  }, [onLeft, onRight])
  return { onTouchStart, onTouchEnd }
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
  const [editedFB, setEditedFB] = useState('')
  const [editedIG, setEditedIG] = useState('')
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
      setEditedFB(normalized.textFacebook)
      setEditedIG(normalized.textInstagram)
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
          textFacebook: editedFB || result.textFacebook,
          textInstagram: editedIG || result.textInstagram,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPublished(true)
        setPublishResult({ pageName: data.pageName })
      } else {
        const code = data.code || null
        setError(data.error || data.errors?.join(', ') || 'Error al publicar')
        setErrorCode(code)
        // Sin página: auto-descargar imagen y auto-copiar texto para facilitar publicación manual
        if (code === 'NO_PAGES' && selectedPhoto && result) {
          const safeD = result.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()
          const dlUrl = `/api/download-image?url=${encodeURIComponent(selectedPhoto.url)}&name=postviajes-${safeD}.jpg`
          const a = document.createElement('a')
          a.href = dlUrl
          a.download = `postviajes-${safeD}.jpg`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(editedFB || result.textFacebook).catch(() => {})
          }
        }
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
    setEditedFB('')
    setEditedIG('')
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

  // Swipe para navegar entre fotos
  const { onTouchStart: swipeTouchStart, onTouchEnd: swipeTouchEnd } = useSwipe(
    useCallback(() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length]),
    useCallback(() => setPhotoIdx(i => Math.max(0, i - 1)), []),
  )

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
            <p className="text-white/40 text-base">La IA lee tu flyer y escribe el post listo para publicar.</p>

            {/* Pasos explicativos */}
            <div className="grid grid-cols-4 gap-2 mt-7 text-left">
              {[
                { n: '1', icon: '📎', label: 'Subí el flyer', desc: 'Tu promoción de viaje' },
                { n: '2', icon: '🤖', label: 'La IA lo lee', desc: 'Destino, fechas y precio' },
                { n: '3', icon: '🖼️', label: 'Elegí la foto', desc: 'Del destino exacto' },
                { n: '4', icon: '🚀', label: 'Publicá', desc: 'Facebook o Instagram' },
              ].map(({ n, icon, label, desc }) => (
                <div key={n} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 flex flex-col gap-1">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-xs font-black text-white/90 leading-tight">{label}</p>
                  <p className="text-[10px] text-white/35 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
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
                <div
                  className="relative rounded-3xl overflow-hidden mb-3"
                  style={{ aspectRatio: '3/4' }}
                  onTouchStart={swipeTouchStart}
                  onTouchEnd={swipeTouchEnd}
                >
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
                      <p className="text-white/40 text-xs">{currentPhoto?.source}</p>
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
                  textFacebook={editedFB}
                  textInstagram={editedIG}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onChangeFacebook={setEditedFB}
                  onChangeInstagram={setEditedIG}
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
                  textFacebook={editedFB}
                  textInstagram={editedIG}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onChangeFacebook={setEditedFB}
                  onChangeInstagram={setEditedIG}
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
                  textFacebook={editedFB}
                  textInstagram={editedIG}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onChangeFacebook={setEditedFB}
                  onChangeInstagram={setEditedIG}
                  imageUrl={selectedPhoto.url}
                />

                {/* ── Acciones de descarga / compartir ── */}
                <DownloadShareBar
                  imageUrl={selectedPhoto.url}
                  destination={result.destination}
                  textInstagram={editedIG}
                  textFacebook={editedFB}
                />

                {/* ── Error al publicar ── */}
                {error && errorCode !== 'NO_PAGES' && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm">
                    <p className="font-bold mb-1">❌ Error al publicar</p>
                    <p className="text-red-400/80">{error}</p>
                  </div>
                )}

                {/* Sin páginas de Facebook → flujo ágil */}
                {errorCode === 'NO_PAGES' && (
                  <div className="mt-2 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm">
                    <p className="font-black text-green-400 mb-1">✅ Foto descargada · Texto copiado</p>
                    <p className="text-white/50 text-xs leading-relaxed mb-3">
                      La publicación directa requiere una <strong className="text-white/70">Página de Facebook</strong>.
                      Ya tenés la foto y el texto listos — solo pegá en tu red social favorita.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="https://www.facebook.com"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition"
                      >
                        <FbIcon className="w-3.5 h-3.5" /> Ir a Facebook →
                      </a>
                      <a
                        href="https://www.instagram.com"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-pink-600/15 border border-pink-500/25 text-pink-300 hover:bg-pink-600/25 transition"
                      >
                        <IgIcon className="w-3.5 h-3.5" /> Ir a Instagram →
                      </a>
                    </div>
                    <button onClick={() => signIn('facebook')} className="mt-3 w-full text-xs text-indigo-400 hover:text-indigo-300 transition">
                      Tengo una Página de Facebook → reconectá →
                    </button>
                  </div>
                )}

                {/* ── Botón publicar automático (solo para usuarios con Páginas) ── */}
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
                      ? <><Rocket className="w-5 h-5" /> Publicar automáticamente 🚀</>
                      : '🔒 Conectá Facebook para publicar'
                  }
                </button>
                {!session && (
                  <button onClick={() => signIn('facebook')} className="mt-3 w-full py-3 rounded-2xl text-sm font-bold border border-white/10 hover:bg-white/5 transition">
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

// ─── DownloadShareBar ────────────────────────────────────────────────────────
function DownloadShareBar({
  imageUrl, destination, textInstagram, textFacebook,
}: {
  imageUrl: string
  destination: string
  textInstagram: string
  textFacebook: string
}) {
  const [igToast, setIgToast] = useState(false)
  const safeDestination = destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const downloadUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&name=postviajes-${safeDestination}.jpg`

  const handleInstagram = async () => {
    // 1. Disparar descarga de imagen
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `postviajes-${safeDestination}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // 2. Copiar texto de Instagram al portapapeles
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(textInstagram || textFacebook).catch(() => {})
    }
    // 3. Toast + abrir Instagram después de 1.5s
    setIgToast(true)
    setTimeout(() => {
      setIgToast(false)
      window.open('https://www.instagram.com', '_blank', 'noopener')
    }, 1500)
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* Descargar foto */}
      <a
        href={downloadUrl}
        download
        className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm
          bg-white/[0.06] border border-white/10 hover:bg-white/10 transition text-white/80"
      >
        <Download className="w-4 h-4 text-white/50" />
        Descargar foto
      </a>

      {/* Subir a Instagram: descarga + copia texto + abre IG */}
      <button
        onClick={handleInstagram}
        className="relative flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm
          bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-pink-500/20
          hover:from-purple-500/25 hover:to-pink-500/25 transition text-pink-300"
      >
        {igToast ? (
          <span className="text-green-400 text-xs font-black">✅ Foto descargada · Texto copiado</span>
        ) : (
          <><IgIcon className="w-4 h-4" /> Subir a Instagram</>
        )}
      </button>

      {/* Nota aclaratoria Instagram */}
      {igToast && (
        <p className="col-span-2 text-center text-[11px] text-white/35 -mt-1">
          Abriendo Instagram… pegá el texto al crear tu post
        </p>
      )}
    </div>
  )
}

// ─── PostTextCard ─────────────────────────────────────────────────────────────
function PostTextCard({
  textFacebook,
  textInstagram,
  activeTab,
  setActiveTab,
  onChangeFacebook,
  onChangeInstagram,
  imageUrl,
}: {
  textFacebook: string
  textInstagram: string
  activeTab: 'instagram' | 'facebook'
  setActiveTab: (t: 'instagram' | 'facebook') => void
  onChangeFacebook?: (v: string) => void
  onChangeInstagram?: (v: string) => void
  imageUrl?: string
}) {
  const { copied, copy } = useCopy()
  const isIG = activeTab === 'instagram'
  const text = isIG ? textInstagram : textFacebook
  const onChange = isIG ? onChangeInstagram : onChangeFacebook

  const shareWhatsApp = async () => {
    if (!text) return
    // Intentamos Web Share API (funciona en móvil con imagen)
    if (imageUrl && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const res = await fetch(`/api/download-image?url=${encodeURIComponent(imageUrl)}&name=postviajes.jpg`)
        const blob = await res.blob()
        const file = new File([blob], 'postviajes.jpg', { type: 'image/jpeg' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text })
          return
        }
        // Share sin imagen pero con texto
        await navigator.share({ text })
        return
      } catch { /* fallback abajo */ }
    }
    // Fallback: wa.me con solo texto
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">

      {/* ── Tabs ── */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
            isIG
              ? 'border-pink-500 text-white bg-gradient-to-b from-pink-500/10 to-transparent'
              : 'border-transparent text-white/30 hover:text-white/60'
          }`}
        >
          <IgIcon className={`w-4 h-4 ${isIG ? 'text-pink-400' : ''}`} />
          Instagram
        </button>
        <button
          onClick={() => setActiveTab('facebook')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
            !isIG
              ? 'border-blue-500 text-white bg-blue-500/5'
              : 'border-transparent text-white/30 hover:text-white/60'
          }`}
        >
          <FbIcon className={`w-4 h-4 ${!isIG ? 'text-blue-400' : ''}`} />
          Facebook
        </button>
      </div>

      {/* ── Textarea editable ── */}
      <div className="p-4">
        {onChange ? (
          <textarea
            value={text}
            onChange={e => onChange(e.target.value)}
            rows={8}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-sm text-white/85 leading-relaxed resize-none focus:outline-none focus:border-white/20 transition placeholder-white/20"
            placeholder="Sin texto generado"
          />
        ) : (
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap min-h-[6rem]">
            {text || <span className="text-white/20 italic">Sin texto generado</span>}
          </p>
        )}

        {/* ── Acciones ── */}
        <div className="flex gap-2 mt-3">
          {/* Copiar */}
          <button
            onClick={() => copy(text)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition flex-1 justify-center"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copiado</span></>
              : <><Copy className="w-3.5 h-3.5 text-white/50" /><span className="text-white/60">Copiar</span></>
            }
          </button>

          {/* WhatsApp */}
          <button
            onClick={shareWhatsApp}
            disabled={!text}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition disabled:opacity-30 flex-1 justify-center border border-[#25D366]/20"
          >
            <WaIcon className="w-3.5 h-3.5" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
