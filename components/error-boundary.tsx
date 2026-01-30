"use client"

import * as React from "react"
import { useEffect } from "react"
import { Container } from "@/components/layouts/container"

type ErrorBoundaryProps = {
  error: Error
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error)
  }, [error])

  return (
    <Container>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            {error.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Refresh Page
          </button>
          <button
            onClick={reset}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </Container>
  )
}
