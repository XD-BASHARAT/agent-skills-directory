import { inngest } from "./client"
import { batchFetchRepoMetadata, batchFetchSkills } from "@/lib/features/skills/github-graphql"
import { batchFetchOwnersVerification } from "@/lib/features/skills/github-rest"
import { syncIfChanged } from "@/lib/features/skills"
import { discoverAllSkills, SKILLS_LAUNCH_DATE } from "@/lib/features/skills/discovery"
import { parseSkillMd, normalizeAllowedTools } from "@/lib/features/skills/parser"
import { toCanonicalId } from "@/lib/features/skills/canonical"
import { slugify } from "@/lib/utils"
import type { NewSkill } from "@/lib/db/schema"
import {
  updateSkillsMetadata,
  getSkillsNeedingMetadataSync,
  getRunningSyncJob,
  createSyncJob,
  updateSyncJob,
  batchLinkSkillsToCategories,
  batchUpsertSkills,
  getSkillsWithoutCategories,
  getSkillsByIds,
  replaceSkillCategories,
  getLastDiscoveryDate,
  setLastDiscoveryDate,
  getExistingSkillIds,
} from "@/lib/db/queries"
import {
  parseTopics,
  mapSkillToCategories,
  assignCategoriesHybrid,
  CATEGORY_CONFIG,
} from "@/lib/categories"

type MetadataRow = {
  stars?: number | null
  forks?: number | null
  topics?: string[] | null
  isArchived?: boolean | null
  pushedAt?: string | null
}

type StepRunner = {
  run(name: string, fn: () => Promise<unknown>): Promise<unknown>
}

function normalizeTopics(topics: string[] | null | undefined) {
  return JSON.stringify(topics ?? [])
}

function datesEqual(a?: Date | null, b?: Date | null) {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.getTime() === b.getTime()
}

function buildMetadataUpdates(
  skills: Array<{
    id: string
    owner: string
    repo: string
    stars?: number | null
    forks?: number | null
    topics?: string | null
    isArchived?: boolean | null
    repoUpdatedAt?: Date | string | null
  }>,
  metadataMap: Record<string, MetadataRow>,
) {
  const updates: Array<{
    id: string
    stars?: number | null
    forks?: number | null
    topics?: string
    isArchived?: boolean | null
    repoUpdatedAt?: Date | null
  }> = []

  for (const skill of skills) {
    const meta = metadataMap[`${skill.owner}/${skill.repo}`]
    if (!meta) continue

    const nextTopics = normalizeTopics(meta.topics ?? [])
    const nextRepoUpdatedAt = meta.pushedAt ? new Date(meta.pushedAt) : undefined

    const hasChanges =
      (typeof meta.stars === "number" && meta.stars !== (skill.stars ?? 0)) ||
      (typeof meta.forks === "number" && meta.forks !== (skill.forks ?? 0)) ||
      (meta.isArchived !== undefined && meta.isArchived !== (skill.isArchived ?? false)) ||
      (skill.topics ?? "[]") !== nextTopics ||
      !datesEqual(skill.repoUpdatedAt ? new Date(skill.repoUpdatedAt) : null, nextRepoUpdatedAt ?? null)

    if (!hasChanges) continue

    updates.push({
      id: skill.id,
      stars: meta.stars,
      forks: meta.forks,
      topics: nextTopics,
      isArchived: meta.isArchived,
      repoUpdatedAt: nextRepoUpdatedAt,
    })
  }

  return updates
}

async function completeSyncJob(
  step: StepRunner,
  jobId: string,
  payload: Parameters<typeof updateSyncJob>[1],
  name: string,
) {
  await step.run(name, async () => {
    await updateSyncJob(jobId, payload)
  })
}

export const syncMetadata = inngest.createFunction(
  {
    id: "sync-metadata",
    name: "Sync Repository Metadata",
    concurrency: { limit: 1 },
    retries: 3,
  },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const runningJob = await step.run("check-running-job", async () => {
      return getRunningSyncJob("metadata")
    })

    if (runningJob?.startedAt && Date.now() - new Date(runningJob.startedAt).getTime() < CATEGORY_CONFIG.SYNC_WINDOW_MS) {
      return { skipped: true, reason: "Existing metadata sync still running" }
    }

    const jobId = `metadata-${Date.now()}`

    await step.run("create-job", async () => {
      await createSyncJob({
        id: jobId,
        type: "metadata",
        status: "running",
        startedAt: new Date(),
      })
    })

    const skillsToSync = await step.run("get-skills-to-sync", async () => {
      return getSkillsNeedingMetadataSync(200)
    })

    if (skillsToSync.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
      }, "complete-job-empty")
      return { synced: 0 }
    }

    const uniqueRepos = await step.run("get-unique-repos", async () => {
      const repoMap = new Map<string, { owner: string; repo: string }>()
      for (const skill of skillsToSync) {
        const key = `${skill.owner}/${skill.repo}`
        if (!repoMap.has(key)) {
          repoMap.set(key, { owner: skill.owner, repo: skill.repo })
        }
      }
      return Array.from(repoMap.values())
    })

    const repoMetadata = await step.run("fetch-metadata", async () => {
      const metadata = await batchFetchRepoMetadata(uniqueRepos)
      return Object.fromEntries(metadata)
    })

    const updates = await step.run("prepare-updates", async () => {
      return buildMetadataUpdates(skillsToSync, repoMetadata)
    })

    if (updates.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
      }, "complete-job-no-changes")
      return { synced: 0, skipped: skillsToSync.length }
    }

    await step.run("apply-updates", async () => {
      const updatesWithDates = updates.map((u) => ({
        ...u,
        repoUpdatedAt: u.repoUpdatedAt ? new Date(u.repoUpdatedAt) : undefined,
      }))
      await updateSkillsMetadata(updatesWithDates)
    })

    await completeSyncJob(step, jobId, {
      status: "completed",
      completedAt: new Date(),
      itemsProcessed: updates.length,
    }, "complete-job")

    return { synced: updates.length }
  }
)

export const assignCategoriesNightly = inngest.createFunction(
  {
    id: "assign-categories-nightly",
    name: "Assign Categories Nightly (AI)",
    retries: 3,
    concurrency: { limit: 1 },
  },
  { cron: "0 3 * * *" }, // every day at 03:00 UTC
  async ({ step }) => {
    const skillsToTag = await step.run("fetch-skills", async () => {
      return getSkillsWithoutCategories(200)
    })

    if (skillsToTag.length === 0) {
      return { assigned: 0, note: "No skills missing categories" }
    }

    const inputs = skillsToTag.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? "",
      topics: parseTopics(s.topics ?? null),
    }))

    const assignments = await step.run("ai-categorize", async () => {
      return assignCategoriesHybrid(inputs, {
        model: process.env.GEMINI_MODEL ?? CATEGORY_CONFIG.MODELS.DEFAULT,
        maxBatchSize: CATEGORY_CONFIG.MAX_BATCH_SIZE,
        useCache: true,
        skipRateLimit: true, // Inngest handles rate limiting via concurrency
      })
    })

    const rows = assignments
      .filter((a) => a.categoryIds.length > 0)
      .map((a) => ({
        skillId: a.skillId,
        categoryIds: a.categoryIds,
      }))

    if (rows.length === 0) {
      return { assigned: 0, note: "No valid categories returned" }
    }

    await step.run("persist-categories", async () => {
      await batchLinkSkillsToCategories(rows)
    })

    const stats = {
      ai: assignments.filter((a) => a.source === "ai").length,
      cache: assignments.filter((a) => a.source === "cache").length,
    }

    return {
      assigned: rows.length,
      ...stats,
    }
  }
)

export const syncSkillFromWebhook = inngest.createFunction(
  {
    id: "sync-skill-from-webhook",
    name: "Sync Skill from GitHub Webhook",
    concurrency: { limit: 5 },
    retries: 3,
  },
  { event: "github/push" },
  async ({ event, step }) => {
    const { owner, repo, path, ref } = event.data as {
      owner: string
      repo: string
      path: string
      ref?: string
    }

    // Only process main/master branch pushes
    if (ref && !ref.endsWith("/main") && !ref.endsWith("/master")) {
      return { skipped: true, reason: "Not main/master branch" }
    }

    // Check if skill changed and sync if needed
    const result = await step.run("sync-if-changed", async () => {
      return syncIfChanged(owner, repo, path)
    })

    if (!result.changed) {
      return { changed: false, message: "No changes detected" }
    }

    if (result.skill) {
      await step.sendEvent("enqueue-webhook-categories", {
        name: "categories/assign.ai",
        data: { skillIds: [result.skill.id], mode: "replace" },
      })
    }

    return { changed: true, skillId: result.skill?.id }
  }
)

export const assignCategoriesAI = inngest.createFunction(
  {
    id: "assign-categories-ai",
    name: "Assign Categories (AI - Cost Optimized)",
    retries: 2,
    concurrency: { limit: 3 },
  },
  { event: "categories/assign.ai" },
  async ({ event, step }) => {
    const { skillIds, mode } = event.data as {
      skillIds: string[]
      mode: "replace" | "insert-if-empty"
    }

    if (!skillIds || skillIds.length === 0) {
      return { skipped: true, reason: "No skill IDs provided" }
    }

    const skills = await step.run("fetch-skills", async () => {
      return getSkillsByIds(skillIds)
    })

    if (skills.length === 0) {
      return { skipped: true, reason: "No skills found" }
    }

    const inputs = skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? "",
      topics: parseTopics(s.topics ?? null),
    }))

    const assignments = await step.run("ai-categorize", async () => {
      return assignCategoriesHybrid(inputs, {
        model: process.env.GEMINI_MODEL ?? CATEGORY_CONFIG.MODELS.DEFAULT,
        maxBatchSize: CATEGORY_CONFIG.MAX_BATCH_SIZE,
        useCache: true,
        skipRateLimit: true, // Inngest handles rate limiting via concurrency
      })
    })

    const rows = assignments
      .filter((a) => a.categoryIds.length > 0)
      .map((a) => ({
        skillId: a.skillId,
        categoryIds: a.categoryIds,
      }))

    if (rows.length === 0) {
      return { processed: 0, note: "No valid categories returned" }
    }

    await step.run("persist-categories", async () => {
      if (mode === "replace") {
        await replaceSkillCategories(rows)
      } else {
        await batchLinkSkillsToCategories(rows)
      }
    })

    const stats = {
      ai: assignments.filter((a) => a.source === "ai").length,
      cache: assignments.filter((a) => a.source === "cache").length,
    }

    return {
      processed: rows.length,
      ...stats,
    }
  }
)

export const triggerMetadataSync = inngest.createFunction(
  {
    id: "trigger-metadata-sync",
    name: "Manual Metadata Sync Trigger",
  },
  { event: "sync/metadata" },
  async ({ step }) => {
    return step.invoke("run-metadata-sync", {
      function: syncMetadata,
      data: {},
    })
  }
)

export const triggerAICategorization = inngest.createFunction(
  {
    id: "trigger-ai-categorization",
    name: "Manual AI Categorization Trigger",
  },
  { event: "categories/trigger" },
  async ({ event, step }) => {
    const { skillIds } = event.data as { skillIds?: string[] }

    if (skillIds && skillIds.length > 0) {
      await step.sendEvent("enqueue-specific", {
        name: "categories/assign.ai",
        data: { skillIds, mode: "replace" },
      })
      return { queued: skillIds.length }
    }

    const skills = await step.run("get-uncategorized", async () => {
      return getSkillsWithoutCategories(200)
    })

    if (skills.length === 0) {
      return { queued: 0, note: "All skills have categories" }
    }

    await step.sendEvent("enqueue-batch", {
      name: "categories/assign.ai",
      data: { skillIds: skills.map((s) => s.id), mode: "insert-if-empty" },
    })

    return { queued: skills.length }
  }
)

export const discoverNewSkills = inngest.createFunction(
  {
    id: "discover-new-skills",
    name: "Auto-Discover New Skills from GitHub",
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const MIN_STARS = 10 // Lower threshold for discovery
    const MAX_SKILLS_PER_RUN = 100

    // Check if another discovery is running
    const runningJob = await step.run("check-running-job", async () => {
      return getRunningSyncJob("discovery")
    })

    if (runningJob?.startedAt && Date.now() - new Date(runningJob.startedAt).getTime() < 3600000) {
      return { skipped: true, reason: "Discovery job still running" }
    }

    const jobId = `discovery-${Date.now()}`

    await step.run("create-job", async () => {
      await createSyncJob({
        id: jobId,
        type: "discovery",
        status: "running",
        startedAt: new Date(),
      })
    })

    // Get watermark for incremental discovery (returns ISO string for serialization)
    const lastDiscoveryStr = await step.run("get-watermark", async () => {
      const date = await getLastDiscoveryDate()
      // Default: 7 days ago if no watermark
      return (date ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).toISOString()
    })

    // Step 1: Discover SKILL.md files (multi-query + registries)
    const discovered = await step.run("discover-skills", async () => {
      return discoverAllSkills({
        startDate: new Date(lastDiscoveryStr),
        endDate: new Date(),
        maxResults: MAX_SKILLS_PER_RUN * 3, // Fetch more, filter later
      })
    })

    if (discovered.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
      }, "complete-job-empty")
      
      // Update watermark even if no results
      await step.run("update-watermark-empty", async () => {
        await setLastDiscoveryDate(new Date())
      })
      
      return { discovered: 0, indexed: 0 }
    }

    // Step 1.5: Filter out skills that already exist in DB
    const newDiscovered = await step.run("filter-existing", async () => {
      const candidateIds = discovered.map((d) => 
        toCanonicalId(d.owner, d.repo, d.path)
      )
      const existingIds = await getExistingSkillIds(candidateIds)
      
      return discovered.filter((d) => {
        const id = toCanonicalId(d.owner, d.repo, d.path)
        return !existingIds.has(id)
      })
    })

    if (newDiscovered.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
        metadata: JSON.stringify({ discovered: discovered.length, alreadyExists: discovered.length }),
      }, "complete-job-all-exist")
      
      await step.run("update-watermark-all-exist", async () => {
        await setLastDiscoveryDate(new Date())
      })
      
      return { discovered: discovered.length, newSkills: 0, indexed: 0 }
    }

    // Step 2: Get unique repos for metadata fetch (from NEW skills only)
    const uniqueRepos = await step.run("get-unique-repos", async () => {
      const repoMap = new Map<string, { owner: string; repo: string }>()
      for (const item of newDiscovered) {
        const key = `${item.owner}/${item.repo}`.toLowerCase()
        if (!repoMap.has(key)) {
          repoMap.set(key, { owner: item.owner, repo: item.repo })
        }
      }
      return Array.from(repoMap.values())
    })

    // Step 3: Batch fetch repo metadata (filter by stars early)
    const repoMetadata = await step.run("fetch-repo-metadata", async () => {
      const metadata = await batchFetchRepoMetadata(uniqueRepos)
      return Object.fromEntries(metadata)
    })

    // Step 4: Filter qualified items (from NEW skills only)
    const qualifiedItems = await step.run("filter-qualified", async () => {
      const items: Array<{ owner: string; repo: string; path: string }> = []
      
      for (const item of newDiscovered) {
        const repoKey = `${item.owner}/${item.repo}`
        const meta = repoMetadata[repoKey]
        
        if (!meta) continue
        if (meta.stars < MIN_STARS) continue
        if (meta.isArchived) continue
        
        items.push({ owner: item.owner, repo: item.repo, path: item.path })
        
        if (items.length >= MAX_SKILLS_PER_RUN) break
      }
      
      return items
    })

    if (qualifiedItems.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
        metadata: JSON.stringify({ 
          discovered: discovered.length, 
          newSkills: newDiscovered.length,
          qualified: 0 
        }),
      }, "complete-job-no-qualified")
      
      await step.run("update-watermark-no-qualified", async () => {
        await setLastDiscoveryDate(new Date())
      })
      
      return { discovered: discovered.length, qualified: 0, indexed: 0 }
    }

    // Step 5: Batch fetch skill content
    const skillDataMap = await step.run("fetch-skill-content", async () => {
      const data = await batchFetchSkills(qualifiedItems)
      return Object.fromEntries(data)
    })

    // Step 6: Fetch owner verification status
    const ownerVerificationMap = await step.run("fetch-owner-verification", async () => {
      const owners = [...new Set(qualifiedItems.map((i) => i.owner))]
      const verification = await batchFetchOwnersVerification(owners)
      return Object.fromEntries(verification)
    })

    // Step 7: Parse and prepare skills for upsert (returns serializable data)
    const parsedSkillsData = await step.run("prepare-skills", async () => {
      const skills: Array<{
        id: string
        name: string
        slug: string
        description: string
        owner: string
        repo: string
        path: string
        url: string
        rawUrl: string
        compatibility: string | null
        allowedTools: string | null
        stars: number
        forks: number
        avatarUrl: string
        topics: string
        isArchived: boolean
        isVerifiedOrg: boolean
        blobSha: string | null
        pushedAt: string | null
        fileCommittedAt: string | null
      }> = []
      
      for (const item of qualifiedItems) {
        const lookupKey = `${item.owner}/${item.repo}/${item.path}`
        const data = skillDataMap[lookupKey]
        
        if (!data || !data.content) continue
        
        const parsed = parseSkillMd(data.content)
        if (!parsed.success) continue
        
        const canonicalId = toCanonicalId(item.owner, item.repo, item.path)
        
        skills.push({
          id: canonicalId,
          name: parsed.data.name,
          slug: slugify(parsed.data.name),
          description: parsed.data.description,
          owner: item.owner.toLowerCase(),
          repo: item.repo.toLowerCase(),
          path: item.path,
          url: `https://github.com/${item.owner}/${item.repo}/blob/HEAD/${item.path}`,
          rawUrl: `https://raw.githubusercontent.com/${item.owner}/${item.repo}/HEAD/${item.path}`,
          compatibility: parsed.data.compatibility ?? null,
          allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
            ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
            : null,
          stars: data.stars,
          forks: data.forks,
          avatarUrl: data.avatarUrl,
          topics: JSON.stringify(data.topics),
          isArchived: data.isArchived,
          isVerifiedOrg: ownerVerificationMap[item.owner.toLowerCase()] ?? false,
          blobSha: data.sha,
          pushedAt: data.pushedAt,
          fileCommittedAt: data.fileCommittedAt,
        })
      }
      
      return skills
    })

    if (parsedSkillsData.length === 0) {
      await completeSyncJob(step, jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: 0,
        metadata: JSON.stringify({ 
          discovered: discovered.length, 
          newSkills: newDiscovered.length,
          qualified: qualifiedItems.length, 
          parsed: 0 
        }),
      }, "complete-job-no-parsed")
      
      await step.run("update-watermark-no-parsed", async () => {
        await setLastDiscoveryDate(new Date())
      })
      
      return { discovered: discovered.length, qualified: qualifiedItems.length, indexed: 0 }
    }

    // Step 8: Batch upsert skills (convert dates here)
    await step.run("upsert-skills", async () => {
      const skillsToUpsert: NewSkill[] = parsedSkillsData.map((s) => {
        const status = s.stars >= 50 ? "approved" : "pending"
        return {
          ...s,
          lastSeenAt: new Date(),
          repoUpdatedAt: s.pushedAt ? new Date(s.pushedAt) : null,
          fileUpdatedAt: s.fileCommittedAt ? new Date(s.fileCommittedAt) : null,
          status,
        }
      })
      await batchUpsertSkills(skillsToUpsert)
    })

    // Step 9: Assign categories using rule-based matcher
    const categoryLinks = await step.run("assign-categories", async () => {
      const links: Array<{ skillId: string; categoryIds: string[] }> = []
      
      for (const skill of parsedSkillsData) {
        const topics = parseTopics(skill.topics ?? null)
        const categoryIds = mapSkillToCategories(skill.name, skill.description ?? "", topics)
        
        if (categoryIds.length > 0) {
          links.push({ skillId: skill.id, categoryIds })
        }
      }
      
      return links
    })

    if (categoryLinks.length > 0) {
      await step.run("persist-categories", async () => {
        await batchLinkSkillsToCategories(categoryLinks)
      })
    }

    // Step 10: Queue AI categorization for skills without categories
    const skillsNeedingAI = parsedSkillsData
      .filter((s) => !categoryLinks.some((l) => l.skillId === s.id))
      .map((s) => s.id)

    if (skillsNeedingAI.length > 0) {
      await step.sendEvent("queue-ai-categorization", {
        name: "categories/assign.ai",
        data: { skillIds: skillsNeedingAI, mode: "insert-if-empty" },
      })
    }

    // Step 11: Update watermark
    await step.run("update-watermark", async () => {
      await setLastDiscoveryDate(new Date())
    })

    // Complete job
    await completeSyncJob(step, jobId, {
      status: "completed",
      completedAt: new Date(),
      itemsProcessed: parsedSkillsData.length,
      metadata: JSON.stringify({
        discovered: discovered.length,
        newSkills: newDiscovered.length,
        qualified: qualifiedItems.length,
        indexed: parsedSkillsData.length,
        categorized: categoryLinks.length,
        queuedForAI: skillsNeedingAI.length,
      }),
    }, "complete-job")

    return {
      discovered: discovered.length,
      newSkills: newDiscovered.length,
      qualified: qualifiedItems.length,
      indexed: parsedSkillsData.length,
      categorized: categoryLinks.length,
      queuedForAI: skillsNeedingAI.length,
    }
  }
)

export const triggerDiscovery = inngest.createFunction(
  {
    id: "trigger-discovery",
    name: "Manual Discovery Trigger",
  },
  { event: "discovery/trigger" },
  async ({ event, step }) => {
    const { resetWatermark } = event.data as { resetWatermark?: boolean } | undefined ?? {}

    // Optionally reset watermark to discover from beginning
    if (resetWatermark) {
      await step.run("reset-watermark", async () => {
        await setLastDiscoveryDate(SKILLS_LAUNCH_DATE)
      })
    }

    return step.invoke("run-discovery", {
      function: discoverNewSkills,
      data: {},
    })
  }
)

export const syncRepoSkills = inngest.createFunction(
  {
    id: "sync-repo-skills",
    name: "Sync Repository Skills",
    concurrency: { limit: 2 },
    retries: 2,
  },
  { event: "repo/sync" },
  async ({ event, step }) => {
    const { owner, repo, submittedBy, status } = event.data as {
      owner: string
      repo: string
      submittedBy?: string
      status?: "pending" | "approved"
    }

    if (!owner || !repo) {
      return { success: false, error: "Missing owner or repo" }
    }

    // Step 1: Discover all SKILL.md files in the repo
    const skillPaths = await step.run("discover-skills", async () => {
      const { discoverAllSkillFilesInRepo } = await import("@/lib/features/skills/github-graphql")
      return discoverAllSkillFilesInRepo(owner, repo)
    })

    if (skillPaths.length === 0) {
      return { success: true, total: 0, synced: 0, message: "No SKILL.md files found" }
    }

    // Step 2: Batch fetch all skill contents
    const skillItems = skillPaths.map((path: string) => ({ owner, repo, path }))
    const skillDataMap = await step.run("fetch-skill-content", async () => {
      const data = await batchFetchSkills(skillItems)
      return Object.fromEntries(data)
    })

    // Step 3: Fetch owner verification
    const isVerifiedOrg = await step.run("fetch-owner-verification", async () => {
      const verification = await batchFetchOwnersVerification([owner])
      return verification.get(owner.toLowerCase()) ?? false
    })

    // Step 4: Parse and prepare skills
    const parsedSkillsData = await step.run("prepare-skills", async () => {
      const skills: Array<{
        id: string
        name: string
        slug: string
        description: string
        owner: string
        repo: string
        path: string
        url: string
        rawUrl: string
        compatibility: string | null
        allowedTools: string | null
        stars: number
        forks: number
        avatarUrl: string
        topics: string
        isArchived: boolean
        isVerifiedOrg: boolean
        blobSha: string | null
        pushedAt: string | null
        fileCommittedAt: string | null
        submittedBy: string | null
        status: "pending" | "approved"
      }> = []

      for (const path of skillPaths) {
        const lookupKey = `${owner}/${repo}/${path}`
        const data = skillDataMap[lookupKey]

        if (!data || !data.content) continue

        const parsed = parseSkillMd(data.content)
        if (!parsed.success) continue

        const canonicalId = toCanonicalId(owner, repo, path)

        skills.push({
          id: canonicalId,
          name: parsed.data.name,
          slug: slugify(parsed.data.name),
          description: parsed.data.description,
          owner: owner.toLowerCase(),
          repo: repo.toLowerCase(),
          path,
          url: `https://github.com/${owner}/${repo}/blob/HEAD/${path}`,
          rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
          compatibility: parsed.data.compatibility ?? null,
          allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
            ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
            : null,
          stars: data.stars,
          forks: data.forks,
          avatarUrl: data.avatarUrl,
          topics: JSON.stringify(data.topics),
          isArchived: data.isArchived,
          isVerifiedOrg,
          blobSha: data.sha,
          pushedAt: data.pushedAt,
          fileCommittedAt: data.fileCommittedAt,
          submittedBy: submittedBy ?? null,
          status: status ?? (data.stars >= 50 ? "approved" : "pending"),
        })
      }

      return skills
    })

    if (parsedSkillsData.length === 0) {
      return { success: true, total: skillPaths.length, synced: 0, message: "No valid skills parsed" }
    }

    // Step 5: Batch upsert skills
    await step.run("upsert-skills", async () => {
      const skillsToUpsert: NewSkill[] = parsedSkillsData.map((s) => ({
        ...s,
        lastSeenAt: new Date(),
        repoUpdatedAt: s.pushedAt ? new Date(s.pushedAt) : null,
        fileUpdatedAt: s.fileCommittedAt ? new Date(s.fileCommittedAt) : null,
      }))
      await batchUpsertSkills(skillsToUpsert)
    })

    // Step 6: Assign categories
    const categoryLinks = await step.run("assign-categories", async () => {
      const links: Array<{ skillId: string; categoryIds: string[] }> = []

      for (const skill of parsedSkillsData) {
        const topics = parseTopics(skill.topics ?? null)
        const categoryIds = mapSkillToCategories(skill.name, skill.description ?? "", topics)

        if (categoryIds.length > 0) {
          links.push({ skillId: skill.id, categoryIds })
        }
      }

      return links
    })

    if (categoryLinks.length > 0) {
      await step.run("persist-categories", async () => {
        await batchLinkSkillsToCategories(categoryLinks)
      })
    }

    // Step 7: Queue AI categorization for skills without categories
    const skillsNeedingAI = parsedSkillsData
      .filter((s) => !categoryLinks.some((l) => l.skillId === s.id))
      .map((s) => s.id)

    if (skillsNeedingAI.length > 0) {
      await step.sendEvent("queue-ai-categorization", {
        name: "categories/assign.ai",
        data: { skillIds: skillsNeedingAI, mode: "insert-if-empty" },
      })
    }

    return {
      success: true,
      total: skillPaths.length,
      synced: parsedSkillsData.length,
      categorized: categoryLinks.length,
      queuedForAI: skillsNeedingAI.length,
      skills: parsedSkillsData.map((s) => ({ id: s.id, name: s.name, path: s.path })),
    }
  }
)

export const reindexSkill = inngest.createFunction(
  {
    id: "reindex-skill",
    name: "Re-index Single Skill",
    concurrency: { limit: 5 },
    retries: 2,
  },
  { event: "skill/reindex" },
  async ({ event, step }) => {
    const { skillId, refreshCategories } = event.data as {
      skillId: string
      refreshCategories?: boolean
    }

    if (!skillId) {
      return { success: false, error: "Missing skillId" }
    }

    // Parse skill ID to get owner/repo/path
    const parts = skillId.split("/")
    if (parts.length < 3) {
      return { success: false, error: "Invalid skillId format" }
    }

    const owner = parts[0]
    const repo = parts[1]
    const path = parts.slice(2).join("/")

    // Fetch fresh data from GitHub
    const skillData = await step.run("fetch-skill", async () => {
      const data = await batchFetchSkills([{ owner, repo, path }])
      return data.get(`${owner}/${repo}/${path}`)
    })

    if (!skillData || !skillData.content) {
      return { success: false, error: "Failed to fetch skill from GitHub" }
    }

    // Parse skill content
    const parsed = parseSkillMd(skillData.content)
    if (!parsed.success) {
      return { success: false, error: `Parse failed: ${parsed.error}` }
    }

    // Fetch owner verification
    const isVerifiedOrg = await step.run("fetch-verification", async () => {
      const verification = await batchFetchOwnersVerification([owner])
      return verification.get(owner.toLowerCase()) ?? false
    })

    // Update skill in database
    await step.run("update-skill", async () => {
      const skill: NewSkill = {
        id: skillId,
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description,
        owner: owner.toLowerCase(),
        repo: repo.toLowerCase(),
        path,
        url: `https://github.com/${owner}/${repo}/blob/HEAD/${path}`,
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
        compatibility: parsed.data.compatibility ?? null,
        allowedTools: normalizeAllowedTools(parsed.data["allowed-tools"])
          ? JSON.stringify(normalizeAllowedTools(parsed.data["allowed-tools"]))
          : null,
        stars: skillData.stars,
        forks: skillData.forks,
        avatarUrl: skillData.avatarUrl,
        topics: JSON.stringify(skillData.topics),
        isArchived: skillData.isArchived,
        isVerifiedOrg,
        blobSha: skillData.sha,
        lastSeenAt: new Date(),
        repoUpdatedAt: skillData.pushedAt ? new Date(skillData.pushedAt) : null,
        fileUpdatedAt: skillData.fileCommittedAt ? new Date(skillData.fileCommittedAt) : null,
      }
      await batchUpsertSkills([skill])
    })

    // Optionally refresh categories
    if (refreshCategories) {
      await step.sendEvent("refresh-categories", {
        name: "categories/assign.ai",
        data: { skillIds: [skillId], mode: "replace" },
      })
    }

    return {
      success: true,
      skillId,
      name: parsed.data.name,
      refreshedCategories: refreshCategories ?? false,
    }
  }
)

export const cleanupStaleSkills = inngest.createFunction(
  {
    id: "cleanup-stale-skills",
    name: "Cleanup Stale Skills",
    concurrency: { limit: 1 },
    retries: 1,
  },
  { cron: "0 4 * * 0" }, // Every Sunday at 04:00 UTC
  async ({ step }) => {
    const BATCH_SIZE = 100
    const STALE_THRESHOLD_DAYS = 30

    // Get skills that haven't been seen recently
    const staleSkills = await step.run("get-stale-skills", async () => {
      const { db } = await import("@/lib/db")
      const { skills } = await import("@/lib/db/schema")
      const { lt, and, ne } = await import("drizzle-orm")

      const threshold = new Date()
      threshold.setDate(threshold.getDate() - STALE_THRESHOLD_DAYS)

      return db
        .select({
          id: skills.id,
          owner: skills.owner,
          repo: skills.repo,
          path: skills.path,
          lastSeenAt: skills.lastSeenAt,
        })
        .from(skills)
        .where(
          and(
            lt(skills.lastSeenAt, threshold),
            ne(skills.status, "rejected")
          )
        )
        .limit(BATCH_SIZE)
    })

    if (staleSkills.length === 0) {
      return { checked: 0, archived: 0, deleted: 0 }
    }

    // Check each skill's existence on GitHub
    const skillItems = staleSkills.map((s) => ({
      owner: s.owner,
      repo: s.repo,
      path: s.path,
    }))

    const existenceMap = await step.run("check-existence", async () => {
      const data = await batchFetchSkills(skillItems)
      const result: Record<string, boolean> = {}
      for (const skill of staleSkills) {
        const key = `${skill.owner}/${skill.repo}/${skill.path}`
        result[skill.id] = data.has(key) && data.get(key)?.content !== null
      }
      return result
    })

    // Update or mark skills based on existence
    const toArchive: string[] = []
    const toUpdate: string[] = []

    for (const skill of staleSkills) {
      if (existenceMap[skill.id]) {
        toUpdate.push(skill.id)
      } else {
        toArchive.push(skill.id)
      }
    }

    // Mark non-existent skills as archived (soft delete)
    if (toArchive.length > 0) {
      await step.run("archive-skills", async () => {
        const { db } = await import("@/lib/db")
        const { skills } = await import("@/lib/db/schema")
        const { inArray } = await import("drizzle-orm")

        await db
          .update(skills)
          .set({ isArchived: true, updatedAt: new Date() })
          .where(inArray(skills.id, toArchive))
      })
    }

    // Update lastSeenAt for existing skills
    if (toUpdate.length > 0) {
      await step.run("update-last-seen", async () => {
        const { db } = await import("@/lib/db")
        const { skills } = await import("@/lib/db/schema")
        const { inArray } = await import("drizzle-orm")

        await db
          .update(skills)
          .set({ lastSeenAt: new Date(), updatedAt: new Date() })
          .where(inArray(skills.id, toUpdate))
      })
    }

    return {
      checked: staleSkills.length,
      archived: toArchive.length,
      stillExists: toUpdate.length,
    }
  }
)

export const triggerRepoSync = inngest.createFunction(
  {
    id: "trigger-repo-sync",
    name: "Manual Repo Sync Trigger",
  },
  { event: "repo/trigger-sync" },
  async ({ event, step }) => {
    const { owner, repo, submittedBy, status } = event.data as {
      owner: string
      repo: string
      submittedBy?: string
      status?: "pending" | "approved"
    }

    return step.invoke("run-repo-sync", {
      function: syncRepoSkills,
      data: { owner, repo, submittedBy, status },
    })
  }
)
