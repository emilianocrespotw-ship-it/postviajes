// ─── Modal upgrade ────────────────────────────────────────────────────────────
import Link from 'next/link'
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