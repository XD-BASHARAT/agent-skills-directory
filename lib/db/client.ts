import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please add it to your .env.local file."
    )
  }

  if (typeof window !== "undefined") {
    throw new Error(
      "Database client cannot be used in client-side code. " +
        "DATABASE_URL must remain server-side only."
    )
  }

  return url
}

let _queryClient: ReturnType<typeof postgres> | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getQueryClient() {
  if (!_queryClient) {
    _queryClient = postgres(getDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      statement_timeout: 30000, // 30 seconds - prevent hanging queries
      prepare: false,
    })
  }
  return _queryClient
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getQueryClient(), { schema })
  }
  return _db
}

export function getDbPool() {
  return getDb()
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return Reflect.get(getDb(), prop)
  },
})

export const dbPool = db

export async function closeConnection() {
  if (_queryClient) {
    await _queryClient.end()
    _queryClient = null
    _db = null
  }
}

export type Database = ReturnType<typeof getDb>
export type DatabasePool = Database
