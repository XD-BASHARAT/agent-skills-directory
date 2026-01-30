"use client"

import * as React from "react"
import Script from "next/script"
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"

function LazyAnalytics() {
  const [shouldLoad, setShouldLoad] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    // Defer loading analytics until after initial page load
    // This improves LCP by not blocking the main thread during initial render
    if ("requestIdleCallback" in window) {
      const timer = requestIdleCallback(
        () => {
          setShouldLoad(true)
        },
        { timeout: 3000 },
      )
      return () => cancelIdleCallback(timer)
    } else {
      // Fallback for Safari
      const timer = setTimeout(() => setShouldLoad(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted || !shouldLoad) return null

  return (
    <>
      <GoogleTagManager gtmId="GTM-TJXF822R" />
      <GoogleAnalytics gaId="G-4FGK21L6LG" />
      <Script
        src="https://datafa.st/js/script.js"
        data-website-id="dfid_qaH97LcnxJX0elugDYkAa"
        data-domain="agnxi.com"
        strategy="lazyOnload"
      />
    </>
  )
}

export { LazyAnalytics }
