import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PostViajes – De flyer a post publicado en segundos',
  description: 'La herramienta de social media para agencias de viajes. Subís el flyer, la IA genera el texto y publica solo.',
  openGraph: {
    title: 'PostViajes',
    description: 'De flyer a post publicado en segundos con IA',
    siteName: 'PostViajes',
  },
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
