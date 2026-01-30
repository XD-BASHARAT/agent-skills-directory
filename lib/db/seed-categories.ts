import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { categories } from "./schema"
import { CATEGORIES, toDatabaseCategory } from "@/lib/categories"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seed() {
  console.log("Seeding categories...")

  for (const category of CATEGORIES) {
    const dbCategory = toDatabaseCategory(category)
    await db
      .insert(categories)
      .values(dbCategory)
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: dbCategory.name,
          slug: dbCategory.slug,
          description: dbCategory.description,
          color: dbCategory.color,
          order: dbCategory.order,
        },
      })
    console.log(`  ✓ ${category.name}`)
  }

  console.log("Done! Seeded", CATEGORIES.length, "categories")
}

seed().catch(console.error)
