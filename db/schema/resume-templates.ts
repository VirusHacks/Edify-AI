import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resumeTemplateTable = pgTable("resume_templates", {
  id: serial("id").notNull().primaryKey(),
  templateId: varchar("template_id", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Technical, Finance, Marketing, etc.
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  templateUrl: text("template_url"), // URL to the template file
  previewImageUrl: text("preview_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const createResumeTemplateSchema = createInsertSchema(
  resumeTemplateTable
).pick({
  templateId: true,
  name: true,
  category: true,
  description: true,
  thumbnailUrl: true,
  templateUrl: true,
  previewImageUrl: true,
});

export type ResumeTemplateSchema = z.infer<typeof createResumeTemplateSchema>;

