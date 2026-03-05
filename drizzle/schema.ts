import { pgTable, serial, varchar, integer, json, text, foreignKey, timestamp, date, boolean, real, unique, jsonb, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const status = pgEnum("status", ['archived', 'private', 'public'])



export const courseChapters = pgTable("courseChapters", {
	id: serial().primaryKey().notNull(),
	courseId: varchar().notNull(),
	chapterId: integer().notNull(),
	content: json().notNull(),
	videoId: varchar().notNull(),
	quiz: json().notNull(),
});

export const mockInterviewTool = pgTable("MockInterviewTool", {
	id: serial().primaryKey().notNull(),
	jsonMockResp: text().notNull(),
	jobPosition: varchar().notNull(),
	jobDesc: varchar().notNull(),
	jobExperience: varchar().notNull(),
	createdBy: varchar().notNull(),
	createdAt: varchar(),
	mockId: varchar().notNull(),
});

export const forumReplies = pgTable("forum_replies", {
	id: serial().primaryKey().notNull(),
	topicId: integer("topic_id").notNull(),
	userId: varchar("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		forumRepliesTopicIdForumTopicsIdFk: foreignKey({
			columns: [table.topicId],
			foreignColumns: [forumTopics.id],
			name: "forum_replies_topic_id_forum_topics_id_fk"
		}),
	}
});

export const education = pgTable("education", {
	id: serial().primaryKey().notNull(),
	documentId: integer("document_id").notNull(),
	universityName: varchar("university_name", { length: 255 }),
	degree: varchar({ length: 255 }),
	major: varchar({ length: 255 }),
	description: text(),
	startDate: date("start_date"),
	endDate: date("end_date"),
},
(table) => {
	return {
		educationDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "education_document_id_document_id_fk"
		}).onDelete("cascade"),
	}
});

export const skills = pgTable("skills", {
	id: serial().primaryKey().notNull(),
	documentId: integer("document_id").notNull(),
	name: varchar({ length: 255 }),
	rating: integer().default(0).notNull(),
},
(table) => {
	return {
		skillsDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "skills_document_id_document_id_fk"
		}).onDelete("cascade"),
	}
});

export const useAnswer = pgTable("useAnswer", {
	id: serial().primaryKey().notNull(),
	mockId: varchar().notNull(),
	question: varchar().notNull(),
	correctAns: text(),
	userAns: text(),
	feedback: text(),
	rating: varchar(),
	userEmail: varchar(),
	createdAt: varchar(),
});

export const userProgress = pgTable("user_progress", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	pathwayId: integer("pathway_id"),
	completedSteps: integer("completed_steps").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		userProgressPathwayIdPathwaysIdFk: foreignKey({
			columns: [table.pathwayId],
			foreignColumns: [pathways.id],
			name: "user_progress_pathway_id_pathways_id_fk"
		}),
	}
});

export const courseList = pgTable("courseList", {
	id: serial().primaryKey().notNull(),
	courseId: varchar().notNull(),
	name: varchar().notNull(),
	category: varchar().notNull(),
	level: varchar().notNull(),
	courseOutput: json().notNull(),
	isVideo: varchar().default('Yes').notNull(),
	username: varchar(),
	userprofileimage: varchar(),
	createdBy: varchar(),
	courseBanner: varchar(),
	isPublished: boolean().default(false).notNull(),
	progress: real().default(0).notNull(),
});

export const document = pgTable("document", {
	id: serial().primaryKey().notNull(),
	documentId: varchar("document_id").notNull(),
	userId: varchar("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	summary: text(),
	themeColor: varchar("theme_color", { length: 255 }).default('#7c3aed').notNull(),
	thumbnail: text(),
	currentPosition: integer("current_position").default(1).notNull(),
	status: status().default('private').notNull(),
	authorName: varchar("author_name", { length: 255 }).notNull(),
	authorEmail: varchar("author_email", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		documentDocumentIdUnique: unique("document_document_id_unique").on(table.documentId),
	}
});

export const personalInfo = pgTable("personal_info", {
	id: serial().primaryKey().notNull(),
	documentId: integer("document_id"),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	jobTitle: varchar("job_title", { length: 255 }),
	address: varchar({ length: 500 }),
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
},
(table) => {
	return {
		personalInfoDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "personal_info_document_id_document_id_fk"
		}).onDelete("cascade"),
	}
});

export const forumTopics = pgTable("forum_topics", {
	id: serial().primaryKey().notNull(),
	courseId: integer("course_id").notNull(),
	userId: varchar("user_id").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		forumTopicsCourseIdCourseListIdFk: foreignKey({
			columns: [table.courseId],
			foreignColumns: [courseList.id],
			name: "forum_topics_course_id_courseList_id_fk"
		}),
	}
});

export const experience = pgTable("experience", {
	id: serial().primaryKey().notNull(),
	documentId: integer("document_id"),
	title: varchar({ length: 255 }),
	companyName: varchar("company_name", { length: 255 }),
	city: varchar({ length: 255 }),
	state: varchar({ length: 255 }),
	currentlyWorking: boolean("currently_working").default(false).notNull(),
	workSummary: text("work_summary"),
	startDate: date("start_date"),
	endDate: date("end_date"),
},
(table) => {
	return {
		experienceDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "experience_document_id_document_id_fk"
		}).onDelete("cascade"),
	}
});

export const pathways = pgTable("pathways", {
	id: serial().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	estimatedTime: text("estimated_time").notNull(),
	difficulty: text().notNull(),
	prerequisites: jsonb().notNull(),
	steps: jsonb().notNull(),
	// Personalization fields
	userId: text("user_id"),
	isPersonalized: boolean("is_personalized").default(false),
	targetCareer: text("target_career"),
	marketInsights: jsonb("market_insights"),
	personalizedFor: jsonb("personalized_for"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		pathwaysSlugUnique: unique("pathways_slug_unique").on(table.slug),
	}
});