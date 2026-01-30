import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site-url"
import { siteConfig } from "@/config/site"

const siteName = siteConfig.name
const siteTagline = siteConfig.tagline
const siteFullName = `${siteName} - ${siteTagline}`
const siteDescription = siteConfig.description
const siteKeywords = siteConfig.keywords

const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: siteFullName,
}

export const baseMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteFullName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: siteName,
  creator: siteName,
  publisher: siteName,
  authors: [{ name: siteName, url: getSiteUrl() }],
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/logo-symbol.svg", type: "image/svg+xml" },
      { url: "/brand/logo-symbol-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: "/brand/logo-symbol-1024.png", sizes: "180x180", type: "image/png" },
    ],
  },
  category: "technology",
  classification: "AI Tools, Developer Tools, Agent Skills Marketplace",
  openGraph: {
    title: siteFullName,
    description: siteDescription,
    url: getSiteUrl(),
    siteName,
    locale: "en_US",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteFullName,
    description: siteDescription,
    images: [defaultOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: getSiteUrl(),
    types: {
      "application/rss+xml": `${getSiteUrl()}/feed.xml`,
      "application/atom+xml": `${getSiteUrl()}/atom.xml`,
    },
  },
  other: {
    "google-site-verification": "",
    "msvalidate.01": "",
  },
}

type BuildMetadataOptions = Readonly<{
  title: Metadata["title"]
  description: string
  path: string
  openGraphType?: "website" | "article" | "profile"
  noIndex?: boolean
  keywords?: string[]
  publishedTime?: string
  modifiedTime?: string
  author?: string
}>

function resolveTitle(title: Metadata["title"]) {
  if (!title) return siteFullName
  if (typeof title === "string") return title
  if (typeof title === "object") {
    if ("absolute" in title && title.absolute) return title.absolute
    if ("default" in title && title.default) return title.default
  }
  return siteFullName
}

export function buildMetadata({
  title,
  description,
  path,
  openGraphType = "website",
  noIndex = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  author,
}: BuildMetadataOptions): Metadata {
  const resolvedTitle = resolveTitle(title)
  const siteUrl = getSiteUrl()
  const url = new URL(path, siteUrl).toString()
  const mergedKeywords = [...siteKeywords, ...keywords]

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName,
      locale: "en_US",
      type: openGraphType,
      images: [
        {
          ...defaultOgImage,
          alt: resolvedTitle,
        },
      ],
      ...(openGraphType === "article" && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
      }),
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: resolvedTitle,
      description,
      images: [defaultOgImage.url],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
          },
        }
      : {}),
  }
}

export function buildSkillMetadata(skill: {
  name: string
  description?: string | null
  owner: string
  slug: string
  stars?: number | null
  compatibility?: string | null
  repoUpdatedAt?: Date | null
}): Metadata {
  const title = `${skill.name} - Agent Skill by ${skill.owner}`
  const description = skill.description 
    ? `${skill.description} A curated skill for AI coding agents like Claude Code, Cursor, and Windsurf.`
    : `${skill.name} by ${skill.owner} — a quality-reviewed skill for AI coding agents. Works with Claude Code, Cursor, Windsurf, and more.`
  
  const keywords = [
    skill.name,
    `${skill.name} skill`,
    skill.owner,
    skill.compatibility ?? "Claude Code",
    "curated agent skill",
    "AI coding",
  ].filter(Boolean)

  return buildMetadata({
    title,
    description,
    path: `/${skill.owner}/skills/${skill.slug}`,
    openGraphType: "article",
    keywords,
    modifiedTime: skill.repoUpdatedAt?.toISOString(),
    author: skill.owner,
  })
}

export function buildCategoryMetadata(category: {
  name: string
  slug: string
  description?: string | null
  skillCount?: number
}): Metadata {
  const count = category.skillCount ?? 0
  const title = `${category.name} Agent Skills`
  const description = category.description 
    ? `${category.description} Browse ${count}+ ${category.name.toLowerCase()} skills for AI coding agents.`
    : `Discover ${count}+ ${category.name.toLowerCase()} skills for AI coding agents like Claude Code, Cursor, and Windsurf.`

  return buildMetadata({
    title,
    description,
    path: `/categories/${category.slug}`,
    keywords: [category.name, `${category.name} skills`, `${category.name} AI tools`],
  })
}

export function buildOwnerMetadata(owner: {
  name: string
  skillCount?: number
  avatarUrl?: string | null
}): Metadata {
  const count = owner.skillCount ?? 0
  const title = `${owner.name} - Agent Skills Developer`
  const description = `Browse ${count}+ agent skills by ${owner.name}. Find production-ready AI coding skills compatible with Claude Code, Cursor, and Windsurf.`

  return buildMetadata({
    title,
    description,
    path: `/${owner.name}`,
    openGraphType: "profile",
    keywords: [owner.name, `${owner.name} skills`],
  })
}

export { siteDescription, siteName, siteFullName, siteTagline }
