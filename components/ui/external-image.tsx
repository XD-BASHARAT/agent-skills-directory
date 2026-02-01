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

function getCloudflareUrl(src: string, width: number, quality: number = 80, isLocalhost: boolean = false): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return src
  if (isLocalhost) return src
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://agnxi.com"
  return `${baseUrl}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${src}`
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
  // Calculate initial URL on server (always use Cloudflare to ensure consistency)
  // On client, we'll check localhost in useEffect and update if needed
  const initialUrl = React.useMemo(() => getCloudflareUrl(src, width, quality, false), [src, width, quality])
  const [imgSrc, setImgSrc] = React.useState(initialUrl)
  const [useFallback, setUseFallback] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const srcRef = React.useRef(src)

  // Update ref when src changes
  React.useEffect(() => {
    srcRef.current = src
  }, [src])

  const handleError = React.useCallback(() => {
    if (!useFallback) {
      setUseFallback(true)
      setImgSrc(srcRef.current)
    } else if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    } else {
      setHasError(true)
    }
  }, [useFallback, fallbackSrc, imgSrc])

  React.useEffect(() => {
    setIsMounted(true)
    // Check if we're on localhost and update URL if needed
    // Only update after mount to avoid hydration mismatch
    const isLocalhost = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    
    if (isLocalhost && imgSrc !== srcRef.current) {
      // On localhost, use original URL
      setImgSrc(srcRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  if (hasError) {
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
