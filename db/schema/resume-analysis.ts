import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resumeAnalysisTable = pgTable("resume_analysis", {
  id: serial("id").notNull().primaryKey(),
  analysisId: varchar("analysis_id", { length: 255 }).unique().notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  overallScore: integer("overall_score").notNull(),
  atsMatchPercentage: integer("ats_match_percentage").notNull(),
  resumeText: text("resume_text"),
  jobDescription: text("job_description"),
  keywords: text("keywords"),
  recommendations: jsonb("recommendations"), // Store the entire analysis as JSON
  aiGeneratedSummary: text("ai_generated_summary"),
  reportUrl: text("report_url"), // URL to the generated PDF report
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const createResumeAnalysisSchema = createInsertSchema(
  resumeAnalysisTable
).pick({
  userId: true,
  jobTitle: true,
  companyName: true,
  resumeText: true,
  jobDescription: true,
  keywords: true,
});

export type ResumeAnalysisSchema = z.infer<typeof createResumeAnalysisSchema>;
