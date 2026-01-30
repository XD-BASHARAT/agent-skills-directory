import { getDb } from "./client"
import { ConnectionError } from "./errors"

type TransactionClient = Parameters<ReturnType<typeof getDb>["transaction"]>[0] extends (
  tx: infer TTx
) => unknown
  ? TTx
  : never

type TransactionFn<T> = (tx: TransactionClient) => Promise<T> | T

export async function withTransaction<T>(
  callback: TransactionFn<T>
): Promise<T> {
  const db = getDb()
  return db.transaction(callback as Parameters<ReturnType<typeof getDb>["transaction"]>[0]) as Promise<T>
}

const RETRYABLE_ERRORS = [
  "deadlock",
  "serialization",
  "could not serialize",
  "connection",
  "timeout",
] as const

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return RETRYABLE_ERRORS.some((pattern) => message.includes(pattern))
}

export async function withTransactionRetry<T>(
  callback: TransactionFn<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 100 } = options
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (!isRetryableError(lastError) || attempt === maxRetries) {
        throw lastError
      }

      const jitter = Math.random() * 50
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + jitter, 5000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError ?? new ConnectionError("Transaction failed after retries")
}
