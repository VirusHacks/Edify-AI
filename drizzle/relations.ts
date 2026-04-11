import { relations } from "drizzle-orm/relations";
import { forumTopics, forumReplies, document, education, skills, pathways, userProgress, personalInfo, courseList, experience } from "./schema";

export const forumRepliesRelations = relations(forumReplies, ({one}) => ({
	forumTopic: one(forumTopics, {
		fields: [forumReplies.topicId],
		references: [forumTopics.id]
	}),
}));

export const forumTopicsRelations = relations(forumTopics, ({one, many}) => ({
	forumReplies: many(forumReplies),
	courseList: one(courseList, {
		fields: [forumTopics.courseId],
		references: [courseList.id]
	}),
}));

export const educationRelations = relations(education, ({one}) => ({
	document: one(document, {
		fields: [education.documentId],
		references: [document.id]
	}),
}));

export const documentRelations = relations(document, ({many}) => ({
	educations: many(education),
	skills: many(skills),
	personalInfos: many(personalInfo),
	experiences: many(experience),
}));

export const skillsRelations = relations(skills, ({one}) => ({
	document: one(document, {
		fields: [skills.documentId],
		references: [document.id]
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	pathway: one(pathways, {
		fields: [userProgress.pathwayId],
		references: [pathways.id]
	}),
}));

export const pathwaysRelations = relations(pathways, ({many}) => ({
	userProgresses: many(userProgress),
}));

export const personalInfoRelations = relations(personalInfo, ({one}) => ({
	document: one(document, {
		fields: [personalInfo.documentId],
		references: [document.id]
	}),
}));

export const courseListRelations = relations(courseList, ({many}) => ({
	forumTopics: many(forumTopics),
}));

export const experienceRelations = relations(experience, ({one}) => ({
	document: one(document, {
		fields: [experience.documentId],
		references: [document.id]
	}),
}));