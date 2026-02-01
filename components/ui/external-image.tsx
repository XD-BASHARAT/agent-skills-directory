"use client"

import * as React from "react"

interface ExternalImageProps {
  src: string
  alt: string
  width: number
  height: number
  fallbackSrc?: string
  className?: string
  quality?: number
}

function getCloudflareUrl(src: string, width: number, quality: number = 80, baseUrl?: string): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return src
  if (!baseUrl) return src
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")
  return `${normalizedBaseUrl}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${src}`
}

function ExternalImage({ 
  src, 
  alt, 
  width, 
  height, 
  fallbackSrc, 
  className,
  quality = 80,
}: ExternalImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src)
  const [phase, setPhase] = React.useState<"original" | "cdn" | "fallback" | "error">("original")
  const srcRef = React.useRef(src)

  // Update ref when src changes
  React.useEffect(() => {
    srcRef.current = src
    setImgSrc(src)
    setPhase("original")
  }, [src])

  const handleError = React.useCallback(() => {
    if (phase === "cdn") {
      setPhase("original")
      setImgSrc(srcRef.current)
      return
    }

    if (phase === "original" && fallbackSrc) {
      setPhase("fallback")
      setImgSrc(fallbackSrc)
      return
    }

    setPhase("error")
  }, [phase, fallbackSrc])

  React.useEffect(() => {
    // Resolve CDN URL after mount to avoid hydration mismatches.
    const isLocalhost = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

    if (isLocalhost) return

    const cloudflareUrl = getCloudflareUrl(srcRef.current, width, quality, window.location.origin)
    if (cloudflareUrl !== srcRef.current) {
      setPhase("cdn")
      setImgSrc(cloudflareUrl)
    }
  }, [src, width, quality])

  if (phase === "error") {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground text-xs ${className}`}
        style={{ width, height }}
      >
        Image unavailable
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      onError={handleError}
      className={className}
      loading="lazy"
      decoding="async"
      suppressHydrationWarning
    />
  )
}

export { ExternalImage }
