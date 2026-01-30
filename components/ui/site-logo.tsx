"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface SiteLogoProps extends React.ComponentProps<"div"> {
  size?: number | string
}

function SiteLogo({ size = 32, className, ...props }: SiteLogoProps) {
  const numericSize = typeof size === "string" ? parseInt(size, 10) : size

  return (
    <div
      className={cn("shrink-0", className)}
      style={{ width: numericSize, height: numericSize }}
      {...props}
    >
      <Image
        src="/brand/logo-symbol.svg"
        alt="AGNXI Logo"
        width={numericSize}
        height={numericSize}
        className="size-full"
        priority
      />
    </div>
  )
}

function SiteLogoMark({ size = 32, className, ...props }: SiteLogoProps) {
  const numericSize = typeof size === "string" ? parseInt(size, 10) : size

  return (
    <div
      className={cn("shrink-0", className)}
      style={{ width: numericSize, height: numericSize }}
      {...props}
    >
      <Image
        src="/brand/logo-symbol.svg"
        alt="AGNXI Logo"
        width={numericSize}
        height={numericSize}
        className="size-full"
      />
    </div>
  )
}

export { SiteLogo, SiteLogoMark, type SiteLogoProps }
