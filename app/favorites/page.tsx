import * as React from "react"
import { Container } from "@/components/layouts/container"
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-json-ld"
import { buildMetadata } from "@/lib/seo"
import { getCategories } from "@/lib/db/queries"
import { FavoritesClient } from "./favorites-client"

export const metadata = buildMetadata({
  title: "My Favorites",
  description: "Your saved list of skills for quick reference.",
  path: "/favorites",
  keywords: [
    "favorite skills",
    "saved skills",
    "my collection",
    "bookmarked skills",
    "agent skills favorites",
  ],
})

export default async function FavoritesPage() {
  const categories = await getCategories()

  return (
    <Container>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "My Favorites", url: "/favorites" },
        ]}
      />
      <header className="space-y-1">
        <h1 className="text-balance text-2xl font-bold tracking-tight">My Favorites</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          Your saved skills list for quick reference and reuse.
        </p>
      </header>
      <FavoritesClient categories={categories} />
    </Container>
  )
}
