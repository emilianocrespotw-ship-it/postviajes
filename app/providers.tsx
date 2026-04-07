'use client'

import React from 'react'
import { SessionProvider } from "next-auth/react"
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

// Inicializamos PostHog solo en el navegador
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only', // O 'always' para capturar todo
    capture_pageview: false // Lo manejaremos manualmente después si hace falta
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </PostHogProvider>
  )
}