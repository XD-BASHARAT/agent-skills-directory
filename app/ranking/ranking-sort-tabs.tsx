"use client"

import Link from "next/link"
import { Star, GitFork, Boxes } from "lucide-react"

import { cn } from "@/lib/utils"

const tabs = [
  { value: "stars", label: "Stars", icon: Star },
  { value: "skills", label: "Skills", icon: Boxes },
  { value: "forks", label: "Forks", icon: GitFork },
] as const

type RankingSortTabsProps = {
  currentSort: "stars" | "skills" | "forks"
}

function RankingSortTabs({ currentSort }: RankingSortTabsProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentSort === tab.value

          return (
            <Link
              key={tab.value}
              href={tab.value === "stars" ? "/ranking" : `/ranking?sort=${tab.value}`}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-300",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-background shadow-sm border border-border/50" />
              )}
              <Icon className={cn("size-4 relative z-10", isActive && tab.value === "stars" && "text-amber-500")} aria-hidden="true" />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export { RankingSortTabs }
