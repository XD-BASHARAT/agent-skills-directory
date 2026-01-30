import { auth, currentUser } from "@clerk/nextjs/server"

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser()
  const role = (user?.publicMetadata as { role?: string })?.role
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
