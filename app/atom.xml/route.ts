import { getSkills } from "@/lib/db/queries"
import { getSiteUrl } from "@/lib/site-url"
import { siteConfig } from "@/config/site"
import { getExternalUrl } from "@/lib/utils"

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

function formatISO8601(date: Date): string {
  return date.toISOString()
}

export async function GET() {
  const siteUrl = getSiteUrl()
  const now = new Date()
  const { skills } = await getSkills({ perPage: 50, sortBy: "recent", status: "approved" })

  const entries = skills.map((skill) => {
    const skillUrl = `${siteUrl}/${skill.owner}/skills/${skill.slug}`
    const published = skill.indexedAt ?? now
    const updated = skill.repoUpdatedAt ?? skill.fileUpdatedAt ?? published
    const summary = skill.description
      ? escapeXml(skill.description)
      : `${escapeXml(skill.name)} - Agent skill by ${escapeXml(skill.owner)}`

    return `  <entry>
    <id>${skillUrl}</id>
    <title>${escapeXml(skill.name)}</title>
    <link href="${skillUrl}" rel="alternate" type="text/html"/>
    <published>${formatISO8601(published)}</published>
    <updated>${formatISO8601(updated)}</updated>
    <author>
      <name>${escapeXml(skill.owner)}</name>
      <uri>${getExternalUrl(`https://github.com/${escapeXml(skill.owner)}`)}</uri>
    </author>
    <summary type="text">${summary}</summary>
    <category term="agent-skills" label="Agent Skills"/>
    ${skill.stars ? `<link href="${getExternalUrl(`https://github.com/${skill.owner}/${skill.repo}`)}" rel="via" title="GitHub Repository"/>` : ""}
  </entry>`
  })

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${siteUrl}/</id>
  <title>${escapeXml(siteConfig.name)} - ${escapeXml(siteConfig.tagline)}</title>
  <subtitle>${escapeXml(siteConfig.description)}</subtitle>
  <link href="${siteUrl}" rel="alternate" type="text/html"/>
  <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml"/>
  <updated>${formatISO8601(now)}</updated>
  <icon>${siteUrl}/favicon.ico</icon>
  <logo>${siteUrl}/brand/logo-symbol-1024.png</logo>
  <rights>© ${now.getFullYear()} ${escapeXml(siteConfig.name)}</rights>
  <generator uri="${getExternalUrl("https://nextjs.org")}">Next.js</generator>
${entries.join("\n")}
</feed>`

  return new Response(atom, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
