'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [flyers, setFlyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlyers()
  }, [])

  async function fetchFlyers() {
    const { data, error } = await supabase
      .from('flyers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setFlyers(data || [])
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mis Flyers Procesados 🗂️</h1>
          <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Procesar Nuevo
          </a>
        </div>

        {loading ? (
          <p>Cargando tus viajes...</p>
        ) : flyers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <p className="text-gray-500 text-lg">Todavía no procesaste ningún flyer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flyers.map((flyer) => (
              <div key={flyer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
                {flyer.image_url && (
                  <img src={flyer.image_url} alt={flyer.destination} className="h-48 w-full object-cover" />
                )}
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-black">{flyer.destination}</h2>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                      {new Date(flyer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-blue-600 font-semibold mb-4">{flyer.price}</p>
                  
                  <div className="space-y-4">
                    <div className="text-sm">
                      <strong className="block text-gray-400 uppercase text-[10px]">Instagram Caption:</strong>
                      <p className="text-gray-600 line-clamp-3 italic">"{flyer.text_instagram}"</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex gap-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(flyer.text_instagram)}
                    className="flex-1 text-xs bg-white border py-2 rounded hover:bg-gray-100 transition"
                  >
                    Copiar IG
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(flyer.text_facebook)}
                    className="flex-1 text-xs bg-white border py-2 rounded hover:bg-gray-100 transition"
                  >
                    Copiar FB
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}