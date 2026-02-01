import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Star, GitFork, Boxes, ShieldCheck, Trophy, ChevronRight } from "lucide-react"

import { getOwnerRankings, type OwnerRanking } from "@/lib/db/queries"
import { buildMetadata } from "@/lib/seo"
import { Container } from "@/components/layouts/container"
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-json-ld"
import { cn } from "@/lib/utils"
import { RankingSortTabs } from "./ranking-sort-tabs"

export const metadata: Metadata = buildMetadata({
  title: "Top Contributors Ranking",
  description:
    "See contributors ranked by stars, forks, and number of published skills.",
  path: "/ranking",
  keywords: ["ranking", "leaderboard", "top contributors", "skill authors", "maintainers"],
})

type SearchParams = Promise<{
  sort?: string
}>

type PageProps = {
  searchParams: SearchParams
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`
  }
  return num.toString()
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20">
        <Trophy className="size-5" aria-hidden="true" />
        <span className="sr-only">1</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 text-white font-bold text-sm shadow-lg shadow-slate-400/20">
        2
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20">
        3
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center size-10 rounded-xl bg-muted/50 text-muted-foreground font-semibold text-sm tabular-nums border border-border/40">
      {rank}
    </div>
  )
}

function TopThreeCard({ owner, rank }: { owner: OwnerRanking; rank: number }) {
  const initials = owner.owner.slice(0, 2).toUpperCase()
  
  const gradients = {
    1: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
    2: "from-slate-400/10 via-slate-400/5 to-transparent border-slate-400/20",
    3: "from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20",
  }

  return (
    <Link
      href={`/${owner.owner}`}
      className={cn(
        "group relative flex flex-col items-center p-5 rounded-2xl border backdrop-blur-sm",
        "bg-gradient-to-b transition-[transform,background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none motion-reduce:transform-none",
        "hover:scale-[1.02] hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        gradients[rank as 1 | 2 | 3]
      )}
    >
      {/* Rank Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <RankBadge rank={rank} />
      </div>

      {/* Avatar */}
      <div className={cn(
        "relative mt-4 rounded-2xl overflow-hidden bg-muted border-2",
        rank === 1 ? "size-20 border-amber-500/30" : "size-16 border-border/50"
      )}>
        {owner.avatarUrl ? (
          <Image src={owner.avatarUrl} alt={`${owner.owner} avatar`} fill sizes={rank === 1 ? "80px" : "64px"} className="object-cover" />
        ) : (
          <div className="flex items-center justify-center size-full">
            <span className="text-lg font-semibold text-muted-foreground">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 text-center space-y-1">
        <div className="flex items-center justify-center gap-1">
          <h3 className="font-semibold truncate max-w-[120px] group-hover:text-primary transition-colors">
            {owner.owner}
          </h3>
          {owner.hasVerified && (
            <span className="inline-flex items-center">
              <ShieldCheck className="size-4 shrink-0 text-blue-500" aria-hidden="true" />
              <span className="sr-only">Verified organization</span>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {owner.totalSkills} skill{owner.totalSkills !== 1 && "s"}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40 w-full justify-center">
        <div className="flex items-center gap-1">
          <Star className="size-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span className="text-sm font-bold tabular-nums">{formatNumber(owner.totalStars)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <GitFork className="size-3.5" aria-hidden="true" />
          <span className="text-sm tabular-nums">{formatNumber(owner.totalForks)}</span>
        </div>
      </div>
    </Link>
  )
}

function RankingRow({ owner, rank }: { owner: OwnerRanking; rank: number }) {
  const initials = owner.owner.slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/${owner.owner}`}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl transition-[background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none motion-reduce:transform-none",
        "hover:bg-card/50 hover:border-border/60",
        "border border-transparent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <RankBadge rank={rank} />

      {/* Avatar */}
      <div className="relative size-10 overflow-hidden rounded-lg bg-muted shrink-0">
        {owner.avatarUrl ? (
          <Image src={owner.avatarUrl} alt={`${owner.owner} avatar`} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="flex items-center justify-center size-full">
            <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
          </div>
        )}
      </div>

      {/* Owner Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {owner.owner}
          </h3>
          {owner.hasVerified && (
            <span className="inline-flex items-center">
              <ShieldCheck className="size-3.5 shrink-0 text-blue-500" aria-hidden="true" />
              <span className="sr-only">Verified organization</span>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {owner.totalSkills} skill{owner.totalSkills !== 1 && "s"}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <Star className="size-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span className="text-sm font-medium tabular-nums">{formatNumber(owner.totalStars)}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
          <GitFork className="size-3.5" aria-hidden="true" />
          <span className="text-sm tabular-nums">{formatNumber(owner.totalForks)}</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-muted-foreground">
          <Boxes className="size-3.5" aria-hidden="true" />
          <span className="text-sm tabular-nums">{owner.totalSkills}</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors motion-reduce:transition-none" aria-hidden="true" />
      </div>
    </Link>
  )
}

export default async function RankingPage({ searchParams }: PageProps) {
  const { sort } = await searchParams
  const sortBy = sort === "skills" || sort === "forks" ? sort : "stars"

  const owners = await getOwnerRankings({ sortBy, limit: 100 })
  const topThree = owners.slice(0, 3)
  const rest = owners.slice(3)

  return (
    <Container>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Ranking", url: "/ranking" },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="text-foreground">Ranking</span>
      </nav>

      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Top Contributors
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Ranked by stars, forks, and published skills
        </p>
      </header>

      <RankingSortTabs currentSort={sortBy} />

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* 2nd Place */}
          <div className="pt-6">
            <TopThreeCard owner={topThree[1]} rank={2} />
          </div>
          {/* 1st Place */}
          <div>
            <TopThreeCard owner={topThree[0]} rank={1} />
          </div>
          {/* 3rd Place */}
          <div className="pt-6">
            <TopThreeCard owner={topThree[2]} rank={3} />
          </div>
        </div>
      )}

      {/* Rest of Rankings */}
      {rest.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm divide-y divide-border/40">
          {rest.map((owner, index) => (
            <RankingRow key={owner.owner} owner={owner} rank={index + 4} />
          ))}
        </div>
      )}

      {owners.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No contributors found.</p>
        </div>
      )}
    </Container>
  )
}
