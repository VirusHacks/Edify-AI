CREATE TABLE IF NOT EXISTS "tracked_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"company_name" varchar(255),
	"job_url" text NOT NULL,
	"job_description" text,
	"requirements" text,
	"location" varchar(255),
	"status" varchar(50) DEFAULT 'applied',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
