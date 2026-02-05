import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import {
  syncMetadata,
  triggerMetadataSync,
  assignCategoriesNightly,
  assignCategoriesAI,
  triggerAICategorization,
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
    assignCategoriesAI,     // categories/assign.ai event
    reindexSkill,           // skill/reindex event
    
    // Manual triggers
    triggerMetadataSync,    // sync/metadata event
    triggerAICategorization, // categories/trigger event
  ],
})
