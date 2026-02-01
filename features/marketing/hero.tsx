import Link from "next/link"
import { Compass, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Logo, type LogoName } from "@/components/ui/logo"
import type { HealthStatus } from "@/lib/health"
import { cn } from "@/lib/utils"

type HeroStats = {
  total: number
  updatedToday: number
}

type HeroProps = {
  stats?: HeroStats
  healthStatus?: HealthStatus
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`
  }
  return num.toString()
}

const TOOLS: { name: LogoName; label: string }[] = [
  { name: "claude", label: "Claude" },
  { name: "cursor", label: "Cursor" },
  { name: "windsurf", label: "Windsurf" },
  { name: "cline", label: "Cline" },
  { name: "amp", label: "Amp" },
  { name: "githubcopilot", label: "GitHub Copilot" },
  { name: "gemini", label: "Gemini" },
  { name: "opencode", label: "OpenCode" },
  { name: "trae", label: "Trae" },
]

function ProviderLogo({ name, label }: { name: LogoName; label: string }) {
  return (
    <div
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-lg",
        "bg-card-subtle ring-1 ring-border-subtle",
        "transition-[transform,background-color,border-color,box-shadow] duration-200 hover:scale-105 hover:ring-border hover:bg-card-elevated motion-reduce:transition-none motion-reduce:transform-none"
      )}
    >
      <Logo name={name} size={18} className="transition-transform duration-200 motion-reduce:transition-none" />
      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

function Hero({ stats = { total: 0, updatedToday: 0 }, healthStatus }: HeroProps) {
  const healthState = healthStatus?.status ?? "unknown"
  const healthLabel =
    healthState === "healthy" ? "Healthy" : healthState === "unhealthy" ? "Unhealthy" : "Unknown"
  const healthDotClassName =
    healthState === "healthy"
      ? "bg-emerald-500"
      : healthState === "unhealthy"
        ? "bg-rose-500"
        : "bg-muted-foreground/50"
  const healthLatency = typeof healthStatus?.latencyMs === "number"
    ? Math.round(healthStatus.latencyMs)
    : null
  const healthTitle = healthLatency ? `DB latency ${healthLatency}ms` : "Health status"

  return (
    <section
      aria-labelledby="hero-heading"
      className="rounded-lg border border-border-subtle bg-card-subtle p-4 sm:p-5"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left content */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h1
              id="hero-heading"
              className="text-lg font-semibold tracking-tight sm:text-xl"
            >
              Search <span className="text-primary">Agent Skills</span> for coding assistants
            </h1>
            <p className="text-[13px] text-muted-foreground-soft">
              SKILL.md files from GitHub, filterable by tool, category, and activity
            </p>
          </div>

          {/* Stats inline */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-foreground">
                {stats.total > 0 ? formatNumber(stats.total) : "--"}
              </span>{" "}
              skills
            </span>
            {stats.updatedToday > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                <span className="font-medium text-foreground">{stats.updatedToday}</span> updated today
              </span>
            )}
            <Badge variant="outline" className="gap-1.5 border-border/60 bg-background/60" title={healthTitle}>
              <span className={cn("size-1.5 rounded-full", healthDotClassName)} aria-hidden="true" />
              <span>Health {healthLabel}</span>
            </Badge>
          </div>

          {/* Tool logos */}
          <div className="flex items-center gap-2 pt-1">
            {TOOLS.map((tool) => (
              <ProviderLogo key={tool.name} name={tool.name} label={tool.label} />
            ))}
          </div>
        </div>

        {/* Right content - CTA */}
        <div className="flex items-center gap-2 lg:flex-col lg:items-end">
          <Button
            size="sm"
            asChild
            className="h-8 gap-1.5 rounded-md px-3 text-xs font-medium"
          >
            <Link href="/skills">
              <Compass className="size-3.5" aria-hidden="true" />
              Browse Skills
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 rounded-md px-3 text-xs font-medium"
          >
            <Link href="/categories">
              Categories
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export { Hero }
