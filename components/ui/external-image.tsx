"use client"

import * as React from "react"
import Image from "next/image"

interface ExternalImageProps {
  src: string
  alt: string
  width: number
  height: number
  fallbackSrc?: string
  className?: string
  unoptimized?: boolean
}

function ExternalImage({ 
  src, 
  alt, 
  width, 
  height, 
  fallbackSrc, 
  className,
  unoptimized = true,
  ...props 
}: ExternalImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src)
  const [hasError, setHasError] = React.useState(false)

  const handleError = React.useCallback(() => {
    setHasError(true)
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(false)
    }
  }, [fallbackSrc, imgSrc])

  // Reset state when src changes
  React.useEffect(() => {
    setImgSrc(src)
    setHasError(false)
  }, [src])

  if (hasError && !fallbackSrc) {
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
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      unoptimized={unoptimized}
      onError={handleError}
      className={className}
      style={{ height: "auto" }}
      {...props}
    />
  )
}

export { ExternalImage }
