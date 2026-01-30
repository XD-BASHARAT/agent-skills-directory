import { inngest } from "./client"
import { parallelSync } from "@/lib/features/skills/parallel-sync"
import {
  createSyncJob,
  updateSyncJob,
  getRunningSyncJob,
  setLastDiscoveryDate,
} from "@/lib/db/queries"

const FREE_TIER_LIMITS = {
  MAX_SKILLS_PER_RUN: 200,
  MIN_STARS: 10,
  MAX_STEPS: 50,
  CRON_INTERVAL_HOURS: 6,
} as const

export const fastDiscoverSkills = inngest.createFunction(
  {
    id: "fast-discover-skills",
    name: "Fast Parallel Discovery (Free Tier)",
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: "0 */6 * * *" }, // Every 6 hours (4 runs/day)
  async ({ step }) => {
    const runningJob = await step.run("check-running", async () => {
      return getRunningSyncJob("fast-discovery")
    })

    if (runningJob?.startedAt && Date.now() - new Date(runningJob.startedAt).getTime() < 3600000) {
      return { skipped: true, reason: "Discovery job still running" }
    }

    const jobId = `fast-discovery-${Date.now()}`
    await step.run("create-job", async () => {
      await createSyncJob({
        id: jobId,
        type: "fast-discovery",
        status: "running",
        startedAt: new Date(),
      })
    })

    const result = await step.run("parallel-sync", async () => {
      return parallelSync({
        maxResults: FREE_TIER_LIMITS.MAX_SKILLS_PER_RUN,
        minStars: FREE_TIER_LIMITS.MIN_STARS,
        skipExisting: true,
        streamingUpsert: true,
        onProgress: (msg) => console.log(msg),
      })
    })

    await step.run("update-watermark", async () => {
      await setLastDiscoveryDate(new Date())
    })

    await step.run("complete-job", async () => {
      await updateSyncJob(jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: result.indexed,
        metadata: JSON.stringify({
          discovered: result.discovered,
          filtered: result.filtered,
          indexed: result.indexed,
          errors: result.errors,
          durationMs: result.duration,
        }),
      })
    })

    return {
      ...result,
      durationFormatted: `${(result.duration / 1000).toFixed(1)}s`,
      stepsUsed: 5,
    }
  }
)

export const bulkDiscoverSkills = inngest.createFunction(
  {
    id: "bulk-discover-skills",
    name: "Bulk Discovery (Manual, Free Tier Safe)",
    concurrency: { limit: 1 },
    retries: 1,
  },
  { event: "discovery/bulk" },
  async ({ event, step }) => {
    const { 
      maxResults = 500,
      minStars = 5 
    } = event.data as {
      maxResults?: number
      minStars?: number
    }

    const safeMaxResults = Math.min(maxResults, 1000)

    const jobId = `bulk-discovery-${Date.now()}`
    await step.run("create-job", async () => {
      await createSyncJob({
        id: jobId,
        type: "bulk-discovery",
        status: "running",
        startedAt: new Date(),
      })
    })

    const result = await step.run("parallel-sync", async () => {
      return parallelSync({
        maxResults: safeMaxResults,
        minStars,
        skipExisting: true,
        streamingUpsert: true,
        onProgress: (msg) => console.log(msg),
      })
    })

    await step.run("complete-job", async () => {
      await updateSyncJob(jobId, {
        status: "completed",
        completedAt: new Date(),
        itemsProcessed: result.indexed,
        metadata: JSON.stringify({
          discovered: result.discovered,
          filtered: result.filtered,
          indexed: result.indexed,
          errors: result.errors,
          durationMs: result.duration,
        }),
      })
    })

    return {
      ...result,
      durationFormatted: `${(result.duration / 1000).toFixed(1)}s`,
      stepsUsed: 3,
    }
  }
)

export const incrementalSync = inngest.createFunction(
  {
    id: "incremental-sync",
    name: "Incremental Daily Sync (Free Tier)",
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const BATCH_SIZE = 150
    const BATCHES = 3
    
    let totalIndexed = 0
    let totalDiscovered = 0

    for (let i = 0; i < BATCHES; i++) {
      const batchResult = await step.run(`batch-${i + 1}`, async () => {
        return parallelSync({
          maxResults: BATCH_SIZE,
          minStars: 10,
          skipExisting: true,
          streamingUpsert: true,
          onProgress: (msg) => console.log(`[Batch ${i + 1}] ${msg}`),
        })
      })

      totalIndexed += batchResult.indexed
      totalDiscovered += batchResult.discovered

      if (batchResult.discovered === 0) {
        break
      }
    }

    await step.run("update-watermark", async () => {
      await setLastDiscoveryDate(new Date())
    })

    return {
      totalDiscovered,
      totalIndexed,
      batches: BATCHES,
      stepsUsed: BATCHES + 1,
    }
  }
)

export const triggerBulkDiscovery = inngest.createFunction(
  {
    id: "trigger-bulk-discovery",
    name: "Trigger Bulk Discovery",
  },
  { event: "discovery/trigger-bulk" },
  async ({ event, step }) => {
    const { maxResults, minStars } = event.data as {
      maxResults?: number
      minStars?: number
    }

    await step.sendEvent("start-bulk", {
      name: "discovery/bulk",
      data: { maxResults, minStars },
    })

    return { triggered: true, maxResults, minStars }
  }
)
