import * as React from "react"
import { redirect } from "next/navigation"

import { checkAdminAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"
import AdminClientPage from "./client-page"

export default async function AdminPage() {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    redirect("/")
  }

  const allSkills = await db.query.skills.findMany({
    orderBy: [skills.createdAt],
  })

  return (
    <AdminClientPage
      initialSkills={allSkills}
    />
  )
}
