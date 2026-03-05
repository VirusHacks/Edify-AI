CREATE TABLE IF NOT EXISTS "resume_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"company_name" varchar(255),
	"overall_score" integer NOT NULL,
	"ats_match_percentage" integer NOT NULL,
	"resume_text" text,
	"job_description" text,
	"keywords" text,
	"recommendations" jsonb,
	"ai_generated_summary" text,
	"report_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resume_analysis_analysis_id_unique" UNIQUE("analysis_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"template_url" text,
	"preview_image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resume_templates_template_id_unique" UNIQUE("template_id")
);
