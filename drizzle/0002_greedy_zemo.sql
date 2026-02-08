DROP INDEX "user_favorites_user_id_idx";--> statement-breakpoint
CREATE INDEX "skill_categories_category_id_idx" ON "skill_categories" USING btree ("category_id");