import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { Providers } from './providers'
import Navbar from '../components/Navbar'

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
          <Navbar /> 
          {children}
        </Providers>
      </body>
    </html>
  )
}