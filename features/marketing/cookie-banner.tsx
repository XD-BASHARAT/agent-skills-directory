"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_COOKIE = "cookie_consent"
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function readCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`
}

function CookieBanner() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    const current = readCookie(CONSENT_COOKIE)
    if (!current) {
      setIsVisible(true)
    }
  }, [])

  const handleConsent = (value: "accepted" | "rejected") => {
    writeCookie(CONSENT_COOKIE, value)
    setIsVisible(false)
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted || !isVisible) {
    return null
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:inset-x-auto sm:right-4 sm:left-auto sm:bottom-4 sm:max-w-md">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Cookies & Privacy</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies to run the site. With your consent, we may use
            non-essential cookies to improve the experience. You can change your choice
            anytime in our{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleConsent("rejected")}
            className="h-8 px-3 text-xs"
          >
            Reject non-essential
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleConsent("accepted")}
            className="h-8 px-3 text-xs"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}

export { CookieBanner }
