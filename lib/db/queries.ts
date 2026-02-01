import { eq, ilike, or, desc, asc, sql, and, inArray, ne } from "drizzle-orm"
import { z } from "zod"
import { db, dbPool } from "./client"
import {
  skills,
  categories,
  skillCategories,
  syncJobs,
  syncState,
  type NewSkill,
  type NewSyncJob,
  type Skill,
} from "./schema"
import { CATEGORIES, toDatabaseCategory } from "@/lib/categories"
import type { CategorySummary } from "@/types"

const BATCH_SIZE = 50
const MAX_PER_PAGE = 100
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

const dbNullableDate = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return value
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? value : parsed
    }
    return value
  },
  z.date().nullable()
)

const dbNullableNumber = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isNaN(parsed) ? value : parsed
    }
    return value
  },
  z.number().nullable()
)

const dbNumber = z.preprocess(
  (value) => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isNaN(parsed) ? value : parsed
    }
    return value
  },
  z.number()
)

function parseDbRows<T extends z.ZodTypeAny>(schema: T, rows: unknown, label: string) {
  const parsed = z.array(schema).safeParse(rows)
  if (!parsed.success) {
    console.error(`Invalid database response for ${label}:`, parsed.error.flatten())
    throw new Error("Invalid database response")
  }
  return parsed.data
}

export type GetSkillsOptions = {
  query?: string
  page?: number
  perPage?: number
  descriptionLength?: number
  status?: string
  sortBy?: "stars_desc" | "name_asc" | "name_desc" | "recent" | "last_commit"
  category?: string
  categoryList?: string[]
}

/**
 * Ensure the categories table is populated with the registry definitions.
 * This is idempotent and safe to call before writing to skill_categories.
 */
export async function ensureCategoriesSeeded() {
  const values = CATEGORIES.map((category) => toDatabaseCategory(category))

  await db
    .insert(categories)
    .values(values)
    .onConflictDoUpdate({
      target: categories.id,
      set: {
        name: sql`EXCLUDED.name`,
        slug: sql`EXCLUDED.slug`,
        description: sql`EXCLUDED.description`,
        color: sql`EXCLUDED.color`,
        order: sql`EXCLUDED.order`,
      },
    })
}

/**
 * Build search conditions with SQL injection protection
 * 
 * Security measures:
 * 1. ILIKE patterns: Escapes special SQL LIKE characters (% _ \) to prevent injection
 * 2. Full-text search: Uses websearch_to_tsquery() which safely handles user input
 * 3. Input sanitization: Removes non-alphanumeric characters before passing to SQL
 * 4. Defense in depth: Validates sanitized string length and ensures non-empty
 * 
 * @param query - User-provided search query (already validated at API level, max 200 chars)
 * @returns SQL condition object safe for use in parameterized queries
 */
function buildSearchConditions(query: string) {
  // Defense in depth: Ensure query is not empty and has reasonable length
  // (API level already limits to 200 chars, but validate here too)
  if (!query || query.length === 0 || query.length > 200) {
    throw new Error("Invalid query: empty or too long")
  }
  
  // Sanitize query for ILIKE - escape special SQL LIKE characters (% _ \)
  // This prevents SQL injection via LIKE pattern matching
  const likeEscaped = query.replace(/[%_\\]/g, '\\$&')
  
  // Sanitize query for full-text search - remove special characters that break tsquery
  // Keep only alphanumeric and spaces (Unicode-aware)
  const sanitized = query.trim().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  
  // Defense in depth: Validate sanitized string is reasonable length
  // Even after sanitization, ensure it's not suspiciously long
  if (sanitized.length > 200) {
    throw new Error("Invalid query: sanitized string too long")
  }
  
  // If no valid words after sanitization, fall back to ILIKE only
  // This is safe because likeEscaped is properly escaped
  if (!sanitized || sanitized.length === 0) {
    return or(
      ilike(skills.name, `%${likeEscaped}%`),
      ilike(skills.owner, `%${likeEscaped}%`),
      ilike(skills.description, `%${likeEscaped}%`)
    )
  }
  
  // Use websearch_to_tsquery which handles user input safely (available in PostgreSQL 11+)
  // It automatically handles quotes, operators, and special characters, preventing injection
  // The sanitized string is passed as a parameter, not concatenated into SQL
  return or(
    // Primary: Full-text search using websearch_to_tsquery (safe for user input)
    // Note: sanitized is passed as parameter, not string interpolation
    sql`to_tsvector('english', COALESCE(${skills.searchText}, '')) @@ websearch_to_tsquery('english', ${sanitized})`,
    // Fallback: ILIKE for partial matches (more reliable than trigram)
    // likeEscaped is properly escaped, preventing LIKE injection
    ilike(skills.name, `%${likeEscaped}%`),
    ilike(skills.owner, `%${likeEscaped}%`),
    ilike(skills.description, `%${likeEscaped}%`)
  )
}

function buildCategorySubquery(categorySlugs: string[]) {
  return sql`${skills.id} IN (
    SELECT ${skillCategories.skillId} 
    FROM ${skillCategories} 
    INNER JOIN ${categories} ON ${skillCategories.categoryId} = ${categories.id}
    WHERE ${categories.slug} IN (${sql.join(
      categorySlugs.map((s) => sql`${s}`),
      sql`, `
    )})
  )`
}

function dedupeSkillsByOwnerSlug<T extends { owner: string; slug: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of items) {
    const key = `${item.owner}/${item.slug}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

function formatShortDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return shortDateFormatter.format(date)
}

export async function getSkills(options: GetSkillsOptions = {}) {
  const perfEnabled = process.env.PERF_LOG === "true"
  const perfStart = perfEnabled ? performance.now() : 0
  const {
    query = "",
    page = 1,
    perPage = 30,
    descriptionLength,
    status,
    sortBy = "stars_desc",
    category,
    categoryList,
  } = options

  // Validate and sanitize inputs
  const safePage = Math.max(1, Math.min(10000, Math.floor(page)))
  const safePerPage = Math.min(Math.max(1, Math.floor(perPage)), MAX_PER_PAGE)
  const safeQuery = query.slice(0, 200).trim() // Limit query length
  const offset = (safePage - 1) * safePerPage
  const safeDescriptionLength =
    typeof descriptionLength === "number" && Number.isFinite(descriptionLength) && descriptionLength > 0
      ? Math.min(Math.floor(descriptionLength), 1000)
      : undefined

  const conditions = []

  if (safeQuery) {
    try {
      conditions.push(buildSearchConditions(safeQuery))
    } catch (error) {
      // Log error for debugging but don't expose details to prevent information leakage
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("Search condition build error:", errorMessage)
      
      // Defense in depth: If buildSearchConditions fails, use safe fallback
      // Escape the query to prevent SQL injection even in fallback path
      const escapedQuery = safeQuery.replace(/[%_\\]/g, '\\$&')
      conditions.push(
        or(
          ilike(skills.name, `%${escapedQuery}%`),
          ilike(skills.owner, `%${escapedQuery}%`),
          ilike(skills.description, `%${escapedQuery}%`)
        )
      )
    }
  }

  conditions.push(status ? eq(skills.status, status) : ne(skills.status, "rejected"))

  const categorySlugs = categoryList?.length ? categoryList : category ? [category] : []
  if (categorySlugs.length > 0) {
    conditions.push(buildCategorySubquery(categorySlugs))
  }

  const whereClause = and(...conditions)

  // Build ORDER BY clause for raw SQL
  const orderByClause = (() => {
    switch (sortBy) {
      case "recent":
        return sql`indexed_at DESC NULLS LAST, id DESC`
      case "last_commit":
        return sql`file_updated_at DESC NULLS LAST, id DESC`
      case "name_asc":
        return sql`name ASC, id ASC`
      case "name_desc":
        return sql`name DESC, id DESC`
      default:
        return sql`stars DESC NULLS LAST, id DESC`
    }
  })()

  const descriptionSelect = safeDescriptionLength
    ? sql`LEFT(description, ${safeDescriptionLength})`
    : sql`description`

  // Use DISTINCT ON to pick the latest row per owner/slug, then apply requested sorting.
  const [skillsList, countResult] = await Promise.all([
    db.execute(sql`
      WITH deduped_skills AS (
        SELECT DISTINCT ON (owner, slug)
          id, name, slug,
          ${descriptionSelect} as description,
          owner, repo, path, url, avatar_url, stars,
          is_verified_org, status, file_updated_at, repo_updated_at, indexed_at, security_scan
        FROM skills
        WHERE ${whereClause}
        ORDER BY owner, slug, indexed_at DESC NULLS LAST, id DESC
      )
      SELECT * FROM deduped_skills
      ORDER BY ${orderByClause}
      LIMIT ${safePerPage}
      OFFSET ${offset}
    `),
    db
      .select({
        count: sql<number>`count(distinct ${sql`${skills.owner} || '/' || ${skills.slug}`})`,
      })
      .from(skills)
      .where(whereClause),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  
  const skillsListRowSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    owner: z.string(),
    repo: z.string(),
    path: z.string(),
    url: z.string(),
    avatar_url: z.string().nullable(),
    stars: dbNullableNumber,
    is_verified_org: z.boolean().nullable(),
    status: z.string().nullable(),
    file_updated_at: dbNullableDate,
    repo_updated_at: dbNullableDate,
    indexed_at: dbNullableDate,
    security_scan: z.string().nullable(),
  })

  const rows = parseDbRows(skillsListRowSchema, skillsList, "getSkills")

  const dedupedSkills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    owner: row.owner,
    repo: row.repo,
    path: row.path,
    url: row.url,
    avatarUrl: row.avatar_url,
    stars: row.stars,
    isVerifiedOrg: row.is_verified_org,
    status: row.status,
    fileUpdatedAt: row.file_updated_at,
    repoUpdatedAt: row.repo_updated_at,
    indexedAt: row.indexed_at,
    securityScan: row.security_scan,
    updatedAtLabel: formatShortDate(row.file_updated_at ?? row.repo_updated_at),
  }))

  if (perfEnabled) {
    const durationMs = Math.round(performance.now() - perfStart)
    console.info("[perf] getSkills", {
      durationMs,
      page: safePage,
      perPage: safePerPage,
      sortBy,
      hasQuery: Boolean(query),
      categoryCount: categorySlugs.length,
    })
  }

  return {
    skills: dedupedSkills,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.ceil(total / safePerPage),
  }
}

export async function getSkillById(id: string) {
  const [result] = await db.select().from(skills).where(eq(skills.id, id)).limit(1)
  return result ?? null
}

export async function getSkillByPath(owner: string, repo: string, path: string) {
  return getSkillById(`${owner}/${repo}/${path}`)
}

export async function getSkillBySlug(owner: string, slug: string) {
  const [result] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.owner, owner), eq(skills.slug, slug)))
    .orderBy(desc(skills.indexedAt), desc(skills.repoUpdatedAt), desc(skills.updatedAt))
    .limit(1)
  return result ?? null
}

export async function getSkillsByOwner(owner: string): Promise<Array<Skill & { categories: CategorySummary[]; category: CategorySummary | null; updatedAtLabel: string | null }>> {
  const skillsList = await db.select().from(skills).where(eq(skills.owner, owner)).orderBy(desc(skills.stars), desc(skills.id))
  
  const dedupedSkills: Array<Skill & { updatedAtLabel: string | null }> = dedupeSkillsByOwnerSlug(skillsList).map((skill) => ({
    ...skill,
    updatedAtLabel: formatShortDate(skill.fileUpdatedAt ?? skill.repoUpdatedAt),
  }))

  // Fetch categories for each skill
  const skillIds = dedupedSkills.map((s) => s.id)
  const categoryRelations = skillIds.length > 0
    ? await db
        .select({
          skillId: skillCategories.skillId,
          categoryId: skillCategories.categoryId,
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          order: categories.order,
        })
        .from(skillCategories)
        .innerJoin(categories, eq(skillCategories.categoryId, categories.id))
        .where(inArray(skillCategories.skillId, skillIds))
    : []

  // Create a map of skillId to categories
  const skillsWithCategories: Array<Skill & { categories: CategorySummary[]; category: CategorySummary | null; updatedAtLabel: string | null }> = dedupedSkills.map((skill) => {
    const skillCategoriesList = categoryRelations
      .filter((cr) => cr.skillId === skill.id)
      .map((cr) => ({
        id: cr.id,
        name: cr.name,
        slug: cr.slug,
        description: cr.description,
        color: cr.color,
        order: cr.order,
      }))

    return {
      ...skill,
      categories: skillCategoriesList,
      category: skillCategoriesList[0] || null,
    }
  })

  return skillsWithCategories
}

export async function getSkillsForSitemap() {
  const skillsList = await db
    .select({
      owner: skills.owner,
      slug: skills.slug,
      updatedAt: skills.updatedAt,
      repoUpdatedAt: skills.repoUpdatedAt,
      indexedAt: skills.indexedAt,
      status: skills.status,
      stars: skills.stars,
      avatarUrl: skills.avatarUrl,
    })
    .from(skills)
    .where(ne(skills.status, "rejected"))
    .orderBy(desc(skills.stars), desc(skills.indexedAt))

  return dedupeSkillsByOwnerSlug(skillsList)
}

export async function getOwnerInfo(owner: string) {
  // Single optimized query with aggregations
  const result = await db.execute(sql`
    WITH owner_skills AS (
      SELECT DISTINCT ON (owner, slug)
        id, name, slug, description, owner, repo, path, url, raw_url, avatar_url, stars, forks,
        is_verified_org, status, file_updated_at, repo_updated_at, indexed_at, created_at, updated_at,
        compatibility, allowed_tools, topics, is_archived, blob_sha, last_seen_at, submitted_by, search_text,
        security_scan, security_scanned_at
      FROM skills 
      WHERE owner = ${owner}
      ORDER BY owner, slug, indexed_at DESC, id DESC
    ),
    repo_stats AS (
      SELECT 
        repo,
        MAX(COALESCE(stars, 0)) as repo_stars,
        MAX(COALESCE(forks, 0)) as repo_forks
      FROM owner_skills
      GROUP BY repo
    ),
    owner_totals AS (
      SELECT 
        COALESCE(SUM(repo_stars), 0) as total_stars,
        COALESCE(SUM(repo_forks), 0) as total_forks
      FROM repo_stats
    )
    SELECT 
      os.*,
      ot.total_stars,
      ot.total_forks,
      COUNT(*) OVER() as total_skills,
      BOOL_OR(os.status = 'approved') OVER() as has_verified
    FROM owner_skills os
    CROSS JOIN owner_totals ot
    ORDER BY os.stars DESC, os.id DESC
  `)

  const ownerInfoRowSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    owner: z.string(),
    repo: z.string(),
    path: z.string(),
    url: z.string(),
    raw_url: z.string(),
    avatar_url: z.string().nullable(),
    stars: dbNullableNumber,
    forks: dbNullableNumber,
    is_verified_org: z.boolean().nullable(),
    status: z.string().nullable(),
    file_updated_at: dbNullableDate,
    repo_updated_at: dbNullableDate,
    indexed_at: dbNullableDate,
    created_at: dbNullableDate,
    updated_at: dbNullableDate,
    compatibility: z.string().nullable(),
    allowed_tools: z.string().nullable(),
    topics: z.string().nullable(),
    is_archived: z.boolean().nullable(),
    blob_sha: z.string().nullable(),
    last_seen_at: dbNullableDate,
    submitted_by: z.string().nullable(),
    search_text: z.string().nullable(),
    security_scan: z.string().nullable(),
    security_scanned_at: dbNullableDate,
    total_stars: dbNumber,
    total_forks: dbNumber,
    total_skills: dbNumber,
    has_verified: z.boolean(),
  })

  const rows = parseDbRows(ownerInfoRowSchema, result, "getOwnerInfo")

  if (rows.length === 0) return null

  const firstRow = rows[0]
  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    owner: row.owner,
    repo: row.repo,
    path: row.path,
    url: row.url,
    rawUrl: row.raw_url,
    avatarUrl: row.avatar_url,
    stars: row.stars,
    forks: row.forks,
    isVerifiedOrg: row.is_verified_org,
    status: row.status,
    fileUpdatedAt: row.file_updated_at,
    repoUpdatedAt: row.repo_updated_at,
    indexedAt: row.indexed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    compatibility: row.compatibility,
    allowedTools: row.allowed_tools,
    topics: row.topics,
    isArchived: row.is_archived,
    blobSha: row.blob_sha,
    lastSeenAt: row.last_seen_at,
    submittedBy: row.submitted_by,
    searchText: row.search_text,
    securityScan: row.security_scan,
    securityScannedAt: row.security_scanned_at,
    updatedAtLabel: formatShortDate(row.file_updated_at ?? row.repo_updated_at),
    categories: [], // Will be populated separately if needed
    category: null,
  }))

  return {
    owner,
    avatarUrl: firstRow.avatar_url,
    totalSkills: Number(firstRow.total_skills),
    totalStars: Number(firstRow.total_stars),
    totalForks: Number(firstRow.total_forks),
    hasVerified: firstRow.has_verified,
    isVerifiedOrg: firstRow.is_verified_org ?? false,
    skills,
  }
}

function buildSearchText(skill: NewSkill): string {
  return `${skill.name} ${skill.description} ${skill.owner} ${skill.repo}`.toLowerCase()
}

export async function upsertSkill(skill: NewSkill) {
  const searchText = buildSearchText(skill)
  const now = new Date()

  return db
    .insert(skills)
    .values({ ...skill, searchText })
    .onConflictDoUpdate({
      target: skills.id,
      set: {
        name: skill.name,
        description: skill.description,
        compatibility: skill.compatibility,
        allowedTools: skill.allowedTools,
        stars: skill.stars,
        forks: skill.forks,
        avatarUrl: skill.avatarUrl,
        topics: skill.topics,
        isArchived: skill.isArchived,
        blobSha: skill.blobSha,
        lastSeenAt: skill.lastSeenAt,
        repoUpdatedAt: skill.repoUpdatedAt,
        fileUpdatedAt: skill.fileUpdatedAt,
        indexedAt: now,
        updatedAt: now,
        searchText,
      },
    })
}

export async function batchUpsertSkills(skillsList: NewSkill[]) {
  if (skillsList.length === 0) return { inserted: 0 }

  let totalInserted = 0
  const now = new Date()

  for (let i = 0; i < skillsList.length; i += BATCH_SIZE) {
    const chunk = skillsList.slice(i, i + BATCH_SIZE)
    const values = chunk.map((skill) => ({
      ...skill,
      searchText: buildSearchText(skill),
    }))

    await db
      .insert(skills)
      .values(values)
      .onConflictDoUpdate({
        target: skills.id,
        set: {
          name: sql`EXCLUDED.name`,
          description: sql`EXCLUDED.description`,
          compatibility: sql`EXCLUDED.compatibility`,
          allowedTools: sql`EXCLUDED.allowed_tools`,
          stars: sql`EXCLUDED.stars`,
          forks: sql`EXCLUDED.forks`,
          avatarUrl: sql`EXCLUDED.avatar_url`,
          topics: sql`EXCLUDED.topics`,
          isArchived: sql`EXCLUDED.is_archived`,
          blobSha: sql`EXCLUDED.blob_sha`,
          lastSeenAt: sql`EXCLUDED.last_seen_at`,
          status: sql`CASE
            WHEN EXCLUDED.status = 'approved' THEN 'approved'
            WHEN EXCLUDED.status = 'rejected' THEN 'rejected'
            ELSE ${skills.status}
          END`,
          submittedBy: sql`COALESCE(EXCLUDED.submitted_by, ${skills.submittedBy})`,
          repoUpdatedAt: sql`EXCLUDED.repo_updated_at`,
          fileUpdatedAt: sql`EXCLUDED.file_updated_at`,
          indexedAt: now,
          updatedAt: now,
          searchText: sql`EXCLUDED.search_text`,
        },
      })

    totalInserted += chunk.length
  }

  return { inserted: totalInserted }
}

export async function clearAllSkills() {
  await dbPool.transaction(async (tx) => {
    await tx.delete(skillCategories)
    await tx.delete(skills)
  })
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.order), asc(categories.name))
}

export async function getCategoryBySlug(slug: string) {
  const [result] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)
  return result ?? null
}

export async function getSkillCategories(skillId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(skillCategories)
    .innerJoin(categories, eq(skillCategories.categoryId, categories.id))
    .where(eq(skillCategories.skillId, skillId))
    .orderBy(asc(categories.order))
}

export async function linkSkillToCategories(skillId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return

  await ensureCategoriesSeeded()

  await dbPool.transaction(async (tx) => {
    await tx.delete(skillCategories).where(eq(skillCategories.skillId, skillId))
    await tx.insert(skillCategories).values(categoryIds.map((categoryId) => ({ skillId, categoryId })))
  })
}

export async function batchLinkSkillsToCategories(
  links: Array<{ skillId: string; categoryIds: string[] }>
) {
  if (links.length === 0) return

  await ensureCategoriesSeeded()

  const allValues = links.flatMap(({ skillId, categoryIds }) =>
    categoryIds.map((categoryId) => ({ skillId, categoryId }))
  )

  if (allValues.length === 0) return

  await db.insert(skillCategories).values(allValues).onConflictDoNothing()
}

export async function replaceSkillCategories(
  rows: Array<{ skillId: string; categoryIds: string[] }>
) {
  if (rows.length === 0) return

  await ensureCategoriesSeeded()

  const skillIds = rows.map((r) => r.skillId)
  const inserts = rows.flatMap((r) =>
    r.categoryIds.map((categoryId) => ({ skillId: r.skillId, categoryId }))
  )

  await dbPool.transaction(async (tx) => {
    if (skillIds.length > 0) {
      await tx.delete(skillCategories).where(inArray(skillCategories.skillId, skillIds))
    }
    if (inserts.length > 0) {
      await tx.insert(skillCategories).values(inserts).onConflictDoNothing()
    }
  })
}

export async function getSkillsWithoutCategories(limit = 50) {
  return db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      topics: skills.topics,
    })
    .from(skills)
    .where(
      sql`${skills.id} NOT IN (
        SELECT ${skillCategories.skillId}
        FROM ${skillCategories}
      )`
    )
    .orderBy(desc(skills.createdAt))
    .limit(limit)
}

export async function getSkillsByIds(ids: string[]) {
  if (ids.length === 0) return []
  return db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      topics: skills.topics,
    })
    .from(skills)
    .where(inArray(skills.id, ids))
}

/**
 * Check which skill IDs already exist in the database
 * Returns a Set of existing IDs for fast lookup
 */
export async function getExistingSkillIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  
  const results = await db
    .select({ id: skills.id })
    .from(skills)
    .where(inArray(skills.id, ids))
  
  return new Set(results.map((r) => r.id))
}

type SkillMetadataUpdate = {
  id: string
  stars?: number | null
  forks?: number | null
  topics?: string | null
  isArchived?: boolean | null
  repoUpdatedAt?: Date | null
}

export async function getSkillsNeedingMetadataSync(limit = 200) {
  return db
    .select({
      id: skills.id,
      owner: skills.owner,
      repo: skills.repo,
      stars: skills.stars,
      forks: skills.forks,
      topics: skills.topics,
      isArchived: skills.isArchived,
      repoUpdatedAt: skills.repoUpdatedAt,
    })
    .from(skills)
    .where(ne(skills.status, "rejected"))
    .orderBy(asc(skills.updatedAt))
    .limit(limit)
}

export async function updateSkillsMetadata(updates: SkillMetadataUpdate[]) {
  if (updates.length === 0) return

  const now = new Date()

  await dbPool.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(skills)
        .set({
          ...(update.stars !== undefined && { stars: update.stars }),
          ...(update.forks !== undefined && { forks: update.forks }),
          ...(update.topics !== undefined && { topics: update.topics }),
          ...(update.isArchived !== undefined && { isArchived: update.isArchived }),
          ...(update.repoUpdatedAt !== undefined && { repoUpdatedAt: update.repoUpdatedAt }),
          updatedAt: now,
        })
        .where(eq(skills.id, update.id))
    }
  })
}

export async function createSyncJob(job: NewSyncJob) {
  const [result] = await db.insert(syncJobs).values(job).returning()
  return result
}

export async function getRunningSyncJob(type: string) {
  const [result] = await db
    .select()
    .from(syncJobs)
    .where(and(eq(syncJobs.type, type), eq(syncJobs.status, "running")))
    .orderBy(desc(syncJobs.startedAt), desc(syncJobs.createdAt))
    .limit(1)
  return result ?? null
}

export async function updateSyncJob(
  id: string,
  data: Partial<{
    status: string
    startedAt: Date
    completedAt: Date
    itemsProcessed: number
    itemsFailed: number
    errorMessage: string
    metadata: string
  }>
) {
  return db.update(syncJobs).set(data).where(eq(syncJobs.id, id))
}

export async function getRecentSyncJobs(limit = 10) {
  return db.select().from(syncJobs).orderBy(desc(syncJobs.createdAt)).limit(limit)
}

export async function approveSkill(id: string) {
  const now = new Date()
  return db
    .update(skills)
    .set({
      status: "approved",
      updatedAt: now,
    })
    .where(eq(skills.id, id))
}

export async function rejectSkill(id: string) {
  const now = new Date()
  return db
    .update(skills)
    .set({
      status: "rejected",
      updatedAt: now,
    })
    .where(eq(skills.id, id))
}

const SYNC_STATE_KEYS = {
  LAST_DISCOVERY_PUSHED_AT: "lastDiscoveryPushedAt",
} as const

export async function getSyncState(key: string): Promise<string | null> {
  try {
    const [result] = await db.select().from(syncState).where(eq(syncState.key, key)).limit(1)
    return result?.value ?? null
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not exist")) {
      return null
    }
    throw error
  }
}

export async function setSyncState(key: string, value: string): Promise<void> {
  try {
    const now = new Date()
    await db
      .insert(syncState)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: syncState.key,
        set: { value, updatedAt: now },
      })
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not exist")) {
      console.warn("sync_state table not found, skipping watermark save")
      return
    }
    throw error
  }
}

export async function getLastDiscoveryDate(): Promise<Date | null> {
  const value = await getSyncState(SYNC_STATE_KEYS.LAST_DISCOVERY_PUSHED_AT)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function setLastDiscoveryDate(date: Date): Promise<void> {
  await setSyncState(SYNC_STATE_KEYS.LAST_DISCOVERY_PUSHED_AT, date.toISOString())
}

export type OwnerRanking = {
  owner: string
  avatarUrl: string | null
  totalSkills: number
  totalStars: number
  totalForks: number
  isVerifiedOrg: boolean
}

export async function getOwnerRankings(options: {
  sortBy?: "stars" | "skills" | "forks"
  limit?: number
} = {}): Promise<OwnerRanking[]> {
  const { sortBy = "stars", limit = 100 } = options

  const orderColumn =
    sortBy === "skills"
      ? sql.raw("total_skills")
      : sortBy === "forks"
        ? sql.raw("total_forks")
        : sql.raw("total_stars")

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 500)

  const result = await db.execute(sql`
    WITH unique_repos AS (
      SELECT
        owner,
        repo,
        MAX(avatar_url) as avatar_url,
        MAX(COALESCE(stars, 0)) as stars,
        MAX(COALESCE(forks, 0)) as forks
      FROM skills
      WHERE status != 'rejected'
      GROUP BY owner, repo
    ),
    skill_counts AS (
      SELECT owner, COUNT(DISTINCT slug) as total_skills
      FROM skills
      WHERE status != 'rejected'
      GROUP BY owner
    ),
    owner_verified AS (
      SELECT owner, BOOL_OR(is_verified_org) as is_verified_org
      FROM skills
      WHERE status != 'rejected'
      GROUP BY owner
    )
    SELECT
      r.owner,
      MAX(r.avatar_url) as avatar_url,
      COALESCE(sc.total_skills, 0) as total_skills,
      COALESCE(SUM(r.stars), 0) as total_stars,
      COALESCE(SUM(r.forks), 0) as total_forks,
      COALESCE(ov.is_verified_org, false) as is_verified_org
    FROM unique_repos r
    LEFT JOIN skill_counts sc ON sc.owner = r.owner
    LEFT JOIN owner_verified ov ON ov.owner = r.owner
    GROUP BY r.owner, sc.total_skills, ov.is_verified_org
    ORDER BY ${orderColumn} DESC
    LIMIT ${safeLimit}
  `)

  const ownerRankingRowSchema = z.object({
    owner: z.string(),
    avatar_url: z.string().nullable(),
    total_skills: dbNumber,
    total_stars: dbNumber,
    total_forks: dbNumber,
    is_verified_org: z.boolean(),
  })

  const rows = parseDbRows(ownerRankingRowSchema, result, "getOwnerRankings")

  return rows.map((r) => ({
    owner: r.owner,
    avatarUrl: r.avatar_url,
    totalSkills: Number(r.total_skills),
    totalStars: Number(r.total_stars),
    totalForks: Number(r.total_forks),
    isVerifiedOrg: Boolean(r.is_verified_org),
  }))
}
