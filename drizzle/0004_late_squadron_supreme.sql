ALTER TABLE "MockInterviewTool" ADD COLUMN "linkedinUrl" varchar;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "is_personalized" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "target_career" text;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "market_insights" jsonb;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "personalized_for" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "resume_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "resume_parsed_text" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "linkedin_profile_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "linkedin_summary" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "github_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ai_context" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_completeness" text;