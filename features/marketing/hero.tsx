import Link from "next/link"
import { Compass, ArrowRight, Search, Star, Terminal } from "lucide-react"

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
      className="rounded-xl border border-border-subtle bg-card/30 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left content */}
        <div className="space-y-4 flex-1">
          <div className="space-y-3">
            <h1
              id="hero-heading"
              className="text-lg font-semibold tracking-tight sm:text-xl"
            >
              <span className="text-primary">Agent skills</span> directory for coding assistants
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover SKILL.md workflows from GitHub, compare stars and updates, and install agent skills for Claude Code, Cursor, Windsurf, and more.
            </p>
            <div className="space-y-2">
              <h2 className="text-base font-semibold">
                What are agent skills?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agent skills are SKILL.md workflows that teach coding assistants how to complete repeatable tasks. AGNXI indexes public agent skills, shows repo signals, and lets you install the workflow that fits your tool.
              </p>
            </div>
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" asChild>
              <Link href="/agent-skills">Read the Agent Skills Guide</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/skills">Browse Agent Skills</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/categories">
                Categories
              </Link>
            </Button>
          </div>
        </div>

        {/* Right content - Feature cards */}
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
  )
}

export { Hero }
