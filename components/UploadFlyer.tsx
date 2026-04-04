'use client'
import React, { useState, useCallback } from 'react'

export default function UploadFlyer() {
  const [image, setImage] = useState<string | null>(null)

  // Función para manejar el archivo (sea de donde venga)
  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target?.result as string)
      reader.readAsDataURL(file)
      // Aquí podrías luego subirlo a Supabase o procesarlo
    }
  }

  // 1. SOPORTE PARA PEGAR (PC: Ctrl+V)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0]
    if (item?.type.includes('image')) {
      const file = item.getAsFile()
      if (file) handleFile(file)
    }
  }, [])

  // 2. SOPORTE PARA SELECCIONAR ARCHIVO (Móvil y PC)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div 
      onPaste={handlePaste}
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors"
    >
      {image ? (
        <div className="relative inline-block">
          <img src={image} alt="Preview" className="max-h-64 rounded-lg shadow-md" />
          <button 
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center">
          <span className="text-4xl mb-2">📸</span>
          <p className="text-lg font-medium">Haz clic para cargar o pega tu screenshot</p>
          <p className="text-sm text-gray-400 mt-1">En PC puedes usar Ctrl + V</p>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleInputChange} 
          />
          
          <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Cargar Flyer
          </div>
        </label>
      )}
    </div>
  )
}