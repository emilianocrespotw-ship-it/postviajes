import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
// @ts-ignore
import './globals.css'
import { Providers } from './providers'

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
          {children}
        </Providers>
      </body>
    </html>
  )
}