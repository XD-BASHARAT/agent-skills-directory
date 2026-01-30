import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SkillListItem } from "@/types";

type SkillCardProps = {
  skill: SkillListItem;
  className?: string;
  imagePriority?: boolean;
};

function SkillCard({ skill, className, imagePriority }: SkillCardProps) {
  const skillUrl = `/${skill.owner}/skills/${skill.slug}`;
  const updatedAt = skill.updatedAtLabel ?? null;

  return (
    <Link
      href={skillUrl}
      prefetch={false}
      data-slot="skill-card"
      className={cn(
        "group relative flex h-full flex-col rounded-xl border border-border/40 bg-card/30 p-4",
        "backdrop-blur-sm",
        "transition-all duration-200 ease-out",
        "hover:border-border/60 hover:bg-card/50 hover:shadow-md hover:shadow-black/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {skill.avatarUrl ? (
            <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
              <Image
                src={skill.avatarUrl}
                alt={`${skill.name} by ${skill.owner}`}
                fill
                sizes="40px"
                priority={imagePriority}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50">
              <span className="text-xs font-semibold text-muted-foreground">
                {skill.owner.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="truncate text-sm font-semibold leading-tight text-foreground group-hover:text-foreground">
            {skill.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{skill.owner}</span>
            {skill.isVerifiedOrg && (
              <ShieldCheck
                className="size-3.5 shrink-0 text-blue-500"
                aria-label="Verified organization"
              />
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
        {skill.description}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
        {skill.stars !== null && skill.stars > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star
              className="size-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span className="font-medium">{formatStars(skill.stars)}</span>
          </span>
        )}
        {updatedAt && (
          <span className="text-muted-foreground/70">
            Updated {updatedAt}
          </span>
        )}
      </div>
    </Link>
  );
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return stars.toString();
}

export { SkillCard };
