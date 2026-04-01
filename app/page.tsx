'use client'

import { useState } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [extraInfo, setExtraInfo] = useState('')
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Función para convertir imagen a Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const processFlyer = async () => {
    if (!preview) return alert('Por favor, seleccioná una imagen')
    
    setLoading(true)
    setResult(null)

    try {
      // Extraemos solo el string base64 puro y el mimeType
      const base64Content = preview.split(',')[1]
      const mimeType = preview.split(';')[0].split(':')[1]

      const response = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Content,
          mimeType,
          extraInfo
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setResult(data)
    } catch (error) {
      console.error(error)
      alert('Error al procesar el flyer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">PostViajes ✨</h1>
          <p className="text-gray-600 text-lg">Subí tu flyer y generamos los posteos por vos.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* COLUMNA IZQUIERDA: INPUTS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">1. Cargá el Flyer</h2>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="w-full p-2 border rounded mb-4"
            />

            {preview && (
              <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded mb-4" />
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">Información Extra (opcional)</label>
            <textarea 
              placeholder="Ej: Promo válida solo por hoy, incluye traslado gratis..."
              className="w-full p-3 border rounded-lg h-24 mb-4 text-black"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
            />

            <button 
              onClick={processFlyer}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'Procesando con IA... ⏳' : '¡Generar Posteos! 🚀'}
            </button>
          </section>

          {/* COLUMNA DERECHA: RESULTADOS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4">2. Resultados</h2>
            
            {!result && !loading && (
              <div className="flex items-center justify-center h-48 text-gray-400 italic">
                Aparecerán los textos aquí una vez procesado.
              </div>
            )}

            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                  <h3 className="font-bold text-blue-500 uppercase text-sm">Destino Detectado:</h3>
                  <p className="text-lg font-medium text-black">{result.destination} - {result.country}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-100">
                  <h4 className="font-bold text-xs mb-1 text-blue-600 uppercase">Facebook Post:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.textFacebook}</p>
                </div>

                <div className="p-3 bg-pink-50 rounded border border-pink-100">
                  <h4 className="font-bold text-xs mb-1 text-pink-600 uppercase">Instagram Caption:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.textInstagram}</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* SECCIÓN IMÁGENES PEXELS */}
        {result?.images && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">📸 Fotos sugeridas de Pexels</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {result.images.map((img: any, idx: number) => (
                <div key={idx} className="group relative overflow-hidden rounded-lg">
                  <img 
                    src={img.url} 
                    alt={img.alt} 
                    className="h-40 w-full object-cover transform transition group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <a href={img.url} target="_blank" className="text-white text-xs underline">Ver original</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}