import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core"

export const skills = pgTable(
  "skills",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    path: text("path").notNull(),
    url: text("url").notNull(),
    rawUrl: text("raw_url").notNull(),

    compatibility: text("compatibility"),
    allowedTools: text("allowed_tools"),

    stars: integer("stars").default(0),
    forks: integer("forks").default(0),
    avatarUrl: text("avatar_url"),
    topics: text("topics"),
    isArchived: boolean("is_archived").default(false),
    isVerifiedOrg: boolean("is_verified_org").default(false),

    blobSha: text("blob_sha"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),

    status: text("status").default("pending"),
    submittedBy: text("submitted_by"),

    repoUpdatedAt: timestamp("repo_updated_at", { withTimezone: true }),
    fileUpdatedAt: timestamp("file_updated_at", { withTimezone: true }),
    indexedAt: timestamp("indexed_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

    searchText: text("search_text"),
    
    // Security scan results
    securityScan: text("security_scan"), // JSON: { safe: boolean, riskScore: number, threats: SecurityThreat[] }
    securityScannedAt: timestamp("security_scanned_at", { withTimezone: true }),
  },
  (table) => [
    index("skills_stars_idx").on(table.stars),
    index("skills_status_idx").on(table.status),
    index("skills_owner_repo_idx").on(table.owner, table.repo),
    index("skills_owner_slug_idx").on(table.owner, table.slug),
    index("skills_indexed_at_idx").on(table.indexedAt),
    index("skills_search_text_idx").using("gin", table.searchText.op("gin_trgm_ops")),
  ]
)

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const skillCategories = pgTable(
  "skill_categories",
  {
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.skillId, table.categoryId] }),
    index("skill_categories_category_id_idx").on(table.categoryId),
  ]
)

export const syncJobs = pgTable("sync_jobs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  itemsProcessed: integer("items_processed").default(0),
  itemsFailed: integer("items_failed").default(0),
  errorMessage: text("error_message"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})



export const syncState = pgTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: text("user_id").notNull(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.skillId] }),
  ]
)

export type Skill = typeof skills.$inferSelect
export type NewSkill = typeof skills.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type SyncJob = typeof syncJobs.$inferSelect
export type NewSyncJob = typeof syncJobs.$inferInsert
export type SyncState = typeof syncState.$inferSelect
export type NewSyncState = typeof syncState.$inferInsert
export type UserFavorite = typeof userFavorites.$inferSelect
export type NewUserFavorite = typeof userFavorites.$inferInsert

export const skillReports = pgTable(
  "skill_reports",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    description: text("description"),
    reporterEmail: text("reporter_email"),
    status: text("status").default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("skill_reports_skill_id_idx").on(table.skillId),
    index("skill_reports_status_idx").on(table.status),
  ]
)

export type SkillReport = typeof skillReports.$inferSelect
export type NewSkillReport = typeof skillReports.$inferInsert
