// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React, { Suspense } from 'react' // Importamos Suspense
import './globals.css'
import { Providers } from './providers'
import Navbar from '../components/Navbar'
import PostHogPageviewWrapper from './PostHogPageView' // Importamos el nuevo componente

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PostViajes — Flyer a Post en segundos',
  description: 'La herramienta definitiva para agencias de viajes...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
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