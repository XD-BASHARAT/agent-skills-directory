import { auth, currentUser } from "@clerk/nextjs/server"

function hasRoleMetadata(metadata: unknown): metadata is { role?: unknown } {
  return typeof metadata === "object" && metadata !== null && "role" in metadata
}

function readRole(metadata: unknown): string | null {
  if (!hasRoleMetadata(metadata)) return null
  return typeof metadata.role === "string" ? metadata.role : null
}

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser()
  const role = readRole(user?.publicMetadata)
  return role === "admin"
}

export async function checkAdminAuth(): Promise<boolean> {
  return isAdmin()
}

export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error("Unauthorized: Admin access required")
  }
}

export async function getUser() {
  return currentUser()
}

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
