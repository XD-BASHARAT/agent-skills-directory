import * as React from "react"
import { getSiteUrl } from "@/lib/site-url"
import { JsonLd } from "@/components/seo/json-ld"

type BreadcrumbItem = {
  name: string
  url: string
}

type BreadcrumbsJsonLdProps = Readonly<{
  items: BreadcrumbItem[]
}>

function BreadcrumbsJsonLd({ items }: BreadcrumbsJsonLdProps) {
  const siteUrl = getSiteUrl()

  const itemListElement = items.map((item, index) => {
    const itemUrl = new URL(item.url, siteUrl).toString()
    return {
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: {
        "@type": "WebPage",
        "@id": itemUrl,
        url: itemUrl,
        name: item.name,
      },
    }
  })

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  }

  return <JsonLd data={data} />
}

export { BreadcrumbsJsonLd }
