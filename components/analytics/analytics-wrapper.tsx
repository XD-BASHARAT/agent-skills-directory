"use client"

import * as React from "react"
import dynamic from "next/dynamic"

const LazyAnalytics = dynamic(
  () => import("@/components/analytics/lazy-analytics").then((mod) => mod.LazyAnalytics),
  { ssr: false },
)

function AnalyticsWrapper() {
  return <LazyAnalytics />
}

export { AnalyticsWrapper }
