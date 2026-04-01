'use client'
import { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { Upload, Bot, Image as ImageIcon, Palette, Rocket, CheckCircle } from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setCurrentStep(1) // Ilumina Paso 1
      }
      reader.readAsDataURL(file)
    }
  }

  const processFlyer = async () => {
    if (!preview) return alert('Subí un flyer primero')
    setLoading(true)
    setCurrentStep(2) // Empieza la IA
    
    try {
      const response = await fetch('/api/process-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview.split(',')[1] })
      })
      const data = await response.json()
      
      // Simulamos progresión visual de los pasos para que quede lindo
      setTimeout(() => setCurrentStep(3), 1000) // Fotos
      setTimeout(() => setCurrentStep(4), 2000) // Estilo
      setTimeout(() => {
        setResult(data)
        setCurrentStep(5) // Listo para publicar
        setLoading(false)
      }, 3000)

    } catch (error) {
      alert('Error procesando')
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          text: result.textFacebook,
          imageUrl: result.images[0]
        })
      })
      const data = await res.json()
      if (data.success) alert('¡Publicado con éxito en Facebook! 🎉')
      else alert('Error al publicar: ' + data.error)
    } catch (e) {
      alert('Error de red')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-indigo-500/30">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter">Post <span className="text-indigo-500">Viajes</span></div>
        {session ? (
          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 pr-4 rounded-full border border-slate-800">
            <img src={session.user?.image || ''} className="w-8 h-8 rounded-full border border-indigo-500" />
            <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition">Salir</button>
          </div>
        ) : (
          <button onClick={() => signIn('facebook')} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full font-bold transition text-sm shadow-lg shadow-indigo-500/20">Conectar Facebook</button>
        )}
      </nav>

      <main className="max-w-4xl mx-auto pt-16 pb-12 text-center px-4">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">De flyer a post <br /> en segundos</h1>
        <p className="text-slate-400 mb-12 text-lg">La IA analiza tu flyer, genera el contenido y lo publica por vos.</p>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl max-w-2xl mx-auto mb-20 relative overflow-hidden">
          {!result ? (
            <div className="space-y-6">
                <div className="relative group cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`border-2 border-dashed rounded-3xl p-16 transition-all duration-500 ${preview ? 'border-green-500/50 bg-green-500/5' : 'border-slate-800 bg-slate-800/20 group-hover:border-indigo-500/50'}`}>
                    {preview ? (
                        <img src={preview} className="max-h-52 mx-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center"><Upload className="w-8 h-8 text-indigo-500" /></div>
                          <p className="font-semibold text-white">Arrastrá tu flyer aquí</p>
                        </div>
                    )}
                  </div>
                </div>
                <button onClick={processFlyer} disabled={loading || !preview} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Bot className="w-5 h-5" />}
                  {loading ? 'Analizando con IA...' : '¡Generar Posteos Mágicos! ✨'}
                </button>
            </div>
          ) : (
            <div className="text-left space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="text-green-500 w-6 h-6" /> {result.destination}</h3>
                    <button onClick={() => {setResult(null); setPreview(null); setCurrentStep(0)}} className="text-xs text-slate-500 hover:text-white underline">Subir otro</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PostCard title="FACEBOOK" text={result.textFacebook} color="text-blue-400" />
                    <PostCard title="INSTAGRAM" text={result.textInstagram} color="text-pink-400" />
                </div>
                <button onClick={handlePublish} disabled={!session || publishing} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 py-5 rounded-2xl transition-all font-black text-lg shadow-xl shadow-green-500/20 flex items-center justify-center gap-3">
                    {publishing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Rocket className="w-6 h-6" />}
                    {session ? (publishing ? 'Publicando...' : '🚀 PUBLICAR AHORA MISMO') : '🔒 CONECTÁ FACEBOOK PARA PUBLICAR'}
                </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Step active={currentStep >= 1} icon={Upload} step="1" title="Subís flyer" />
          <Step active={currentStep >= 2} icon={Bot} step="2" title="IA analiza" />
          <Step active={currentStep >= 3} icon={ImageIcon} step="3" title="Fotos" />
          <Step active={currentStep >= 4} icon={Palette} step="4" title="Estilo" />
          <Step active={currentStep >= 5} icon={Rocket} step="5" title="Publicás" />
        </div>
      </main>
    </div>
  )
}

function PostCard({ title, text, color }: any) {
    return (
        <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-3xl relative group">
            <p className={`text-[10px] font-black tracking-widest mb-3 ${color}`}>{title}</p>
            <p className="text-sm text-slate-300 leading-relaxed italic line-clamp-6">"{text}"</p>
            <button onClick={() => {navigator.clipboard.writeText(text); alert('Copiado!')}} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition bg-slate-700 px-2 py-1 rounded text-[10px]">Copiar</button>
        </div>
    )
}

function Step({ active, icon: Icon, step, title }: any) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all duration-1000 ${active ? 'border-green-500 bg-green-500/10 scale-105 shadow-lg shadow-green-500/10' : 'border-slate-800 bg-slate-900/40 opacity-40'}`}>
      <Icon className={`w-8 h-8 mx-auto mb-4 transition-all duration-1000 ${active ? 'text-green-500' : 'text-slate-600'}`} />
      <p className={`text-[10px] font-black uppercase mb-1 ${active ? 'text-green-400' : 'text-slate-500'}`}>PASO {step}</p>
      <h4 className={`font-bold text-xs ${active ? 'text-white' : 'text-slate-700'}`}>{title}</h4>
    </div>
  )
}