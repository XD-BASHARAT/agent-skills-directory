import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

async function ensureAdmin() {
  try {
    await requireAdmin()
    return null
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function GET() {
  const authError = await ensureAdmin()
  if (authError) {
    return authError
  }

  return NextResponse.json(
    { error: "Discovery endpoint not implemented" },
    { status: 501 }
  )
}

export async function POST() {
  const authError = await ensureAdmin()
  if (authError) {
    return authError
  }

  return NextResponse.json(
    { error: "Discovery endpoint not implemented" },
    { status: 501 }
  )
}
