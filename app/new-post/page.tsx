'use client'
import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FlyerData {
  destination: string
  country: string
  price: string
  dates: string
  includes: string[]
  hotel: string
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
  { id: 'minimal', label: 'Minimalista', desc: 'Limpio, sin filtro', preview: 'brightness-100' },
  { id: 'warm',    label: 'Cálido',      desc: 'Tonos dorados',     preview: 'sepia' },
  { id: 'cool',    label: 'Fresco',      desc: 'Tonos azules',      preview: 'hue-rotate-180' },
  { id: 'dark',    label: 'Oscuro',      desc: 'Elegante y oscuro', preview: 'brightness-50' },
  { id: 'vivid',   label: 'Vibrante',    desc: 'Colores potentes',  preview: 'saturate-200' },
]

const STEPS = ['Flyer', 'Texto', 'Imagen', 'Estilo', 'Publicar']

// ─── Componente principal ────────────────────────────────────────────────────

export default function NewPostPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Datos del flyer y del post
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [flyerData, setFlyerData] = useState<FlyerData | null>(null)
  const [textFacebook, setTextFacebook] = useState('')
  const [textInstagram, setTextInstagram] = useState('')
  const [images, setImages] = useState<PexelsImage[]>([])
  const [selectedImage, setSelectedImage] = useState<PexelsImage | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('minimal')

  // ─── Paso 1: Upload del flyer ──────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
    setError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setFlyerFile(file)
      setFlyerPreview(URL.createObjectURL(file))
    }
  }, [])

  const processFlyer = async () => {
    if (!flyerFile) return
    setLoading(true)
    setError(null)

    try {
      // Convertir imagen a base64
      const base64 = await fileToBase64(flyerFile)

      const res = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: flyerFile.type,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error procesando el flyer')
      }

      const data: FlyerData = await res.json()
      setFlyerData(data)
      setTextFacebook(data.textFacebook)
      setTextInstagram(data.textInstagram)
      setStep(1)

      // Cargar imágenes en paralelo
      fetchImages(data.searchQuery)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Paso 3: Buscar imágenes ───────────────────────────────────────────

  const fetchImages = async (query: string) => {
    try {
      const res = await fetch(`/api/suggest-images?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setImages(data.images || [])
    } catch {
      // Silencioso — el usuario puede buscar manualmente
    }
  }

  const handleImageSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    setLoading(true)
    await fetchImages(q)
    setLoading(false)
  }

  // ─── Paso final: Publicar ─────────────────────────────────────────────

  const handlePublish = async () => {
    if (!selectedImage) return
    setLoading(true)
    setError(null)

    try {
      // TODO: Obtener pageId, pageToken e igUserId del perfil de usuario en Supabase
      // Por ahora usamos los del session (flujo simplificado)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage.url,
          textFacebook,
          textInstagram,
          // pageId, pageToken, igUserId → vienen del perfil del usuario
        }),
      })

      const result = await res.json()

      if (result.success) {
        router.push('/dashboard?published=1')
      } else {
        setError(`Errores: ${result.errors.join(' | ')}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Volver
          </button>
          <span className="font-bold text-gray-800">Nuevo post</span>
          <span className="text-sm text-gray-400">Paso {step + 1} de {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition
                ${i === step ? 'bg-indigo-600 text-white' : i < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
            >
              {i < step ? '✓' : i + 1}. {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ─── PASO 0: Upload del flyer ─── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Subí el flyer</h1>
            <p className="text-gray-500 mb-6">JPG, PNG o PDF que te mandó el proveedor. La IA lee la info sola.</p>

            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 transition"
              onClick={() => document.getElementById('flyer-input')?.click()}
            >
              {flyerPreview ? (
                <img src={flyerPreview} alt="Flyer" className="max-h-64 mx-auto rounded-xl object-contain" />
              ) : (
                <>
                  <div className="text-5xl mb-4">📎</div>
                  <p className="text-gray-500 font-medium">Arrastrá el flyer acá o hacé clic para elegirlo</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG, PDF · Máx. 10MB</p>
                </>
              )}
              <input
                id="flyer-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {flyerFile && (
              <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{flyerFile.name}</p>
                  <p className="text-gray-400 text-xs">{(flyerFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            )}

            <button
              onClick={processFlyer}
              disabled={!flyerFile || loading}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="loader !w-5 !h-5 !border-2"></span>
                  La IA está leyendo el flyer…
                </span>
              ) : 'Procesar flyer →'}
            </button>
          </div>
        )}

        {/* ─── PASO 1: Editar texto ─── */}
        {step === 1 && flyerData && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Texto generado</h1>
            <p className="text-gray-500 mb-6">
              La IA detectó: <span className="font-semibold text-indigo-600">{flyerData.destination}</span>
              {flyerData.price && <> · {flyerData.price}</>}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📘 Facebook <span className="text-gray-400 font-normal">({textFacebook.length} caracteres)</span>
                </label>
                <textarea
                  value={textFacebook}
                  onChange={e => setTextFacebook(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📸 Instagram <span className="text-gray-400 font-normal">({textInstagram.length} caracteres)</span>
                </label>
                <textarea
                  value={textInstagram}
                  onChange={e => setTextInstagram(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition"
            >
              Elegir imagen →
            </button>
          </div>
        )}

        {/* ─── PASO 2: Elegir imagen ─── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Elegí la imagen</h1>
            <p className="text-gray-500 mb-6">10 fotos sugeridas del destino. Sin texto, solo la foto.</p>

            {/* Búsqueda manual */}
            <form onSubmit={handleImageSearch} className="flex gap-2 mb-6">
              <input
                name="q"
                defaultValue={flyerData?.destination}
                placeholder="Buscar otro destino..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 transition"
              >
                Buscar
              </button>
            </form>

            {/* Grid de imágenes */}
            {images.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="loader mx-auto mb-4"></div>
                <p>Buscando fotos…</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`relative rounded-xl overflow-hidden aspect-video border-4 transition
                      ${selectedImage?.id === img.id ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent'}`}
                  >
                    <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                    {selectedImage?.id === img.id && (
                      <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                      {img.photographer}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!selectedImage}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition"
            >
              Elegir estilo →
            </button>
          </div>
        )}

        {/* ─── PASO 3: Elegir estilo ─── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Elegí el estilo</h1>
            <p className="text-gray-500 mb-6">Define el filtro y el look de la imagen.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`rounded-xl overflow-hidden border-4 transition
                    ${selectedStyle === style.id ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent'}`}
                >
                  {selectedImage && (
                    <img
                      src={selectedImage.thumbnail}
                      alt={style.label}
                      className={`w-full aspect-video object-cover filter ${style.preview}`}
                    />
                  )}
                  <div className="p-3 bg-white text-left">
                    <p className="font-semibold text-gray-800 text-sm">{style.label}</p>
                    <p className="text-gray-400 text-xs">{style.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(4)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition"
            >
              Ver vista previa →
            </button>
          </div>
        )}

        {/* ─── PASO 4: Vista previa y publicar ─── */}
        {step === 4 && selectedImage && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Vista previa</h1>
            <p className="text-gray-500 mb-6">Así va a quedar tu post en Facebook e Instagram.</p>

            {/* Mockup de post */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              {/* Header tipo Facebook */}
              <div className="flex items-center gap-3 p-4 border-b">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">A</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Tu Agencia de Viajes</p>
                  <p className="text-gray-400 text-xs">Ahora · 🌐</p>
                </div>
              </div>

              {/* Texto */}
              <div className="px-4 py-3">
                <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-5">{textFacebook}</p>
              </div>

              {/* Imagen con filtro */}
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt="Post"
                  className={`w-full aspect-video object-cover filter ${STYLES.find(s => s.id === selectedStyle)?.preview}`}
                />
              </div>

              {/* Footer tipo Facebook */}
              <div className="px-4 py-3 text-gray-400 text-sm flex gap-6 border-t">
                <span>👍 Me gusta</span>
                <span>💬 Comentar</span>
                <span>↗ Compartir</span>
              </div>
            </div>

            {/* Caption Instagram */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
              <p className="text-xs font-semibold text-gray-400 mb-2">📸 CAPTION INSTAGRAM</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{textInstagram}</p>
            </div>

            {/* Botón publicar */}
            <button
              onClick={handlePublish}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-xl text-lg transition shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="loader !w-5 !h-5 !border-2"></span>
                  Publicando en Facebook e Instagram…
                </span>
              ) : '🚀 Publicar en Facebook e Instagram'}
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              Se publicará simultáneamente en ambas plataformas
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = (reader.result as string).split(',')[1] // quitar "data:image/...;base64,"
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
