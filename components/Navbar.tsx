'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

// Reutilizamos tu Logo para que sea consistente
function Logo() {
  return (
    <span className="font-black tracking-tight text-xl">
      <span style={{ color: '#E8782E' }}>Post</span>
      <span style={{ color: '#1A4A5C' }}>Viajes</span>
    </span>
  )
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: 'Cómo funciona', href: '/#como-funciona' },
    { name: 'Beneficios', href: '/#beneficios' },
    { name: 'Precios', href: '/pricing' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" onClick={() => setIsOpen(false)}>
          <Logo />
        </Link>

        {/* NAVEGACIÓN DESKTOP (Oculta en móviles) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-[#1A4A5C] transition">
              {link.name}
            </Link>
          ))}
          <Link
            href="/crear"
            className="bg-[#1A4A5C] hover:bg-[#2A6A82] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            Probá gratis →
          </Link>
        </nav>

        {/* BOTÓN HAMBURGUESA (Solo visible en móviles) */}
        <button 
          className="md:hidden p-2 text-gray-600 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE (Animado) */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col p-6 gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="text-xl font-bold text-gray-800 hover:text-[#1A4A5C]"
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-gray-100" />
            <Link
              href="/crear"
              onClick={() => setIsOpen(false)}
              className="bg-[#1A4A5C] text-white text-center py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition"
            >
              Probá gratis ahora
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}