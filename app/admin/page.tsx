import * as React from "react"
import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"

import { checkAdminAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"
import AdminClientPage from "./client-page"

export default async function AdminPage() {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    redirect("/")
  }

  // Use direct query with limit to avoid timeout
  const allSkills = await db
    .select()
    .from(skills)
    .orderBy(desc(skills.createdAt))
    .limit(500)

  return (
    <AdminClientPage
      initialSkills={allSkills}
    />
  )
}
