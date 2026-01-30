"use client"

import * as React from "react"
import { ErrorBoundary } from "@/components/error-boundary"

type ErrorPageProps = {
  error: Error
  reset: () => void
}

export default function ErrorPage({ error, reset }: Readonly<ErrorPageProps>) {
  return <ErrorBoundary error={error} reset={reset} />
}
