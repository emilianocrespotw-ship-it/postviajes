'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import posthog from "posthog-js"

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || !posthog) return

    // ---- PAGEVIEW AUTOMÁTICO ----
    let url = window.origin + pathname
    if (searchParams.toString()) {
      url = url + `?${searchParams.toString()}`
    }
    posthog.capture('$pageview', { '$current_url': url })

    // ---- PAGEVIEW MANUAL PARA /crear ----
    if (pathname === "/crear") {
      posthog.capture('pageview_crear')
    }

  }, [pathname, searchParams])

  return null
}

export default function PostHogPageviewWrapper() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}
