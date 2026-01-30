import type { MetadataRoute } from "next"
import { getCategories, getSkillsForSitemap } from "@/lib/db/queries"
import { getSiteUrl } from "@/lib/site-url"

export const dynamic = "force-dynamic"
export const revalidate = 3600

const MAX_URLS_PER_SITEMAP = 50000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/skills`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${siteUrl}/categories`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ]

  try {
    const [categories, skills] = await Promise.all([
      getCategories(),
      getSkillsForSitemap(),
    ])

    const categoryRoutes = categories.map((category): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }))

    const ownerMap = new Map<string, Date>()
    for (const skill of skills) {
      const existing = ownerMap.get(skill.owner)
      const skillDate = skill.repoUpdatedAt ?? skill.updatedAt ?? skill.indexedAt ?? now
      if (!existing || skillDate > existing) {
        ownerMap.set(skill.owner, skillDate)
      }
    }
    
    const ownerRoutes = Array.from(ownerMap.entries()).map(([owner, lastMod]): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/${owner}`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.6,
    }))

    const skillRoutes = skills
      .slice(0, MAX_URLS_PER_SITEMAP - staticRoutes.length - categoryRoutes.length - ownerRoutes.length)
      .map((skill): MetadataRoute.Sitemap[number] => ({
        url: `${siteUrl}/${skill.owner}/skills/${skill.slug}`,
        lastModified: skill.repoUpdatedAt ?? skill.updatedAt ?? skill.indexedAt ?? now,
        changeFrequency: "weekly",
        priority: skill.stars && skill.stars > 100 ? 0.75 : 0.65,
      }))

    return [...staticRoutes, ...categoryRoutes, ...ownerRoutes, ...skillRoutes]
  } catch {
    return staticRoutes
  }
}
