import * as React from "react"

type JsonLdProps = Readonly<{
  data: Record<string, unknown>
}>

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

export { JsonLd }
