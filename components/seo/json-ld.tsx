import * as React from "react"

type JsonLdProps = Readonly<{
  data: Record<string, unknown>
}>

function toSafeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: toSafeJsonLd(data),
      }}
    />
  )
}

export { JsonLd }
