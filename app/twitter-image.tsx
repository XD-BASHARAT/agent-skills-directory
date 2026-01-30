import * as React from "react"
import { ImageResponse } from "next/og"
import { siteDescription, siteName } from "@/lib/seo"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #111827 0%, #1f2937 60%, #0f172a 100%)",
          color: "#f8fafc",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.4,
            maxWidth: 900,
            color: "#d1d5db",
          }}
        >
          {siteDescription}
        </div>
      </div>
    ),
    size
  )
}
