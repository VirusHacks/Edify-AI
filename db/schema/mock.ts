import { pgTable, serial, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";

export const MockInterview = pgTable("MockInterviewTool", {
  id: serial("id").primaryKey(),
  jsonMockResp: text("jsonMockResp").notNull(),
  jobPosition: varchar("jobPosition").notNull(),
  jobDesc: varchar("jobDesc").notNull(),
  jobExperience: varchar("jobExperience").notNull(),
  linkedinUrl: varchar("linkedinUrl"),
  createdBy: varchar("createdBy").notNull(),
  createdAt: varchar("createdAt"),
  mockId: varchar("mockId").notNull()
});


export const UserAnswer=pgTable('useAnswer',{
   id:serial('id').primaryKey(),
   mockIdRef:varchar("mockId").notNull(),
   question:varchar('question').notNull(),
   correctAns:text('correctAns'),
   userAns:text('userAns'),
   feedback:text('feedback'),
   rating:varchar('rating'),
   userEmail:varchar('userEmail'),
   createdAt:varchar('createdAt'),
   // Body language metrics
   eyeContactScore:integer('eyeContactScore'),
   engagementScore:integer('engagementScore'),
   confidenceScore:integer('confidenceScore'),
   dominantExpression:varchar('dominantExpression'),
   bodyLanguageMetrics:jsonb('bodyLanguageMetrics'),
})