import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import {
  syncMetadata,
  syncSkillFromWebhook,
  triggerMetadataSync,
  assignCategoriesNightly,
  assignCategoriesAI,
  triggerAICategorization,
  discoverNewSkills,
  triggerDiscovery,
  syncRepoSkills,
  triggerRepoSync,
  reindexSkill,
  cleanupStaleSkills,
} from "@/lib/inngest/functions"
import {
  fastDiscoverSkills,
  bulkDiscoverSkills,
  incrementalSync,
  triggerBulkDiscovery,
} from "@/lib/inngest/parallel-discovery"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Cron jobs
    syncMetadata,           // Every hour - sync repo metadata
    assignCategoriesNightly, // Daily 03:00 UTC - AI categorization
    discoverNewSkills,      // Every 6 hours - auto-discover new skills (legacy)
    fastDiscoverSkills,     // Every 4 hours - fast parallel discovery (new)
    cleanupStaleSkills,     // Weekly Sunday 04:00 UTC - cleanup stale skills
    
    // Event-driven functions
    syncSkillFromWebhook,   // github/push event
    assignCategoriesAI,     // categories/assign.ai event
    syncRepoSkills,         // repo/sync event
    reindexSkill,           // skill/reindex event
    bulkDiscoverSkills,     // discovery/bulk event (free tier safe)
    incrementalSync,        // Daily incremental sync (free tier safe)
    
    // Manual triggers
    triggerMetadataSync,    // sync/metadata event
    triggerAICategorization, // categories/trigger event
    triggerDiscovery,       // discovery/trigger event
    triggerRepoSync,        // repo/trigger-sync event
    triggerBulkDiscovery,   // discovery/trigger-bulk event (new)
  ],
})
