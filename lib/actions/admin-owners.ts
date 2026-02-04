"use server"

import { revalidatePath } from "next/cache"

import { checkAdminAuth } from "@/lib/auth"
import { updateOwnerVerification } from "@/lib/db/queries"

export async function setOwnerVerified(owner: string, verified: boolean) {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    throw new Error("Unauthorized")
  }

  await updateOwnerVerification(owner, verified)
  revalidatePath(`/${owner}`)
}
