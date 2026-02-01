import * as React from "react"
import { getSiteUrl } from "@/lib/site-url"
import { siteName, siteDescription, siteFullName } from "@/lib/seo"
import { siteConfig } from "@/config/site"
import { JsonLd } from "@/components/seo/json-ld"

function SiteStructuredData() {
  const siteUrl = getSiteUrl()

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
    ].filter(Boolean),
    description: siteDescription,
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteFullName,
    url: siteUrl,
    description: siteDescription,
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/skills?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
    inLanguage: "en-US",
  }

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteFullName,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    description: siteDescription,
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Search SKILL.md skills by name and category",
      "See repo signals like stars and recency",
      "Install commands for Claude Code, Cursor, Windsurf, Amp",
      "Open SKILL.md standard",
      "Free to use",
    ],
  }

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular Agent Skills Categories",
    itemListElement: [
      { position: 1, name: "Development Tools", url: `${siteUrl}/categories/development` },
      { position: 2, name: "Data & AI", url: `${siteUrl}/categories/data-ai` },
      { position: 3, name: "DevOps", url: `${siteUrl}/categories/devops` },
      { position: 4, name: "Testing & Security", url: `${siteUrl}/categories/testing-security` },
      { position: 5, name: "Documentation", url: `${siteUrl}/categories/documentation` },
    ].map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  }

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
      <JsonLd data={softwareApplication} />
      <JsonLd data={itemList} />
    </>
  )
}

export { SiteStructuredData }
