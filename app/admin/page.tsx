import * as React from "react"
import { redirect } from "next/navigation"
import { desc, sql } from "drizzle-orm"

import { checkAdminAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"
import AdminClientPage from "./client-page"

export default async function AdminPage() {
  const isAdmin = await checkAdminAuth()
  if (!isAdmin) {
    redirect("/")
  }

  // Optimized query: only select necessary fields and limit initial load
  // Load stats separately for overview tab
  const [initialSkills, stats] = await Promise.all([
    // Load only first 100 skills for initial render
    db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        owner: skills.owner,
        repo: skills.repo,
        path: skills.path,
        url: skills.url,
        rawUrl: skills.rawUrl,
        stars: skills.stars,
        forks: skills.forks,
        avatarUrl: skills.avatarUrl,
        status: skills.status,
        isVerifiedOrg: skills.isVerifiedOrg,
        isArchived: skills.isArchived,
        topics: skills.topics,
        compatibility: skills.compatibility,
        allowedTools: skills.allowedTools,
        blobSha: skills.blobSha,
        lastSeenAt: skills.lastSeenAt,
        submittedBy: skills.submittedBy,
        repoUpdatedAt: skills.repoUpdatedAt,
        fileUpdatedAt: skills.fileUpdatedAt,
        indexedAt: skills.indexedAt,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        searchText: skills.searchText,
        securityScan: skills.securityScan,
        securityScannedAt: skills.securityScannedAt,
      })
      .from(skills)
      .orderBy(desc(skills.createdAt))
      .limit(100),
    // Get stats efficiently
    db
      .select({
        total: sql<number>`count(*)::int`,
        approved: sql<number>`count(*) filter (where ${skills.status} = 'approved')::int`,
        pending: sql<number>`count(*) filter (where ${skills.status} = 'pending')::int`,
        rejected: sql<number>`count(*) filter (where ${skills.status} = 'rejected')::int`,
      })
      .from(skills),
  ])

  return (
    <AdminClientPage
      initialSkills={initialSkills}
      stats={stats[0]}
    />
  )
}
