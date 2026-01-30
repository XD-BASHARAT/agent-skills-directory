import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getSkillById, linkSkillToCategories, getSkillCategories } from "@/lib/db/queries"
import { getCategoryBySlug, type CategoryDefinition } from "@/lib/categories"

type RouteParams = { params: Promise<{ id: string }> }

async function ensureAdmin() {
  try {
    await requireAdmin()
  } catch {
    throw new Error("unauthorized")
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await ensureAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const [skill, categories] = await Promise.all([
    getSkillById(decodedId),
    getSkillCategories(decodedId),
  ])

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  return NextResponse.json({
    skill: { id: skill.id, name: skill.name, owner: skill.owner },
    categories: categories.map((category) => category.slug),
  })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await ensureAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const skill = await getSkillById(decodeURIComponent(id))
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  const body = await request.json()
  const slugs = Array.isArray(body.categories) ? body.categories : []

  const validCategories: CategoryDefinition[] = []
  for (const slug of slugs) {
    if (typeof slug === "string") {
      const cat = getCategoryBySlug(slug)
      if (cat) validCategories.push(cat)
    }
  }

  const categoryIds = validCategories.map((c) => c.id)

  if (categoryIds.length !== slugs.length) {
    return NextResponse.json({ error: "One or more categories are invalid" }, { status: 400 })
  }

  await linkSkillToCategories(skill.id, categoryIds)

  return NextResponse.json({
    success: true,
    categories: slugs,
  })
}
