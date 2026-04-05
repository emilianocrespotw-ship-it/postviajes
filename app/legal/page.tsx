import Link from 'next/link'

function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight text-xl ${className}`}>
      <span style={{ color: '#E8782E' }}>Post</span>
      <span style={{ color: '#1A4A5C' }}>Viajes</span>
    </span>
  )
}

const SECTIONS = [
  {
    title: '1. Descripción del servicio',
    body: `PostViajes es una plataforma web que permite a agencias de viajes y operadores turísticos transformar flyers de paquetes en publicaciones listas para redes sociales (Instagram, Facebook y WhatsApp), utilizando inteligencia artificial para la generación de texto e imágenes.

El servicio se ofrece en dos modalidades: un plan gratuito con funcionalidad limitada y un plan Pro con acceso sin restricciones, sujeto a suscripción mensual.`,
  },
  {
    title: '2. Contratación del Plan Pro',
    body: `El Plan Pro tiene un costo de USD 19 (veintinueve dólares estadounidenses) premcio promocional por mes por cuenta. El precio puede ser abonado en pesos argentinos al tipo de cambio vigente al momento del pago, o en dólares según el método acordado.

La contratación se realiza a través de WhatsApp u otro canal habilitado por PostViajes. El acceso al Plan Pro se activa una vez confirmado el pago. PostViajes se reserva el derecho de modificar el precio con un aviso previo de al menos 30 días al usuario activo.`,
  },
  {
    title: '3. Forma de pago',
    body: `El pago se procesa a través de MercadoPago u otro medio que PostViajes indique. El usuario es responsable de completar el pago dentro del plazo acordado. Ante falta de pago, PostViajes puede suspender o cancelar el acceso al Plan Pro sin previo aviso, conservando el usuario la posibilidad de acceder al plan gratuito.`,
  },
  {
    title: '4. Cancelación y reembolsos',
    body: `El usuario puede cancelar su suscripción en cualquier momento comunicándose por WhatsApp o por correo electrónico. No se realizan reembolsos proporcionales por días no utilizados dentro de un período ya abonado. Una vez cancelada la suscripción, el acceso al Plan Pro se mantiene activo hasta el fin del período pago.

PostViajes puede cancelar una suscripción activa por incumplimiento de estos términos, sin derecho a reembolso.`,
  },
  {
    title: '5. Uso aceptable',
    body: `El usuario se compromete a utilizar PostViajes únicamente para fines legítimos relacionados con la promoción de servicios turísticos. Está prohibido:

· Usar la plataforma para generar contenido falso, engañoso o que infrinja derechos de terceros.
· Intentar acceder, copiar o redistribuir el código fuente, algoritmos o bases de datos de PostViajes.
· Revender o ceder el acceso a la cuenta a terceros sin autorización expresa.
· Usar la plataforma de forma automatizada (bots, scrapers) sin autorización.`,
  },
  {
    title: '6. Propiedad intelectual',
    body: `El software, diseño, marca y contenidos de PostViajes son propiedad de Emiliano Crespo. El usuario no adquiere ningún derecho sobre la plataforma más allá del uso personal y no exclusivo del servicio contratado.

Los textos generados por la IA a partir de los flyers del usuario son de uso libre para el usuario. PostViajes no reclama derechos sobre el contenido generado a partir de los datos aportados por el usuario.`,
  },
  {
    title: '7. Privacidad y datos',
    body: `PostViajes almacena únicamente los datos necesarios para la prestación del servicio: imágenes cargadas, textos generados y datos de contacto provistos voluntariamente. No se venden datos a terceros.

Las imágenes de destinos utilizadas provienen de Pexels y Unsplash, plataformas con licencias de uso libre. El usuario es responsable de contar con los derechos necesarios sobre las imágenes que cargue (flyers de operadores, logos, etc.).`,
  },
  {
    title: '8. Disponibilidad del servicio',
    body: `PostViajes se presta "tal como está" (as-is). Si bien se procura mantener una disponibilidad alta, no se garantiza un servicio ininterrumpido. PostViajes no se responsabiliza por pérdidas derivadas de interrupciones temporales, errores de la IA o cambios en las APIs de terceros (Meta, Pexels, Unsplash, Anthropic).`,
  },
  {
    title: '9. Modificaciones a los términos',
    body: `PostViajes puede actualizar estos términos en cualquier momento. Los cambios significativos serán comunicados a los usuarios activos con al menos 15 días de anticipación. El uso continuado del servicio luego de los cambios implica la aceptación de los nuevos términos.`,
  },
  {
    title: '10. Legislación aplicable',
    body: `Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero que pudiera corresponder.`,
  },
  {
    title: '11. Contacto',
    body: `Para consultas, cancelaciones o reclamos, el usuario puede comunicarse a través de:

WhatsApp: +54 9 11 2190-6798
Email: emiliano.crespo.tw@gmail.com`,
  },
]

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <Link href="/#como-funciona" className="hover:text-[#1A4A5C] transition">Cómo funciona</Link>
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

      {/* ── CONTENIDO ── */}
      <main className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-12">
          <p className="text-[#E8782E] font-bold text-sm tracking-widest mb-3">LEGALES</p>
          <h1 className="text-4xl font-black text-[#111827] mb-3">Términos y Condiciones</h1>
          <p className="text-gray-400 text-sm">
            Última actualización: abril de 2026 · Aplicables al Plan Gratuito y Plan Pro de PostViajes
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-lg font-black text-[#1A4A5C] mb-3">{title}</h2>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{body}</div>
            </section>
          ))}
        </div>

        <div className="mt-16 p-6 bg-[#F0F7F9] border border-[#dceef4] rounded-2xl text-center">
          <p className="text-[#1A4A5C] font-black mb-2">¿Alguna pregunta sobre los términos?</p>
          <p className="text-gray-500 text-sm mb-4">Escribinos y te respondemos.</p>
          <a
            href="https://wa.me/5491121906798?text=Hola%2C%20tengo%20una%20consulta%20sobre%20los%20t%C3%A9rminos%20de%20PostViajes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] hover:bg-[#20BD5C] text-white font-bold px-6 py-3 rounded-xl transition text-sm"
          >
            Consultá por WhatsApp →
          </a>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-gray-400 text-xs text-center">
            Hecho por <span className="text-gray-600 font-medium">Emiliano Crespo</span> · © {new Date().getFullYear()}
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <Link href="/pricing" className="hover:text-[#1A4A5C] transition">Precios</Link>
            <Link href="/legal" className="hover:text-[#1A4A5C] transition font-medium text-gray-600">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
