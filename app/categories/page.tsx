import Link from "next/link"
import { getCategories } from "@/lib/db/queries"
import { getCategoriesSorted } from "@/lib/categories"
import { cn } from "@/lib/utils"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"

export const revalidate = 300

export const metadata = buildMetadata({
  title: "Categories",
  description: "Browse agent skills by category. Find the perfect skill for your needs.",
  path: "/categories",
})

export default async function CategoriesPage() {
  const dbCategories = await getCategories()

  const categories = dbCategories.length > 0 ? dbCategories : getCategoriesSorted()

  return (
    <Container>
      <div>
        <h1 className="text-balance text-lg font-semibold">Categories</h1>
        <p className="text-muted-foreground text-sm">Browse agent skills by category</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn(
              "group rounded-lg border border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur transition-colors",
              "hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-muted-foreground line-clamp-1 text-xs">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-muted-foreground py-12 text-center text-sm">
          No categories found.
        </div>
      )}
    </Container>
  )
}
