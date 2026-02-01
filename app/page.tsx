import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Search, Star, Terminal } from "lucide-react"
import { Hero } from "@/features/marketing/hero"
import { SkillsGrid } from "@/features/skills/skills-grid"
import { Container } from "@/components/layouts/container"
import { FaqJsonLd } from "@/components/seo/faq-json-ld"
import { Button } from "@/components/ui/button"
import { siteDescription, siteFullName } from "@/lib/seo"
import { getSiteUrl } from "@/lib/site-url"
import { getStats } from "@/lib/stats"
import { getCategories, getSkills, type GetSkillsOptions } from "@/lib/db/queries"
import { getHealthStatus } from "@/lib/health"
import { siteConfig } from "@/config/site"
import { HomeClient } from "@/features/marketing/home-client"

export const metadata: Metadata = {
  title: {
    absolute: siteFullName,
  },
  description: siteDescription,
  keywords: [
    ...siteConfig.keywords,
    "agent skills directory",
    "find agent skills",
    "SKILL.md files",
    "search agent skills",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteFullName,
    description: siteDescription,
    url: getSiteUrl(),
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteFullName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteFullName,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
}

function SkillsGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-9 bg-muted rounded-md animate-pulse motion-reduce:animate-none" />
        <div className="hidden sm:flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-7 bg-muted rounded-md animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border-subtle bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

const DEFAULT_PAGE_SIZE = 12 // Reduced from 32 for better performance and lower egress

const allowedSorts: NonNullable<GetSkillsOptions["sortBy"]>[] = [
  "recent",
  "stars_desc",
  "name_asc",
  "name_desc",
  "last_commit",
]

function parseSort(value: string | undefined): NonNullable<GetSkillsOptions["sortBy"]> {
  if (value && allowedSorts.includes(value as NonNullable<GetSkillsOptions["sortBy"]>)) {
    return value as NonNullable<GetSkillsOptions["sortBy"]>
  }

  return "last_commit"
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  if (typeof value !== "string") return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseCategoryList(value: string | string[] | undefined) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const searchQuery = typeof params?.q === "string" ? params.q : undefined
  const sortParam = typeof params?.sort === "string" ? params.sort : undefined
  const sortBy = parseSort(sortParam)
  const page = parseNumber(params?.page, 1)
  const categoryList = parseCategoryList(params?.categories)

  const [stats, categories, skillsData, healthStatus] = await Promise.all([
    getStats(),
    getCategories(),
    getSkills({
      query: searchQuery,
      page,
      perPage: DEFAULT_PAGE_SIZE,
      descriptionLength: 200,
      sortBy,
      categoryList,
    }),
    getHealthStatus(),
  ])

  return (
    <>
      <FaqJsonLd />
      <Container>
        <HomeClient />
        <Hero stats={stats} healthStatus={healthStatus} />
        <section
          aria-labelledby="agent-skills-overview"
          className="rounded-xl border border-border-subtle bg-card/30 p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">

              <h2 id="agent-skills-overview" className="text-base font-semibold">
                What are agent skills?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Agent skills are SKILL.md workflows that teach coding assistants how to complete repeatable tasks. AGNXI indexes public agent skills, shows repo signals, and lets you install the workflow that fits your tool.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/agent-skills">Read the Agent Skills Guide</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/skills">Browse Agent Skills</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:w-[300px]">
              <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Search className="size-3.5 text-primary" aria-hidden="true" />
                  Discover
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Find agent skills for Claude Code, Cursor, Windsurf, Amp, and more.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Star className="size-3.5 text-amber-500" aria-hidden="true" />
                  Compare
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review stars, forks, and recent updates before you install.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Terminal className="size-3.5 text-emerald-500" aria-hidden="true" />
                  Install
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy the install command and run it in your tool or terminal.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section aria-labelledby="featured-skills-heading" className="space-y-4">
          <h2 id="featured-skills-heading" className="sr-only">
            Featured Agent Skills
          </h2>
          <React.Suspense fallback={<SkillsGridSkeleton />}>
            <SkillsGrid initialData={skillsData} initialCategories={categories} />
          </React.Suspense>
        </section>
      </Container>
    </>
  )
}
