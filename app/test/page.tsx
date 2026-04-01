'use client'
import { useState, useCallback } from 'react'

interface Result {
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

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [images, setImages] = useState<PexelsImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'result'>('upload')

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setImages([])
    setError(null)
    setStep('upload')
  }, [])

  const processFlyer = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      // Convertir a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error procesando el flyer')

      setResult(data)
      setStep('result')

      // Buscar imágenes en paralelo
      fetch(`/api/suggest-images?q=${encodeURIComponent(data.searchQuery)}`)
        .then(r => r.json())
        .then(d => setImages(d.images || []))
        .catch(() => {})

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black text-indigo-600">Post</span>
            <span className="text-xl font-black text-gray-800">Viajes</span>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full ml-2">MODO TEST</span>
          </div>
          <p className="text-gray-500 text-sm">Probá el flujo sin login. Subí un flyer y mirá qué genera la IA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Columna izquierda: Upload */}
          <div>
            <div
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 transition bg-white"
              onClick={() => document.getElementById('file-input')?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
            >
              {preview ? (
                <img src={preview} alt="Flyer" className="max-h-64 mx-auto rounded-xl object-contain" />
              ) : (
                <>
                  <div className="text-5xl mb-3">📎</div>
                  <p className="font-medium text-gray-600">Arrastrá un flyer acá</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG · Máx. 10MB</p>
                </>
              )}
              <input id="file-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {file && (
              <button
                onClick={processFlyer}
                disabled={loading}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    La IA está leyendo el flyer…
                  </span>
                ) : '🤖 Procesar con IA →'}
              </button>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Info detectada */}
            {result && (
              <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-700 mb-3">📍 Info detectada por la IA</p>
                {result.destination && <div className="flex justify-between"><span className="text-gray-400">Destino</span><span className="font-medium">{result.destination}, {result.country}</span></div>}
                {result.price && <div className="flex justify-between"><span className="text-gray-400">Precio</span><span className="font-medium text-green-600">{result.price}</span></div>}
                {result.dates && <div className="flex justify-between"><span className="text-gray-400">Fechas</span><span className="font-medium">{result.dates}</span></div>}
                {result.includes?.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-1">Incluye</span>
                    <ul className="space-y-0.5">
                      {result.includes.map((item, i) => <li key={i} className="text-gray-600">· {item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna derecha: Textos generados */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                <div className="text-4xl mb-3">✨</div>
                <p className="font-medium">Los textos generados van a aparecer acá</p>
                <p className="text-sm mt-1">Subí un flyer y hacé clic en Procesar</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center h-full flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-gray-500">Leyendo el flyer y generando los textos…</p>
                <p className="text-gray-400 text-xs mt-1">Tarda unos segundos</p>
              </div>
            )}

            {result && (
              <>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold text-blue-600 mb-2">📘 FACEBOOK</p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.textFacebook}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold text-pink-600 mb-2">📸 INSTAGRAM</p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.textInstagram}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Imágenes sugeridas */}
        {images.length > 0 && (
          <div className="mt-8">
            <p className="font-semibold text-gray-700 mb-3">
              🖼️ Fotos sugeridas para <span className="text-indigo-600">{result?.destination}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {images.map(img => (
                <div key={img.id} className="rounded-xl overflow-hidden aspect-video bg-gray-100 relative group">
                  <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end p-1">
                    <span className="text-white text-xs truncate">{img.photographer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
