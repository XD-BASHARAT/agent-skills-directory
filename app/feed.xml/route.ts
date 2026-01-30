import { getSkills } from "@/lib/db/queries"
import { getSiteUrl } from "@/lib/site-url"
import { siteConfig } from "@/config/site"

export const dynamic = "force-dynamic"
export const revalidate = 3600

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatRFC822Date(date: Date): string {
  return date.toUTCString()
}

export async function GET() {
  const siteUrl = getSiteUrl()
  const { skills } = await getSkills({ perPage: 50, sortBy: "recent", status: "approved" })

  const items = skills.map((skill) => {
    const skillUrl = `${siteUrl}/${skill.owner}/skills/${skill.slug}`
    const pubDate = skill.indexedAt ?? new Date()
    const description = skill.description
      ? escapeXml(skill.description)
      : `${escapeXml(skill.name)} - Agent skill by ${escapeXml(skill.owner)}`

    return `    <item>
      <title>${escapeXml(skill.name)}</title>
      <link>${skillUrl}</link>
      <guid isPermaLink="true">${skillUrl}</guid>
      <description>${description}</description>
      <author>${escapeXml(skill.owner)}</author>
      <pubDate>${formatRFC822Date(pubDate)}</pubDate>
      <category>Agent Skills</category>
    </item>`
  })

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteConfig.name)} - ${escapeXml(siteConfig.tagline)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-US</language>
    <lastBuildDate>${formatRFC822Date(new Date())}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/brand/logo-symbol-1024.png</url>
      <title>${escapeXml(siteConfig.name)}</title>
      <link>${siteUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <ttl>60</ttl>
${items.join("\n")}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
