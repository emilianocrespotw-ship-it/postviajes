'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
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

// ─── Modal upgrade ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h2 className="text-xl font-black text-[#111827] mb-2">Llegaste al límite</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Usaste los 5 posts gratuitos. Pasá al Plan Pro para posts ilimitados y aprovechá el precio de lanzamiento.
        </p>
        <Link
          href="/pricing"
          className="block w-full py-3.5 rounded-2xl font-black text-white bg-[#E8782E] hover:bg-[#d06820] transition mb-3"
        >
          Ver Plan Pro · USD 19/mes →
        </Link>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-gray-600 text-sm transition"
        >
          Volver
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const { data: session } = useSession()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('pv_email')
    if (saved) {
      setUserEmail(saved)
    } else {
      const guestId = 'invitado_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('pv_email', guestId)
      setUserEmail(guestId)
    }
  }, [])

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
  const [socialAction, setSocialAction] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null)

  const goTo = (step: typeof uiStep, dir: typeof animDir = 'left') => {
    setAnimDir(dir)
    setUiStep(step)
  }

  const animClass =
    animDir === 'left'  ? 'animate-fade-left'  :
    animDir === 'right' ? 'animate-fade-right' :
    'animate-fade-up'

  // ─── Funciones de Carga mejoradas ──────────────────────────────────────────
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
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
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImageFile(file)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0]
    if (item?.type.includes('image')) {
      const file = item.getAsFile()
      if (file) processImageFile(file)
    }
  }, [processImageFile])

  const processFlyer = async () => {
    if (!flyerBase64) return
    goTo('processing', 'left')
    setCurrentStep(2)
    setError(null)
    try {
      const res = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: flyerBase64, mimeType: flyerMime, email: userEmail }),
      })
      const data = await res.json()
      if (data.code === 'LIMIT_REACHED') {
        setShowUpgrade(true)
        goTo('upload', 'right')
        setCurrentStep(0)
        return
      }
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

  const handleSocialPublish = async (network: 'facebook' | 'instagram' | 'whatsapp') => {
    if (!selectedPhoto || !result) return
    setSocialAction(network)
    const safeD = result.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const dlUrl = `/api/download-image?url=${encodeURIComponent(selectedPhoto.url)}&name=postviajes-${safeD}.jpg`

    const textToCopy = network === 'facebook'
      ? (editedFB || result.textFacebook)
      : (editedIG || result.textInstagram)

    // Download
    const a = document.createElement('a')
    a.href = dlUrl
    a.download = `postviajes-${safeD}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Copy
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy).catch(() => {})
    }

    // Open
    setTimeout(() => {
      const urls = {
        facebook: 'https://www.facebook.com',
        instagram: 'https://www.instagram.com',
        whatsapp: 'https://wa.me/'
      }
      window.open(urls[network], '_blank', 'noopener')
      setSocialAction(null)
    }, 500)
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
  }

  const currentPhoto = photos[photoIdx]
  const { onTouchStart: swipeTouchStart, onTouchEnd: swipeTouchEnd } = useSwipe(
    useCallback(() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length]),
    useCallback(() => setPhotoIdx(i => Math.max(0, i - 1)), []),
  )

  return (
    <div onPaste={handlePaste} className="min-h-screen bg-[#F8FAFB] text-[#111827] font-sans">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 py-3 max-w-6xl mx-auto">
          <Link href="/" className="font-black tracking-tight text-xl">
            <span style={{ color: '#E8782E' }}>Post</span><span style={{ color: '#1A4A5C' }}>Viajes</span>
          </Link>
          {session ? (
            <div className="flex items-center gap-2">
              <img src={session.user?.image || ''} className="w-7 h-7 rounded-full ring-2 ring-[#1A4A5C]/30" alt="" />
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

        {uiStep === 'upload' && (
          <div className={`${animClass}`}>
            {error && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm">{error}</div>}
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
                    <span className="opacity-0 group-hover:opacity-100 transition text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm">Cambiar imagen</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-white border-2 border-dashed border-gray-200 group-hover:border-[#1A4A5C]/40 group-hover:bg-[#2A6A82]/5 transition flex flex-col items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2A6A82]/10 group-hover:bg-[#2A6A82]/20 transition flex items-center justify-center"><Upload className="w-6 h-6 text-[#1A4A5C]" /></div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700">Cargá tu flyer</p>
                    <p className="text-sm text-gray-400 mt-1">Sacá un screenshot y pegalo (Ctrl+V) o hacé click</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={processFlyer}
              disabled={!flyerBase64}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:bg-gray-100 disabled:text-gray-300 bg-[#E8782E] hover:bg-[#D46B25] text-white shadow-2xl shadow-[#E8782E]/30"
            >
              <Bot className="w-5 h-5" /> Generá tu post con IA ✨
            </button>
          </div>
        )}

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
          </div>
        )}

        {uiStep === 'images' && result && (
          <div className={`${animClass}`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-black text-[#1A4A5C] tracking-widest mb-1">ELEGÍ UNA FOTO</p>
                <h2 className="text-2xl font-black leading-tight">{result.destination}</h2>
              </div>
              <button onClick={reset} className="text-gray-400 hover:text-white transition flex items-center gap-1 text-xs mt-1"><ArrowLeft className="w-3 h-3" /> Volver</button>
            </div>
            {photos.length === 0 ? (
              <div className="rounded-3xl overflow-hidden bg-white flex items-center justify-center w-full h-80 animate-pulse" />
            ) : (
              <>
                <div className="relative rounded-3xl overflow-hidden mb-3 w-full h-80 md:h-[460px]" onTouchStart={swipeTouchStart} onTouchEnd={swipeTouchEnd}>
                  <img key={photoIdx} src={currentPhoto?.thumbnail} alt={result.destination} className="w-full h-full object-cover animate-fade-left" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <button
                  onClick={() => { setSelectedPhoto(currentPhoto); setCurrentStep(4); goTo('style', 'left') }}
                  className="w-full py-4 rounded-2xl font-black text-lg bg-white text-[#1A4A5C] hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-[0_20px_50px_-12px_rgba(26,74,92,0.25)] border border-gray-100"
                >
                  Elegir esta foto →
                </button>
              </>
            )}
          </div>
        )}

        {/* --- CONTINUACIÓN DEL RESTO DE LOS STEPS --- */}
        {uiStep === 'style' && selectedPhoto && result && (
          <div className={`${animClass}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black">Elegí un estilo</h2>
              <button onClick={() => goTo('images', 'right')} className="text-gray-400 text-xs flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Volver</button>
            </div>
            <div className="rounded-3xl overflow-hidden h-80 w-full mb-4">
              <img src={selectedPhoto.thumbnail} alt="" className="w-full h-full object-cover" style={{ filter: selectedStyle.filter }} />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {STYLES.map(style => (
                <button key={style.id} onClick={() => setSelectedStyle(style)} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-4 ${selectedStyle.id === style.id ? 'border-[#1A4A5C]' : 'border-transparent'}`}>
                    <img src={selectedPhoto.thumbnail} className="w-full h-full object-cover" style={{ filter: style.filter }} alt="" />
                  </div>
                  <span className="text-[10px] font-bold">{style.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setCurrentStep(5); goTo('preview', 'left') }} className="w-full py-4 rounded-2xl font-black text-lg bg-[#1A4A5C] text-white shadow-lg">Usar este estilo →</button>
          </div>
        )}

        {uiStep === 'preview' && result && selectedPhoto && (
          <div className={`${animClass}`}>
            <div className="rounded-3xl overflow-hidden mb-4 aspect-[3/4]">
              <img src={selectedPhoto.thumbnail} alt="" className="w-full h-full object-cover" style={{ filter: selectedStyle.filter }} />
            </div>
            <PostTextCard textFacebook={editedFB} textInstagram={editedIG} activeTab={activeTab} setActiveTab={setActiveTab} onChangeFacebook={setEditedFB} onChangeInstagram={setEditedIG} />
            <div className="mt-4 flex flex-col gap-3">
              <button onClick={() => handleSocialPublish('facebook')} className="w-full py-4 rounded-2xl font-black bg-[#1877F2] text-white flex items-center justify-center gap-3"><FbIcon /> Publicá en Facebook</button>
              <button onClick={() => handleSocialPublish('instagram')} className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, #f09433 0%, #bc1888 100%)' }}><IgIcon /> Publicá en Instagram</button>
              <button onClick={() => handleSocialPublish('whatsapp')} className="w-full py-4 rounded-2xl font-black bg-[#25D366] text-white flex items-center justify-center gap-3"><WaIcon /> Compartí por WhatsApp</button>
            </div>
            <button onClick={reset} className="mt-4 w-full text-gray-400 text-sm">Empezar de nuevo</button>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-gray-300 text-xs">
        PostViajes · Emiliano Crespo · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

function PostTextCard({ textFacebook, textInstagram, activeTab, setActiveTab, onChangeFacebook, onChangeInstagram }: any) {
  const { copied, copy } = useCopy()
  const text = activeTab === 'instagram' ? textInstagram : textFacebook
  const onChange = activeTab === 'instagram' ? onChangeInstagram : onChangeFacebook

  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-gray-200">
      <div className="flex border-b border-gray-100">
        <button onClick={() => setActiveTab('instagram')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'instagram' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400'}`}>Instagram</button>
        <button onClick={() => setActiveTab('facebook')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'facebook' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>Facebook</button>
      </div>
      <div className="p-4">
        <textarea value={text} onChange={e => onChange(e.target.value)} rows={6} className="w-full text-sm text-gray-700 outline-none resize-none" />
        <button onClick={() => copy(text)} className="mt-3 w-full py-2 bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
          {copied ? <><Check className="w-3 h-3 text-green-500" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar texto</>}
        </button>
      </div>
    </div>
  )
}