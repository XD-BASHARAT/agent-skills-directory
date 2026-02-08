## 2026-02-08 - Missing Index on Foreign Key
**Learning:** Drizzle ORM's `references()` does not automatically create an index on the foreign key column. This can lead to slow joins, especially when filtering by the referenced table (e.g., finding all skills in a category). Also, `primaryKey` implicitly creates an index on the composite key, but only the prefix is efficient for single-column lookups.
**Action:** Always verify if an index is needed on foreign keys, especially for many-to-many relationship tables where you query by the second ID.
