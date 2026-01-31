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

function isLocalhost(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
}

function getCloudflareUrl(src: string, width: number, quality: number = 80): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return src
  if (isLocalhost()) return src
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? ""
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
  const [imgSrc, setImgSrc] = React.useState(() => getCloudflareUrl(src, width, quality))
  const [useFallback, setUseFallback] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const handleError = React.useCallback(() => {
    if (!useFallback) {
      setUseFallback(true)
      setImgSrc(src)
    } else if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    } else {
      setHasError(true)
    }
  }, [useFallback, src, fallbackSrc, imgSrc])

  React.useEffect(() => {
    setImgSrc(getCloudflareUrl(src, width, quality))
    setUseFallback(false)
    setHasError(false)
  }, [src, width, quality])

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
    />
  )
}

export { ExternalImage }
