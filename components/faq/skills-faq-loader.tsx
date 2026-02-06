"use client"

import dynamic from "next/dynamic"

const SkillsFaq = dynamic(
  () => import("@/components/faq/skills-faq").then((mod) => mod.SkillsFaq),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border/50 bg-card/40 px-3.5 py-3 text-xs text-muted-foreground">
        Loading FAQ...
      </div>
    ),
  }
)

export { SkillsFaq }
