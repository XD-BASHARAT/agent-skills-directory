## 2026-02-08 - Missing Index on Foreign Key
**Learning:** Drizzle ORM's `references()` does not automatically create an index on the foreign key column. This can lead to slow joins, especially when filtering by the referenced table (e.g., finding all skills in a category). Also, `primaryKey` implicitly creates an index on the composite key, but only the prefix is efficient for single-column lookups.
**Action:** Always verify if an index is needed on foreign keys, especially for many-to-many relationship tables where you query by the second ID.

## 2025-02-15 - Missing GIN Index on Search Column
**Learning:** Full-text search or pattern matching on large datasets (hundreds of skills) causes significant performance degradation (>2000ms) without appropriate indexing. The `skills.searchText` column was missing a GIN index, leading to high CPU usage.
**Action:** Added a GIN index `skills_search_text_idx` to `skills.searchText` to optimize search queries.
