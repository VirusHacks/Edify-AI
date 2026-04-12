/**
 * @file db/schema/index.ts
 * @description Central barrel file for the Edify-AI database schema.
 * Re-exports all table definitions and relations for unified import access.
 */

// Core Platform Schemas
export { documentTable, documentRelations, statusEnum } from "./document";
export { educationTable, educationRelations } from "./education";
export { experienceTable, experienceRelations } from "./experience";
export { personalInfoTable, personalInfoRelations } from "./personal-info";
export { skillsTable, skillsRelations } from "./skills";

// Education and AI Course Schemas
export { CourseList, CourseChapters, pathways, userProgress } from './chapter';

// Career and Interview Tools
export { MockInterview, UserAnswer } from './mock';
export { resumeTemplateTable } from './resume-templates';
export { resumeAnalysisTable } from './resume-analysis';
export { trackedJobsTable } from './tracked-jobs';

// Social and Agentic Workflows
export { forumTopics, forumReplies } from './forum';
export { user, session, account, verification, agents, meetings, meetingStatus } from './agents';    
