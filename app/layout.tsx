// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { playfair, unbounded } from '@/lib/fonts'
import React, { Suspense } from 'react' // Importamos Suspense
import './globals.css'
import { Providers } from './providers'
import Navbar from '../components/Navbar'
import PostHogPageviewWrapper from './PostHogPageView' // Importamos el nuevo componente

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PostViajes — Flyer a Post en segundos',
  description: 'La herramienta definitiva para agencias de viajes. Convertí cualquier flyer en un post profesional para Instagram y Facebook en segundos, con IA.',
  metadataBase: new URL('https://postviajes.com.ar'),
  openGraph: {
    title: 'PostViajes — Flyer a Post en segundos',
    description: 'Convertí cualquier flyer en un post profesional para Instagram y Facebook en segundos, con IA.',
    url: 'https://postviajes.com.ar',
    siteName: 'PostViajes',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostViajes — Flyer a Post en segundos',
    description: 'Convertí cualquier flyer en un post profesional para redes sociales en segundos, con IA.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${playfair.variable} ${unbounded.variable}`}>
        <Providers>
          {/* El rastreador DEBE estar dentro de Providers */}
          <PostHogPageviewWrapper />
          
          <Navbar /> 
          {children}
        </Providers>
      </body>
    </html>
  )
}