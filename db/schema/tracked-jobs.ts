import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trackedJobsTable = pgTable("tracked_jobs", {
  id: serial("id").notNull().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  jobUrl: text("job_url").notNull(),
  jobDescription: text("job_description"),
  requirements: text("requirements"),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }).default("applied"), // applied, interview, rejected, offer
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const createTrackedJobSchema = createInsertSchema(
  trackedJobsTable
).pick({
  userId: true,
  jobTitle: true,
  companyName: true,
  jobUrl: true,
  jobDescription: true,
  requirements: true,
  location: true,
  status: true,
  notes: true,
});

export type TrackedJobSchema = z.infer<typeof createTrackedJobSchema>;

