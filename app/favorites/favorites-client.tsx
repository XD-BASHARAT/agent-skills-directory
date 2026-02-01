"use client"

import * as React from "react"
import Link from "next/link"
import { Heart, ArrowRight } from "lucide-react"
import { SkillsGrid } from "@/features/skills/skills-grid"
import { Button } from "@/components/ui/button"
import { useFavoritesContext } from "@/lib/contexts/favorites-context"
import type { Category } from "@/types"

type FavoritesClientProps = {
  categories: Category[]
}

function FavoritesClient({ categories }: FavoritesClientProps) {
  const { isLoaded, isAuthenticated } = useFavoritesContext()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="animate-pulse motion-reduce:animate-none text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <Heart className="size-12 text-muted-foreground/50" aria-hidden="true" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Sign in to save favorites</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Create an account to save your favorite skills and access them anytime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/skills">
              Browse Skills
              <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SkillsGrid 
      initialCategories={categories}
      showFavoritesOnly={true}
    />
  )
}

export { FavoritesClient }
