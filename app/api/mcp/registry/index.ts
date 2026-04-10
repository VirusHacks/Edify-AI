import { z } from "zod";
import { listCourses, createCourse, getCourse, updateCourse, deleteCourse, getCourseChapter, incrementCourseProgress, listUserCourses, generateCourse } from "@/services/courses";
import { listResumeAnalyses, analyzeResume } from "@/services/resumeAnalysis";
import { getResumeReport, generateResumeReport } from "@/services/resumeReport";
import { listTopics, createTopic, listReplies, createReply } from "@/services/forum";
import { listEvents } from "@/services/events";
import { generateCourseContent } from "@/services/courseGeneration";
import { courseChat } from "@/services/courseChat";
import { createLearningPathway, getPathwayBySlug, listPathways, updatePathwayProgress, getPathwayProgress } from "@/services/pathway";
import { listInternships } from "@/services/internships";
import { listDocuments } from "@/services/documents";
import { createResume, validateResumeInput } from "@/services/resumeBuilder";
import { getProfile, updateProfile } from "@/services/profile";
import { CourseListInput, CourseListOutput, CourseCreateInput, CourseCreateOutput, CourseGetInput, CourseGetOutput, CourseUpdateInput, CourseUpdateOutput, CourseDeleteInput, CourseDeleteOutput, CourseChapterGetInput, CourseChapterGetOutput, CourseProgressIncrementInput, CourseProgressIncrementOutput, CourseListByUserInput, CourseListByUserOutput, CourseGenerateAIInput, CourseGenerateAIOutput } from "../schemas/courses";
import { ResumeListInput, ResumeListOutput, ResumeAnalyzeInput, ResumeAnalyzeOutput } from "../schemas/resumeAnalysis";
import { ResumeReportGetInput, ResumeReportGetOutput, ResumeReportGenerateInput, ResumeReportGenerateOutput } from "../schemas/resumeReport";
import { ForumTopicListInput, ForumTopicListOutput, ForumTopicCreateInput, ForumTopicCreateOutput, ForumReplyListInput, ForumReplyListOutput, ForumReplyCreateInput, ForumReplyCreateOutput } from "../schemas/forum";
import { EventsListInput, EventsListOutput } from "../schemas/events";
import { CourseGenerateInput, CourseGenerateOutput } from "../schemas/courseGeneration";
import { CourseChatInput, CourseChatOutput } from "../schemas/courseChat";
import { InternshipsListInput, InternshipsListOutput } from "../schemas/internships";
import { PathwayCreateInput, PathwayCreateOutput, PathwayGetInput, PathwayListOutput, PathwayProgressUpdateInput, PathwayProgressGetInput, PathwayProgressOutput } from "../schemas/pathway";
import { MathSolveImageInput, MathSolveImageOutput } from "../schemas/mathSolveImage";
import { solveMathFromImage } from "@/services/mathSolveImage";
import { AIGenerateInput, AIGenerateOutput } from "../schemas/aiGenerate";
import { aiGenerate } from "@/services/aiGenerate";
import { SpeechTranscribeInput, SpeechTranscribeOutput } from "../schemas/speechTranscribe";
import { speechTranscribe } from "@/services/speechTranscribe";
import { CodeRunInput, CodeRunOutput } from "../schemas/codeRun";
import { codeRun } from "@/services/codeRun";
import { DocumentListInput, DocumentListOutput } from "../schemas/documents";
import { ResumeCreateInput, ResumeCreateOutput, ResumeValidateInput, ResumeValidateOutput } from "../schemas/resumeBuilder";
import { ProfileGetInput, ProfileGetOutput, ProfileUpdateInput, ProfileUpdateOutput } from "../schemas/profile";
import { ensureUserId } from "../utils/auth";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
  handler: (input: any) => Promise<any>;
}

// Tool registry
export const tools: MCPTool[] = [
  {
    name: "course.list",
    description: "List courses with pagination",
    inputSchema: CourseListInput,
    outputSchema: CourseListOutput,
    handler: async (input) => listCourses(input),
  },
  {
    name: "course.create",
    description: "Create a new course record",
    inputSchema: CourseCreateInput,
    outputSchema: CourseCreateOutput,
    handler: async (input) => createCourse(input),
  },
  {
    name: "course.get",
    description: "Get a single course by numeric id or courseId string",
    inputSchema: CourseGetInput,
    outputSchema: CourseGetOutput,
    handler: async (input) => getCourse(input),
  },
  {
    name: "course.update",
    description: "Update mutable fields of a course by courseId",
    inputSchema: CourseUpdateInput,
    outputSchema: CourseUpdateOutput,
    handler: async (input) => updateCourse(input),
  },
  {
    name: "course.delete",
    description: "Delete a course by numeric id or courseId",
    inputSchema: CourseDeleteInput,
    outputSchema: CourseDeleteOutput,
    handler: async (input) => deleteCourse(input),
  },
  {
    name: "course.chapter.get",
    description: "Get a chapter for a course by index",
    inputSchema: CourseChapterGetInput,
    outputSchema: CourseChapterGetOutput,
    handler: async (input) => getCourseChapter(input),
  },
  {
    name: "course.progress.increment",
    description: "Increment course progress by a given amount (capped at 100)",
    inputSchema: CourseProgressIncrementInput,
    outputSchema: CourseProgressIncrementOutput,
    handler: async (input) => incrementCourseProgress(input),
  },
  {
    name: "course.listByUser",
    description: "List courses created by a specific user email",
    inputSchema: CourseListByUserInput,
    outputSchema: CourseListByUserOutput,
    handler: async (input) => listUserCourses(input),
  },
  {
    name: "course.generate",
    description: "Generate a new AI-powered course with chapters based on topic, category, and difficulty",
    inputSchema: CourseGenerateAIInput,
    outputSchema: CourseGenerateAIOutput,
    handler: async (input) => generateCourse(input),
  },
  {
    name: "resume.list",
    description: "List previous resume analyses for a user",
    inputSchema: ResumeListInput,
    outputSchema: ResumeListOutput,
    handler: async (input) => listResumeAnalyses(input),
  },
  {
    name: "resume.analyze",
    description: "Analyze a resume against a job description",
    inputSchema: ResumeAnalyzeInput,
    outputSchema: ResumeAnalyzeOutput,
    handler: async (input) => analyzeResume(input),
  },
  {
    name: "resume.report.get",
    description: "Generate PDF (base64) for stored analysisId",
    inputSchema: ResumeReportGetInput,
    outputSchema: ResumeReportGetOutput,
    handler: async (input) => getResumeReport(input),
  },
  {
    name: "resume.report.generate",
    description: "Generate PDF (base64) from provided analysis object",
    inputSchema: ResumeReportGenerateInput,
    outputSchema: ResumeReportGenerateOutput,
    handler: async (input) => generateResumeReport(input),
  },
  {
    name: "forum.topic.list",
    description: "List forum topics for a course",
    inputSchema: ForumTopicListInput,
    outputSchema: ForumTopicListOutput,
    handler: async (input) => listTopics(input),
  },
  {
    name: "forum.topic.create",
    description: "Create a new forum topic",
    inputSchema: ForumTopicCreateInput,
    outputSchema: ForumTopicCreateOutput,
    handler: async (input) => createTopic(input),
  },
  {
    name: "forum.reply.list",
    description: "List replies for a forum topic",
    inputSchema: ForumReplyListInput,
    outputSchema: ForumReplyListOutput,
    handler: async (input) => listReplies(input),
  },
  {
    name: "forum.reply.create",
    description: "Create a reply for a forum topic",
    inputSchema: ForumReplyCreateInput,
    outputSchema: ForumReplyCreateOutput,
    handler: async (input) => createReply(input),
  },
  {
    name: "events.list",
    description: "List hackathons and meetups",
    inputSchema: EventsListInput,
    outputSchema: EventsListOutput,
    handler: async (input) => listEvents(input),
  },
  {
    name: "internships.list",
    description: "List internships (scraped)",
    inputSchema: InternshipsListInput,
    outputSchema: InternshipsListOutput,
    handler: async (input) => listInternships(input),
  },
  {
    name: "course.content.generate",
    description: "Generate detailed chapter content for an existing course (requires courseId). This fills in the chapter explanations, code examples, and quizzes.",
    inputSchema: CourseGenerateInput,
    outputSchema: CourseGenerateOutput,
    handler: async (input) => {
      ensureUserId(input, 'course.content.generate');
      return generateCourseContent(input);
    },
  },
  {
    name: "course.chat",
    description: "Answer a user query about a course using its chapters",
    inputSchema: CourseChatInput,
    outputSchema: CourseChatOutput,
    handler: async (input) => courseChat(input),
  },
  {
    name: "pathway.create",
    description: "Generate and optionally persist a learning pathway",
    inputSchema: PathwayCreateInput,
    outputSchema: PathwayCreateOutput,
    handler: async (input) => {
      ensureUserId(input, 'pathway.create');
      return createLearningPathway(input);
    },
  },
  {
    name: "pathway.get",
    description: "Get a pathway by slug",
    inputSchema: PathwayGetInput,
    outputSchema: PathwayCreateOutput, // same shape
    handler: async (input) => getPathwayBySlug(input.slug),
  },
  {
    name: "pathway.list",
    description: "List all pathways",
    inputSchema: undefined,
    outputSchema: PathwayListOutput,
    handler: async () => listPathways(),
  },
  {
    name: "pathway.progress.update",
    description: "Update user progress for a pathway",
    inputSchema: PathwayProgressUpdateInput,
    outputSchema: PathwayProgressOutput,
    handler: async (input) => updatePathwayProgress(input),
  },
  {
    name: "pathway.progress.get",
    description: "Get user progress for a pathway",
    inputSchema: PathwayProgressGetInput,
    outputSchema: PathwayProgressOutput,
    handler: async (input) => getPathwayProgress(input),
  },
  {
    name: "math.solveImage",
    description: "Solve math problems from an image (handwritten or printed). Returns array of expressions with simplifications and steps.",
    inputSchema: MathSolveImageInput,
    outputSchema: MathSolveImageOutput,
    handler: async (input) => solveMathFromImage(input),
  },
  {
    name: "ai.generate",
    description: "Generic Gemini text generation with configurable parameters (temperature, topP, topK, max tokens, JSON mode).",
    inputSchema: AIGenerateInput,
    outputSchema: AIGenerateOutput,
    handler: async (input) => aiGenerate(input),
  },
  {
    name: "speech.transcribe",
    description: "Transcribe spoken audio to text from base64 audio (stub in testMode).",
    inputSchema: SpeechTranscribeInput,
    outputSchema: SpeechTranscribeOutput,
    handler: async (input) => speechTranscribe(input),
  },
  {
    name: "code.run",
    description: "Execute small code snippets in a restricted sandbox (stub/test mode only currently).",
    inputSchema: CodeRunInput,
    outputSchema: CodeRunOutput,
    handler: async (input) => codeRun(input),
  },
  {
    name: "document.list",
    description: "List user's resume documents with titles and redirect URLs",
    inputSchema: DocumentListInput,
    outputSchema: DocumentListOutput,
    handler: async (input) => {
      ensureUserId(input, 'document.list');
      return listDocuments(input);
    },
  },
  {
    name: "resume.validate",
    description: "Validate resume data and identify missing required fields. Use this BEFORE creating a resume to check if all required information is provided. Returns which fields are missing with user-friendly messages.",
    inputSchema: ResumeValidateInput,
    outputSchema: ResumeValidateOutput,
    handler: async (input) => {
      return validateResumeInput(input);
    },
  },
  {
    name: "resume.create",
    description: "Create a new resume document with personal info, experiences, education, and skills. Use resume.validate first to ensure all required fields are provided. Returns the created document with redirect URL to edit it.",
    inputSchema: ResumeCreateInput,
    outputSchema: ResumeCreateOutput,
    handler: async (input) => {
      ensureUserId(input, 'resume.create');
      return createResume(input);
    },
  },
  {
    name: "profile.get",
    description: "Get the current user's profile including bio, skills, interests, learning goals, occupation, location, website, and social links. Useful for pre-filling resume data or personalizing recommendations.",
    inputSchema: ProfileGetInput,
    outputSchema: ProfileGetOutput,
    handler: async (input) => {
      ensureUserId(input, 'profile.get');
      return getProfile(input);
    },
  },
  {
    name: "profile.update",
    description: "Update the user's profile with bio, skills, interests, learning goals, occupation, location, website, or social links. Useful for keeping profile information up-to-date.",
    inputSchema: ProfileUpdateInput,
    outputSchema: ProfileUpdateOutput,
    handler: async (input) => {
      ensureUserId(input, 'profile.update');
      return updateProfile(input);
    },
  },
];

export function getTool(name: string): MCPTool | undefined {
  return tools.find((t) => t.name === name);
}

export function listToolMetadata() {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema?.toString(),
    outputSchema: t.outputSchema?.toString(),
  }));
}
