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
    DATABASE_URL: postgresUrlSchema,
    GITHUB_TOKEN: z.string().min(1).optional(),
    SYNC_SECRET_TOKEN: z.string().min(1).optional(),
    GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),
    INDEXNOW_KEY: z.string().min(1).optional(),
    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    SYNC_SECRET_TOKEN: process.env.SYNC_SECRET_TOKEN,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    INDEXNOW_KEY: process.env.INDEXNOW_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "development",
  emptyStringAsUndefined: true,
})
