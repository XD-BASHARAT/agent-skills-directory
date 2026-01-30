import Link from "next/link"
import { Compass, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo, type LogoName } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

type HeroStats = {
  total: number
  updatedToday: number
}

type HeroProps = {
  stats?: HeroStats
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
        "transition-all duration-200 hover:scale-105 hover:ring-border hover:bg-card-elevated"
      )}
    >
      <Logo name={name} size={18} className="transition-transform duration-200" />
      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

function Hero({ stats = { total: 0, updatedToday: 0 } }: HeroProps) {
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
              Find <span className="text-primary">Agent Skills</span> for AI Coding
            </h1>
            <p className="text-[13px] text-muted-foreground-soft">
              Browse SKILL.md files for Claude, Cursor, Windsurf and other AI tools
            </p>
          </div>

          {/* Stats inline */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {stats.total > 0 ? formatNumber(stats.total) : "--"}
              </span>{" "}
              skills
            </span>
            {stats.updatedToday > 0 && (
              <>
                <span className="text-border-muted">&middot;</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-foreground">{stats.updatedToday}</span> updated today
                </span>
              </>
            )}
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
