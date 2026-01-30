export class DatabaseError extends Error {
  readonly code: string | undefined
  readonly cause: unknown

  constructor(message: string, code?: string, cause?: unknown) {
    super(message)
    this.name = "DatabaseError"
    this.code = code
    this.cause = cause
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entity: string, identifier: string) {
    super(`${entity} not found: ${identifier}`, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class UniqueConstraintError extends DatabaseError {
  readonly field: string

  constructor(field: string) {
    super(`Duplicate value for field: ${field}`, "UNIQUE_CONSTRAINT")
    this.name = "UniqueConstraintError"
    this.field = field
  }
}

export class ForeignKeyError extends DatabaseError {
  constructor(message: string) {
    super(message, "FOREIGN_KEY")
    this.name = "ForeignKeyError"
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, "CONNECTION_ERROR", cause)
    this.name = "ConnectionError"
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

export function handleDatabaseError(error: unknown): never {
  if (error instanceof DatabaseError) {
    throw error
  }

  const message = error instanceof Error ? error.message : String(error)

  if (message.includes("unique constraint") || message.includes("duplicate key")) {
    const match = message.match(/Key \((\w+)\)=/)
    throw new UniqueConstraintError(match?.[1] ?? "unknown")
  }

  if (message.includes("foreign key constraint")) {
    throw new ForeignKeyError(message)
  }

  if (message.includes("does not exist")) {
    throw new NotFoundError("Resource", "unknown")
  }

  if (
    message.includes("ECONNREFUSED") ||
    message.includes("connection") ||
    message.includes("timeout")
  ) {
    throw new ConnectionError(message, error)
  }

  throw new DatabaseError(message, undefined, error)
}

export function wrapDatabaseCall<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((error) => handleDatabaseError(error))
}
