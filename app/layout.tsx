import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
// @ts-ignore
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PostViajes ✨ De flyer a post publicado en segundos',
  description: 'Herramienta de social media para agencias de viajes.',
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