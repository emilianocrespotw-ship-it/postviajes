import Link from 'next/link'

function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-xl ${className}`}>
      <span style={{ color: '#E8782E' }}>Post</span>
      <span style={{ color: '#1A4A5C' }}>Viajes</span>
    </span>
  )
}

function IconCheck({ color = '#E8782E' }: { color?: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

const FREE_FEATURES = [
  { text: '5 posts por mes', ok: true },
  { text: 'Fotos del destino con IA', ok: true },
  { text: 'Texto para Instagram y Facebook', ok: true },
  { text: '10 filtros de imagen', ok: true },
  { text: 'Posts ilimitados', ok: false },
  { text: 'WhatsApp incluido', ok: false },
  { text: 'Soporte prioritario', ok: false },
]

const PRO_FEATURES = [
  { text: 'Posts ilimitados', ok: true },
  { text: 'Fotos del destino con IA', ok: true },
  { text: 'Texto para Instagram, Facebook y WhatsApp', ok: true },
  { text: '10 filtros de imagen', ok: true },
  { text: 'Soporte prioritario por WhatsApp', ok: true },
  { text: 'Nuevas funciones primero', ok: true },
  { text: 'Sin marca de agua (próximamente)', ok: true },
]

const FAQS = [
  {
    q: '¿Necesito tarjeta de crédito para probar?',
    a: 'No. El plan gratuito no requiere ningún dato de pago. Probás, y si te convence, pasás al plan Pro.',
  },
  {
    q: '¿Cómo se paga el plan Pro?',
    a: 'Por ahora el pago es manual — escribinos por WhatsApp o mail y coordinamos. Pronto habilitamos pago online con tarjeta.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. Sin permanencia ni penalidades. Avisás y listo.',
  },
  {
    q: '¿Funciona para mayoristas con muchas agencias?',
    a: 'Estamos desarrollando planes especiales para operadores mayoristas que quieran dar acceso a su red de agencias. Escribinos para hablar.',
  },
  {
    q: '¿Cuántos usuarios puede tener una cuenta?',
    a: 'Por ahora una cuenta es un usuario. Los planes multiusuario para equipos están en el roadmap.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── HERO ── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <p className="text-[#E8782E] font-bold text-sm tracking-widest mb-4">PRECIOS</p>
        <h1 className="text-4xl md:text-5xl font-black text-[#111827] leading-tight mb-5">
          Simple y sin sorpresas.
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          Empezá gratis y pasá al plan Pro cuando la herramienta ya te esté ahorrando tiempo.
        </p>
      </section>

      {/* ── PLANES ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Plan Gratuito */}
          <div className="border border-gray-200 rounded-3xl p-8 bg-white">
            <p className="text-sm font-bold text-gray-400 tracking-widest mb-3">GRATIS</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black text-[#111827]">$0</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Para probar sin compromisos</p>

            <Link
              href="/crear"
              className="block w-full text-center py-3.5 rounded-2xl font-bold text-[#1A4A5C] border-2 border-[#1A4A5C] hover:bg-[#E8F4F8] transition mb-8"
            >
              Empezar gratis
            </Link>

            <ul className="space-y-3.5">
              {FREE_FEATURES.map(({ text, ok }) => (
                <li key={text} className="flex items-center gap-3">
                  {ok ? <IconCheck /> : <IconX />}
                  <span className={`text-sm ${ok ? 'text-gray-700' : 'text-gray-300'}`}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan Pro */}
          <div className="border-2 border-[#1A4A5C] rounded-3xl p-8 bg-white relative shadow-xl shadow-[#1A4A5C]/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-center">
              <span className="bg-[#E8782E] text-white text-xs font-black px-4 py-1.5 rounded-full tracking-wide shadow-lg whitespace-nowrap">
                MÁS POPULAR
              </span>
            </div>

            <p className="text-sm font-bold text-[#1A4A5C] tracking-widest mb-3 uppercase">Pro · Agencia</p>
            <div className="flex items-end gap-2 flex-wrap mb-1">
              <span className="text-xl md:text-2xl font-bold text-gray-400 line-through mb-1 whitespace-nowrap">USD 29</span>
              <span className="text-4xl md:text-5xl font-black text-[#111827] whitespace-nowrap">USD 19</span>
              <span className="text-gray-400 mb-2 text-sm">/mes</span>
            </div>
            <p className="text-[#E8782E] text-sm font-bold mb-8 italic">
              🔥 ¡Oferta de lanzamiento limitada!
            </p>

            <a
              href="https://wa.me/5491121906798?text=Hola%2C%20quiero%20contratar%20PostViajes%20Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-2xl font-black text-white bg-[#E8782E] hover:bg-[#d06820] transition shadow-lg shadow-orange-200 mb-8"
            >
              Contratar Plan Pro →
            </a>

            <ul className="space-y-3.5">
              {PRO_FEATURES.map(({ text, ok }) => (
                <li key={text} className="flex items-center gap-3">
                  <IconCheck color="#1A4A5C" />
                  <span className="text-sm text-gray-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#F8FAFB] border-t border-gray-100 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8782E] font-bold text-sm tracking-widest mb-3 uppercase">Preguntas frecuentes</p>
            <h2 className="text-3xl font-black text-[#111827]">Todo lo que necesitás saber</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <p className="font-black text-[#111827] mb-2">{q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-[#111827] mb-4">¿Dudas? Hablemos.</h2>
        <p className="text-gray-500 text-lg mb-8">Escribinos por WhatsApp y te ayudamos a elegir el plan que mejor le va a tu agencia.</p>
        <a
          href="https://wa.me/5491121906798?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20PostViajes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#25D366] hover:bg-[#20BD5C] text-white font-black px-10 py-5 rounded-2xl text-xl transition shadow-xl shadow-green-100"
        >
          Escribinos por WhatsApp →
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-gray-400 text-xs text-center">
            Hecho por <span className="text-gray-600 font-medium">Emiliano Crespo</span> · © {new Date().getFullYear()}
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <Link href="/pricing" className="hover:text-[#1A4A5C]">Precios</Link>
            <Link href="/legal" className="hover:text-[#1A4A5C]">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}