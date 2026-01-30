import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db, userFavorites } from "@/lib/db"
import { eq, and } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const favorites = await db
    .select({ skillId: userFavorites.skillId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))

  return NextResponse.json({ favorites: favorites.map((f) => f.skillId) })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { skillId } = await request.json()
  if (!skillId || typeof skillId !== "string") {
    return NextResponse.json({ error: "Invalid skillId" }, { status: 400 })
  }

  await db
    .insert(userFavorites)
    .values({ userId, skillId })
    .onConflictDoNothing()

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { skillId } = await request.json()
  if (!skillId || typeof skillId !== "string") {
    return NextResponse.json({ error: "Invalid skillId" }, { status: 400 })
  }

  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.skillId, skillId)))

  return NextResponse.json({ success: true })
}
