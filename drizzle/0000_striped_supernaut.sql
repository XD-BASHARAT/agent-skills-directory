CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"skill_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "skill_categories_skill_id_category_id_pk" PRIMARY KEY("skill_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "skill_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"reporter_email" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"path" text NOT NULL,
	"url" text NOT NULL,
	"raw_url" text NOT NULL,
	"compatibility" text,
	"allowed_tools" text,
	"stars" integer DEFAULT 0,
	"forks" integer DEFAULT 0,
	"avatar_url" text,
	"topics" text,
	"is_archived" boolean DEFAULT false,
	"is_verified_org" boolean DEFAULT false,
	"blob_sha" text,
	"last_seen_at" timestamp with time zone,
	"status" text DEFAULT 'pending',
	"submitted_by" text,
	"repo_updated_at" timestamp with time zone,
	"file_updated_at" timestamp with time zone,
	"indexed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"search_text" text
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"items_processed" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"error_message" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_favorites_user_id_skill_id_pk" PRIMARY KEY("user_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_reports" ADD CONSTRAINT "skill_reports_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_reports_skill_id_idx" ON "skill_reports" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_reports_status_idx" ON "skill_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_stars_idx" ON "skills" USING btree ("stars");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_owner_repo_idx" ON "skills" USING btree ("owner","repo");--> statement-breakpoint
CREATE INDEX "skills_owner_slug_idx" ON "skills" USING btree ("owner","slug");--> statement-breakpoint
CREATE INDEX "skills_indexed_at_idx" ON "skills" USING btree ("indexed_at");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");