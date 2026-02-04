import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import {
  syncMetadata,
  syncSkillFromWebhook,
  triggerMetadataSync,
  assignCategoriesNightly,
  assignCategoriesAI,
  triggerAICategorization,
  syncRepoSkills,
  triggerRepoSync,
  reindexSkill,
  cleanupStaleSkills,
} from "@/lib/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Cron jobs
    syncMetadata,           // Every hour - sync repo metadata
    assignCategoriesNightly, // Daily 03:00 UTC - AI categorization
    cleanupStaleSkills,     // Weekly Sunday 04:00 UTC - cleanup stale skills
    
    // Event-driven functions
    syncSkillFromWebhook,   // github/push event
    assignCategoriesAI,     // categories/assign.ai event
    syncRepoSkills,         // repo/sync event
    reindexSkill,           // skill/reindex event
    
    // Manual triggers
    triggerMetadataSync,    // sync/metadata event
    triggerAICategorization, // categories/trigger event
    triggerRepoSync,        // repo/trigger-sync event
  ],
})
