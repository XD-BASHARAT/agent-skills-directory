import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, ArrowUpRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type Skill = {
  id: string
  name: string
  slug: string
  description: string
  owner: string
  repo: string
  stars: number | null
  compatibility?: string | null
  avatarUrl?: string | null
}

type RelatedSkillsProps = {
  skills: Skill[]
  title?: string
}

function RelatedSkills({ skills, title = "Related Skills" }: RelatedSkillsProps) {
  if (skills.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {skills.slice(0, 4).map((skill, index) => (
          <Link
            key={skill.id}
            href={`/${skill.owner}/skills/${skill.slug}`}
            prefetch={false}
            className={cn(
              "group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/30",
              "hover:border-primary/30 hover:bg-card/60 transition-[background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none",
              "animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar */}
            <div className="size-9 rounded-lg bg-muted border border-border/50 overflow-hidden flex items-center justify-center shrink-0">
              {skill.avatarUrl ? (
                <Image
                  src={skill.avatarUrl}
                  alt={`${skill.name} - ${skill.owner} skill icon`}
                  width={36}
                  height={36}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  {skill.owner.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {skill.name}
                </h4>
                <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none shrink-0" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {skill.description}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star className="size-2.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                  {skill.stars?.toLocaleString() ?? 0}
                </span>
                {skill.compatibility && (
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                    {skill.compatibility}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export { RelatedSkills }
