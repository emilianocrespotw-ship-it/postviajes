'use client'
import { useState, useRef, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  Upload, Bot, Rocket, ArrowLeft,
  ChevronLeft, ChevronRight, Copy, Check,
  Image as ImageIcon, Palette,
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

// Filtros inspirados en Instagram Stories
const STYLES = [
  { id: 'none',       label: 'Normal',     filter: '' },
  { id: 'clarendon', label: 'Clarendon',  filter: 'brightness(1.1) contrast(1.2) saturate(1.35)' },
  { id: 'juno',      label: 'Juno',       filter: 'saturate(1.4) contrast(1.1) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'lark',      label: 'Lark',       filter: 'brightness(1.18) contrast(0.9) saturate(1.1)' },
  { id: 'aden',      label: 'Aden',       filter: 'sepia(0.2) brightness(1.15) saturate(0.85) hue-rotate(20deg)' },
  { id: 'cairo',     label: 'Cairo',      filter: 'sepia(0.45) saturate(1.4) contrast(1.08) brightness(0.96) hue-rotate(8deg)' },
  { id: 'moon',      label: 'Moon',       filter: 'grayscale(1) brightness(1.1) contrast(1.1)' },
  { id: 'vivid',     label: 'Vibrante',   filter: 'saturate(1.9) brightness(1.08) contrast(1.05)' },
  { id: 'slumber',   label: 'Slumber',    filter: 'brightness(0.85) saturate(0.8) sepia(0.2) contrast(1.1)' },
  { id: 'reyes',     label: 'Reyes',      filter: 'sepia(0.3) contrast(0.9) brightness(1.1) saturate(0.75)' },
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
  const [socialAction, setSocialAction] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null)

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

  const handleSocialPublish = async (network: 'facebook' | 'instagram' | 'whatsapp') => {
    if (!selectedPhoto || !result) return
    setSocialAction(network)

    const safeD = result.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const dlUrl = `/api/download-image?url=${encodeURIComponent(selectedPhoto.url)}&name=postviajes-${safeD}.jpg`

    if (network === 'whatsapp') {
      const text = editedIG || result.textInstagram
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          // Intentar compartir con la foto real (archivo)
          const res = await fetch(dlUrl)
          const blob = await res.blob()
          const file = new File([blob], `postviajes-${safeD}.jpg`, { type: 'image/jpeg' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text })
          } else {
            // Share sin archivo pero con texto
            await navigator.share({ text })
          }
        } catch {
          // Si falla (cancelado o sin soporte), caer a wa.me
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
        }
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
      }
      setSocialAction(null)
      return
    }

    // Facebook / Instagram: download image + copy text + open network
    const textToCopy = network === 'facebook'
      ? (editedFB || result.textFacebook)
      : (editedIG || result.textInstagram)

    // Download image
    const a = document.createElement('a')
    a.href = dlUrl
    a.download = `postviajes-${safeD}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Copy text
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {})
    }

    // Open network
    setTimeout(() => {
      window.open(
        network === 'facebook' ? 'https://www.facebook.com' : 'https://www.instagram.com',
        '_blank',
        'noopener'
      )
      setSocialAction(null)
    }, 400)
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
    <div className="min-h-screen bg-[#F8FAFB] text-[#111827] font-sans">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 py-3 max-w-6xl mx-auto">
          <a href="/" className="font-black tracking-tight text-xl">
            <span style={{ color: '#E8782E' }}>Post</span><span style={{ color: '#1A4A5C' }}>Viajes</span>
          </a>
          {session ? (
            <div className="flex items-center gap-2">
              <img src={session.user?.image || ''} className="w-7 h-7 rounded-full ring-2 ring-[#1A4A5C]/30" alt="" />
              <span className="text-sm text-gray-500 hidden sm:block">{session.user?.name?.split(' ')[0]}</span>
              <button onClick={() => signOut()} className="text-xs text-gray-400 hover:text-gray-700 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('facebook')}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5"
            >
              <FbIcon className="w-3.5 h-3.5" /> Ingresá con Facebook
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-24 pb-20 px-4">

        {/* ── HERO ── */}
        {(uiStep === 'upload' || uiStep === 'processing') && (
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight text-[#111827]">
              Del flyer del operador<br />
              al post listo en{' '}
              <span style={{ color: '#E8782E' }}>30 segundos</span>
            </h1>
            <p className="text-gray-400 text-base">Subí la imagen, la IA genera el texto y la foto. Sin diseñador.</p>
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
                    <span className="opacity-0 group-hover:opacity-100 transition text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm">
                      Cambiar imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-white border-2 border-dashed border-gray-200 group-hover:border-[#1A4A5C]/40 group-hover:bg-[#2A6A82]/5 transition flex flex-col items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2A6A82]/10 group-hover:bg-[#2A6A82]/20 transition flex items-center justify-center">
                    <Upload className="w-6 h-6 text-[#1A4A5C]" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700">Cargá tu flyer</p>
                    <p className="text-sm text-gray-400 mt-1">JPG, PNG · arrastrá o hacé click</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pasos — solo cuando no hay flyer cargado todavía */}
            {!flyerPreview && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { n: '1', Icon: Upload,    label: 'Subís tu flyer' },
                  { n: '2', Icon: Bot,       label: 'IA analiza y escribe el post' },
                  { n: '3', Icon: ImageIcon, label: 'Elegí la foto que más te guste' },
                  { n: '4', Icon: Palette,   label: 'Elegí el estilo de foto' },
                  { n: '5', Icon: Rocket,    label: 'Publicalo en tus redes' },
                ].map(({ n, Icon, label }) => (
                  <div
                    key={n}
                    className={`bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm${n === '5' ? ' col-span-2 max-w-[48%] mx-auto w-full' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F4F8] flex items-center justify-center text-[#1A4A5C]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-gray-200 select-none">{n}</span>
                    <p className="text-xs font-black text-[#111827] leading-tight text-center">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={processFlyer}
              disabled={!flyerBase64}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
                disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
                bg-[#E8782E] hover:bg-[#D46B25] text-white shadow-2xl shadow-[#E8782E]/30"
            >
              <Bot className="w-5 h-5" />
              Generá tu post con IA ✨
            </button>
          </div>
        )}

        {/* ── PASO 2: Procesando ── */}
        {uiStep === 'processing' && (
          <div className={`flex flex-col items-center gap-6 py-10 ${animClass}`}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-[#1A4A5C]/20 border-t-[#E8782E] animate-spin" />
              <Bot className="w-9 h-9 text-[#1A4A5C] absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black">Leyendo tu flyer…</p>
              <p className="text-gray-400 text-sm mt-2">Detectando destino, fechas y escribiendo el post</p>
            </div>
            {flyerPreview && (
              <img src={flyerPreview} className="w-28 rounded-2xl opacity-30 blur-sm" alt="" />
            )}
            <div className="w-full">
              <StepProgress activeStep={2} />
            </div>
          </div>
        )}

        {/* ── PASO 3: Elegir foto ── */}
        {uiStep === 'images' && result && (
          <div className={`${animClass}`}>
            {/* Info del paquete */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-black text-[#1A4A5C] tracking-widest mb-1">ELEGÍ UNA FOTO</p>
                <h2 className="text-2xl font-black leading-tight">{result.destination}</h2>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {result.dates && <span className="text-gray-500 text-sm">📅 {result.dates}</span>}
                  {result.price && <span className="text-green-400 text-sm font-bold">💵 {result.price}</span>}
                </div>
              </div>
              <button onClick={reset} className="text-gray-400 hover:text-white transition flex items-center gap-1 text-xs mt-1">
                <ArrowLeft className="w-3 h-3" /> Volver
              </button>
            </div>

            {photos.length === 0 ? (
              /* Loading de fotos */
              <div className="rounded-3xl overflow-hidden bg-white flex items-center justify-center" style={{ aspectRatio: '4/5', maxHeight: '52vh' }}>
                <div className="text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-[#1A4A5C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Buscando fotos de {result.destination}…</p>
                </div>
              </div>
            ) : (
              <>
                {/* Foto principal — acotada en altura para que el botón quede visible */}
                <div
                  className="relative rounded-3xl overflow-hidden mb-3"
                  style={{ aspectRatio: '4/5', maxHeight: '52vh' }}
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
                      <p className="text-gray-400 text-xs">{currentPhoto?.source}</p>
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

            {/* Progreso de pasos */}
            <StepProgress activeStep={3} />

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-black text-[#1A4A5C] tracking-widest mb-1">ELEGÍ UN ESTILO</p>
                <h2 className="text-2xl font-black">{result.destination}</h2>
              </div>
              <button onClick={() => goTo('images', 'right')} className="text-gray-400 hover:text-[#1A4A5C] transition flex items-center gap-1 text-xs">
                <ArrowLeft className="w-3 h-3" /> Volver
              </button>
            </div>

            {/* Foto con filtro aplicado — acotada en altura para que todo quepa */}
            <div className="rounded-3xl overflow-hidden" style={{ aspectRatio: '4/5', maxHeight: '50vh' }}>
              <img
                src={selectedPhoto.thumbnail}
                alt={result.destination}
                className="w-full h-full object-cover transition-all duration-400"
                style={{ filter: selectedStyle.filter }}
              />
            </div>

            {/* Strip de filtros estilo Instagram Stories */}
            <div className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 py-3 px-1" style={{ width: 'max-content' }}>
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  >
                    {/* Círculo con preview del filtro — ring via box-shadow para evitar clipping */}
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden transition-all duration-200"
                      style={{
                        boxShadow: selectedStyle.id === style.id
                          ? '0 0 0 3px #F8FAFB, 0 0 0 5px #1A4A5C'
                          : '0 0 0 2px #e5e7eb',
                        transform: selectedStyle.id === style.id ? 'scale(1.12)' : 'scale(1)',
                      }}
                    >
                      <img
                        src={selectedPhoto.thumbnail}
                        alt={style.label}
                        className="w-full h-full object-cover"
                        style={{ filter: style.filter }}
                      />
                    </div>
                    {/* Label */}
                    <span className={`text-[10px] font-bold transition-colors ${
                      selectedStyle.id === style.id ? 'text-[#1A4A5C]' : 'text-gray-400'
                    }`}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setCurrentStep(5); goTo('preview', 'left') }}
              className="mt-4 w-full py-4 rounded-2xl font-black text-lg bg-[#1A4A5C] text-white hover:bg-[#2A6A82] transition flex items-center justify-center gap-2 shadow-lg"
            >
              Usar este estilo →
            </button>

            {/* Progreso de pasos */}
            <StepProgress activeStep={4} />

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
                  <p className="text-gray-500">en <span className="text-gray-700 font-medium">{publishResult.pageName}</span></p>
                )}
                <button onClick={reset} className="mt-6 bg-[#1A4A5C] hover:bg-[#2A6A82] px-8 py-3 rounded-2xl font-bold transition">
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
                      {result.dates && <span className="text-gray-500 text-sm">📅 {result.dates}</span>}
                      {result.price && <span className="text-green-400 text-sm font-bold">💵 {result.price}</span>}
                    </div>
                  </div>
                  <button onClick={() => goTo('style', 'right')} className="text-gray-400 hover:text-white transition flex items-center gap-1 text-xs mt-1">
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
                />

                {/* ── Botones de publicación social ── */}
                <div className="mt-4 flex flex-col gap-3">
                  {/* Facebook */}
                  <button
                    onClick={() => handleSocialPublish('facebook')}
                    disabled={socialAction !== null}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3
                      disabled:opacity-60 bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-lg shadow-blue-500/20"
                  >
                    {socialAction === 'facebook'
                      ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white" /> Preparando…</>
                      : <><FbIcon className="w-5 h-5" /> Publicá en Facebook</>
                    }
                  </button>

                  {/* Instagram */}
                  <button
                    onClick={() => handleSocialPublish('instagram')}
                    disabled={socialAction !== null}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3
                      disabled:opacity-60 text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                  >
                    {socialAction === 'instagram'
                      ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white" /> Preparando…</>
                      : <><IgIcon className="w-5 h-5" /> Publicá en Instagram</>
                    }
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => handleSocialPublish('whatsapp')}
                    disabled={socialAction !== null}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3
                      disabled:opacity-60 bg-[#25D366] hover:bg-[#20BD5C] text-white shadow-lg shadow-green-500/20"
                  >
                    {socialAction === 'whatsapp'
                      ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white" /> Compartiendo…</>
                      : <><WaIcon className="w-5 h-5" /> Compartí por WhatsApp</>
                    }
                  </button>

                  <p className="text-[10px] text-gray-400 text-center">
                    Facebook e Instagram: se descarga la foto y se copia el texto automáticamente
                  </p>
                </div>

                <button onClick={reset} className="mt-2 w-full text-gray-400 hover:text-gray-600 text-sm transition">
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
                  currentStep >= step ? 'bg-[#2A6A82] text-white' : 'bg-gray-50 text-gray-300'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${currentStep >= step ? 'text-gray-500' : 'text-gray-300'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-6 px-6 text-center">
        <p className="text-gray-300 text-xs">
          PostViajes · Hecho por <span className="text-gray-400">Emiliano Crespo</span>
          {' · '}Fotos por Pexels y Unsplash
          {' · '}© {new Date().getFullYear()}
        </p>
      </footer>
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
    <div className="rounded-3xl overflow-hidden bg-white border border-gray-200">

      {/* ── Tabs ── */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
            isIG
              ? 'border-pink-500 text-[#111827] bg-gradient-to-b from-pink-500/10 to-transparent'
              : 'border-transparent text-gray-400 hover:text-gray-500'
          }`}
        >
          <IgIcon className={`w-4 h-4 ${isIG ? 'text-pink-400' : ''}`} />
          Instagram
        </button>
        <button
          onClick={() => setActiveTab('facebook')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2 ${
            !isIG
              ? 'border-blue-500 text-[#111827] bg-blue-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-500'
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
            className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-white/20 transition placeholder-white/20"
            placeholder="Sin texto generado"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[6rem]">
            {text || <span className="text-gray-300 italic">Sin texto generado</span>}
          </p>
        )}

        {/* ── Acciones ── */}
        <div className="flex gap-2 mt-3">
          {/* Copiar */}
          <button
            onClick={() => copy(text)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-gray-50 hover:bg-white/10 transition flex-1 justify-center"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copiado</span></>
              : <><Copy className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500">Copiar</span></>
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

// ─── StepProgress ─────────────────────────────────────────────────────────────
// activeStep: 1=upload 2=procesando 3=images 4=style 5=preview
function StepProgress({ activeStep }: { activeStep: number }) {
  const STEP_DEFS = [
    { n: 1, Icon: Upload,    label: 'Subís tu flyer' },
    { n: 2, Icon: Bot,       label: 'IA analiza y escribe el post' },
    { n: 3, Icon: ImageIcon, label: 'Elegí la foto que más te guste' },
    { n: 4, Icon: Palette,   label: 'Elegí el estilo de foto' },
    { n: 5, Icon: Rocket,    label: 'Publicalo en tus redes' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      {STEP_DEFS.map(({ n, Icon, label }) => {
        const done    = n < activeStep
        const current = n === activeStep
        return (
          <div
            key={n}
            className={`border rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm transition-all duration-300
              ${n === 5 ? 'col-span-2 max-w-[48%] mx-auto w-full' : ''}
              ${done    ? 'bg-green-50 border-green-200'      : ''}
              ${current ? 'bg-white border-[#1A4A5C]/20'      : ''}
              ${!done && !current ? 'bg-white border-gray-100 opacity-50' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all
              ${done    ? 'bg-green-100 text-green-600'   : ''}
              ${current ? 'bg-[#E8F4F8] text-[#1A4A5C]'  : ''}
              ${!done && !current ? 'bg-gray-50 text-gray-300' : ''}`}
            >
              {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-black select-none
              ${done ? 'text-green-400' : 'text-gray-200'}`}>{n}</span>
            <p className={`text-xs font-black leading-tight text-center
              ${done    ? 'text-green-700'  : ''}
              ${current ? 'text-[#111827]'  : ''}
              ${!done && !current ? 'text-gray-300' : ''}`}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}
