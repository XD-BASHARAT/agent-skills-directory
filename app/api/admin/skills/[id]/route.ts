import { NextResponse } from "next/server"
import { approveSkill, rejectSkill, getSkillById } from "@/lib/db/queries"
import { requireAdmin } from "@/lib/auth"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const decodedId = decodeURIComponent(id)

  try {
    const skill = await getSkillById(decodedId)

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 })
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error("Failed to get skill:", error)
    return NextResponse.json({ error: "Failed to get skill" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const body = await request.json()
  const { action } = body

  try {
    switch (action) {
      case "approve":
        await approveSkill(decodedId)
        break
      case "reject":
        await rejectSkill(decodedId)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const skill = await getSkillById(decodedId)
    return NextResponse.json({ success: true, skill })
  } catch (error) {
    console.error("Failed to update skill:", error)
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 })
  }
}
