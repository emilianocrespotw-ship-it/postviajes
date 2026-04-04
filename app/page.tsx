import Link from 'next/link'

// ─── Logo SVG (igual al logo 2 simplificado) ──────────────────────────────────
function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-xl ${className}`}>
      <span style={{ color: '#E8782E' }}>Post</span>
      <span style={{ color: '#1A4A5C' }}>Viajes</span>
    </span>
  )
}

// ─── Íconos simples ───────────────────────────────────────────────────────────
function IconUpload() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
function IconBrain() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 017 4.5v.5H5a3 3 0 000 6h.5v.5a3.5 3.5 0 007 0V11h.5a3 3 0 000-6H11v-.5A2.5 2.5 0 009.5 2z"/><path d="M14.5 2A2.5 2.5 0 0117 4.5v.5h2a3 3 0 010 6h-.5v.5a3.5 3.5 0 01-7 0V11h-.5"/>
    </svg>
  )
}
function IconShare() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ─── Mockup: flyer → post ─────────────────────────────────────────────────────
function MockupCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Flyer de entrada */}
      <div className="absolute -left-6 top-4 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 rotate-[-6deg] z-10">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl h-24 mb-2 flex items-center justify-center">
          <span className="text-white font-black text-sm text-center leading-tight px-2">CANCÚN<br/>TODO INCLUIDO</span>
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-gray-200 rounded-full w-4/5" />
          <div className="h-2 bg-gray-200 rounded-full w-3/5" />
          <div className="h-2 bg-orange-200 rounded-full w-2/5" />
        </div>
        <p className="text-[9px] text-gray-400 mt-2 text-center font-medium">FLYER OPERADOR</p>
      </div>

      {/* Flecha */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-9 h-9 rounded-full bg-[#E8782E] flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>

      {/* Post de salida */}
      <div className="ml-auto w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-400 to-[#1A4A5C] h-32 relative">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <span className="text-white font-black text-sm">Cancún</span>
            <p className="text-white/70 text-[10px]">México · 7 noches</p>
          </div>
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-0.5">
            <span className="text-white text-[9px] font-bold">USD 1.250 p/p</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            ¿Soñás con Cancún? 🌴 Todo incluido, vuelo directo desde Buenos Aires. ¡Plazas limitadas!
          </p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {['#cancun', '#viaje', '#todoincludo'].map(h => (
              <span key={h} className="text-[8px] text-[#1A4A5C] font-medium">{h}</span>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            <div className="flex-1 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Facebook</span>
            </div>
            <div className="flex-1 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Instagram</span>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 text-center pb-2 font-medium">POST LISTO ✓</p>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#como-funciona" className="hover:text-[#1A4A5C] transition">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-[#1A4A5C] transition">Beneficios</a>
            <Link href="/pricing" className="hover:text-[#1A4A5C] transition">Precios</Link>
          </nav>
          <Link
            href="/crear"
            className="bg-[#1A4A5C] hover:bg-[#2A6A82] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            Probá gratis →
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Texto */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#E8F4F8] text-[#1A4A5C] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8782E] inline-block" />
            Para agencias y operadores mayoristas
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#111827] leading-tight mb-5">
            Del flyer del operador<br />
            al post listo para<br />
            <span className="text-[#E8782E]">publicar</span>
            <span className="text-[#1A4A5C]"> en segundos.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            Subís la imagen del paquete, la IA detecta destino, fechas y precio, y genera el texto y la foto perfecta para Instagram, Facebook y WhatsApp. Sin diseñador. Sin perder el tiempo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/crear"
              className="bg-[#E8782E] hover:bg-[#d06820] text-white font-black px-8 py-4 rounded-2xl text-lg transition shadow-lg shadow-orange-200 text-center"
            >
              Empezá gratis →
            </Link>
            <a
              href="#como-funciona"
              className="border border-gray-200 text-gray-600 hover:border-[#1A4A5C] hover:text-[#1A4A5C] font-bold px-8 py-4 rounded-2xl text-lg transition text-center"
            >
              Ver cómo funciona
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">Sin tarjeta de crédito · Sin instalación</p>
        </div>

        {/* Mockup visual */}
        <div className="relative hidden md:flex items-center justify-center py-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F8] to-[#FDF0E8] rounded-3xl" />
          <div className="relative z-10 py-12">
            <MockupCard />
          </div>
        </div>
      </section>

      {/* ── BAND ── */}
      <div className="bg-[#F0F7F9] border-y border-[#dceef4] py-4">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[#1A4A5C] font-medium">
          <span className="font-bold opacity-50 mr-2">Ideal para:</span>
          {['Agencias de viajes', 'Operadores mayoristas', 'Equipos de ventas', 'Sin diseñador requerido'].map(t => (
            <span key={t} className="flex items-center gap-1.5 opacity-70">
              <span className="text-[#E8782E]">✓</span> {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[#E8782E] font-bold text-sm tracking-widest mb-3">CÓMO FUNCIONA</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#111827]">Tres pasos. Nada más.</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Diseñado para equipos que no tienen tiempo para diseñar.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              Icon: IconUpload,
              title: 'Subís el flyer',
              desc: 'JPG, PNG o PDF del paquete del operador. Lo que te llegó por mail o WhatsApp.',
            },
            {
              num: '02',
              Icon: IconBrain,
              title: 'La IA lo transforma',
              desc: 'Detecta destino, fechas, precio e incluidos. Genera el texto y elige la foto del destino.',
            },
            {
              num: '03',
              Icon: IconShare,
              title: 'Publicás donde querés',
              desc: 'Descargá la imagen, copiá el texto listo y publicá en Instagram, Facebook o WhatsApp.',
            },
          ].map(({ num, Icon, title, desc }) => (
            <div key={num} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#E8F4F8] text-[#1A4A5C] flex items-center justify-center">
                  <Icon />
                </div>
                <span className="text-4xl font-black text-gray-100 select-none">{num}</span>
              </div>
              <h3 className="text-lg font-black text-[#111827] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section id="beneficios" className="bg-[#1A4A5C] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#E8782E] font-bold text-sm tracking-widest mb-3">POR QUÉ POSTVIAJES</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">El tiempo de tu equipo vale mucho.</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">Hacé más con menos esfuerzo.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: '30 segundos en vez de 30 minutos', desc: 'Lo que antes tomaba media hora — escribir el texto, elegir la foto, ajustar el formato — ahora es automático.' },
              { title: 'Sin diseñador ni community manager', desc: 'Cualquier persona del equipo puede generar un post profesional. Sin Canva, sin Photoshop, sin cursos.' },
              { title: 'Fotos del destino incluidas', desc: 'La IA elige fotos reales de Aruba, Cancún, Roma o donde sea. No más fotos genéricas ni del operador.' },
              { title: 'Texto listo para copiar y pegar', desc: 'Copy optimizado para Instagram y Facebook con emojis, hashtags y call to action. Editarlo es opcional.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-4 bg-white/[0.06] border border-white/10 rounded-2xl p-6">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-[#E8782E] flex-shrink-0 flex items-center justify-center text-white">
                  <IconCheck />
                </div>
                <div>
                  <h3 className="font-black text-white mb-1">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-[#111827] mb-4">
          ¿Listo para probarlo?
        </h2>
        <p className="text-gray-500 text-lg mb-8">
          Cargá tu primer flyer y en 30 segundos tenés el post listo. Gratis.
        </p>
        <Link
          href="/crear"
          className="inline-block bg-[#E8782E] hover:bg-[#d06820] text-white font-black px-10 py-5 rounded-2xl text-xl transition shadow-xl shadow-orange-100"
        >
          Empezar gratis →
        </Link>
        <p className="text-gray-400 text-sm mt-5">Sin registro · Sin tarjeta · Sin límite de tiempo</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-gray-400 text-xs text-center">
            Hecho por <span className="text-gray-600 font-medium">Emiliano Crespo</span> · Fotos: Pexels y Unsplash · © {new Date().getFullYear()}
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#como-funciona" className="hover:text-[#1A4A5C] transition">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-[#1A4A5C] transition">Beneficios</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
