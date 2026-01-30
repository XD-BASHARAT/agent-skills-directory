import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const postgresUrlSchema = z
  .string()
  .refine(
    (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
    { message: "DATABASE_URL must be a valid PostgreSQL connection string" }
  )

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: postgresUrlSchema,

    // GitHub
    GITHUB_TOKEN: z.string().min(1).optional(),
    GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Auth (Clerk)
    CLERK_SECRET_KEY: z.string().min(1).optional(),

    // Sync & Indexing
    SYNC_SECRET_TOKEN: z.string().min(1).optional(),
    INDEXNOW_KEY: z.string().min(1).optional(),

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // Inngest (Background Jobs)
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),

    // AI (Google Gemini)
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).optional(),

    // Debug/Performance
    PERF_LOG: z.enum(["true", "false"]).optional(),

    // Vercel (auto-injected)
    VERCEL_URL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // GitHub
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,

    // Auth (Clerk)
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

    // Sync & Indexing
    SYNC_SECRET_TOKEN: process.env.SYNC_SECRET_TOKEN,
    INDEXNOW_KEY: process.env.INDEXNOW_KEY,

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    // Inngest
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,

    // AI
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,

    // Debug
    PERF_LOG: process.env.PERF_LOG,

    // Vercel
    VERCEL_URL: process.env.VERCEL_URL,

    // Client
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.NODE_ENV === "development",
  emptyStringAsUndefined: true,
})
