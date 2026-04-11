// MCP SDK-based server exposing tools derived from internal services.
// Run with: npx tsx mcp/sdk-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Extended Tool type with handler for internal use
interface ToolWithHandler extends Omit<Tool, 'inputSchema'> {
  inputSchema: any;
  outputSchema?: any;
  handler: (args: { input: any }) => Promise<any>;
}
import { listCourses, createCourse, getCourse, updateCourse, deleteCourse, getCourseChapter, incrementCourseProgress, listUserCourses, generateCourse } from '@/services/courses';
import { listResumeAnalyses, analyzeResume } from '@/services/resumeAnalysis';
import { getResumeReport, generateResumeReport } from '@/services/resumeReport';
import { listTopics, createTopic, listReplies, createReply } from '@/services/forum';
import { listEvents } from '@/services/events';
import { listInternships } from '@/services/internships';
import { generateCourseContent } from '@/services/courseGeneration';
import { courseChat } from '@/services/courseChat';
import { createLearningPathway, getPathwayBySlug, listPathways, updatePathwayProgress, getPathwayProgress } from '@/services/pathway';
import { ensureUserId } from '@/app/api/mcp/utils/auth';
import { solveMathFromImage } from '@/services/mathSolveImage';
import { aiGenerate } from '@/services/aiGenerate';
import { speechTranscribe } from '@/services/speechTranscribe';
import { codeRun } from '@/services/codeRun';
// Import Zod->JSON Schema utility and all Zod schemas via relative paths to avoid tsconfig path alias issues in Vitest/CJS
import { toJsonSchema } from '../app/api/mcp/utils/zodSchemaFactory';
import {
  CourseListInput,
  CourseListOutput,
  CourseCreateInput,
  CourseCreateOutput,
  CourseGetInput,
  CourseGetOutput,
  CourseUpdateInput,
  CourseUpdateOutput,
  CourseDeleteInput,
  CourseDeleteOutput,
  CourseChapterGetInput,
  CourseChapterGetOutput,
  CourseProgressIncrementInput,
  CourseProgressIncrementOutput,
  CourseListByUserInput,
  CourseListByUserOutput,
} from '../app/api/mcp/schemas/courses';
import { ResumeListInput, ResumeListOutput, ResumeAnalyzeInput, ResumeAnalyzeOutput } from '../app/api/mcp/schemas/resumeAnalysis';
import { ResumeReportGetInput, ResumeReportGetOutput, ResumeReportGenerateInput, ResumeReportGenerateOutput } from '../app/api/mcp/schemas/resumeReport';
import {
  ForumTopicListInput,
  ForumTopicListOutput,
  ForumTopicCreateInput,
  ForumTopicCreateOutput,
  ForumReplyListInput,
  ForumReplyListOutput,
  ForumReplyCreateInput,
  ForumReplyCreateOutput,
} from '../app/api/mcp/schemas/forum';
import { EventsListInput, EventsListOutput } from '../app/api/mcp/schemas/events';
import { InternshipsListInput, InternshipsListOutput } from '../app/api/mcp/schemas/internships';
import { CourseGenerateInput, CourseGenerateOutput } from '../app/api/mcp/schemas/courseGeneration';
import { CourseChatInput, CourseChatOutput } from '../app/api/mcp/schemas/courseChat';
import {
  PathwayCreateInput,
  PathwayCreateOutput,
  PathwayGetInput,
  PathwayListOutput,
  PathwayProgressUpdateInput,
  PathwayProgressGetInput,
  PathwayProgressOutput,
} from '../app/api/mcp/schemas/pathway';
import { MathSolveImageInput, MathSolveImageOutput } from '../app/api/mcp/schemas/mathSolveImage';
import { AIGenerateInput, AIGenerateOutput } from '../app/api/mcp/schemas/aiGenerate';
import { SpeechTranscribeInput, SpeechTranscribeOutput } from '../app/api/mcp/schemas/speechTranscribe';
import { CodeRunInput, CodeRunOutput } from '../app/api/mcp/schemas/codeRun';

// JSON Schemas (manual) for inputs/outputs. Could be generated from Zod later.
const CourseListInputSchema: any = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
  },
  required: [],
  additionalProperties: false,
};

const CourseListOutputSchema: any = {
  type: 'object',
  properties: {
    data: { type: 'array', items: { type: 'object' } },
    page: { type: 'integer' },
    limit: { type: 'integer' },
  },
  required: ['data', 'page', 'limit'],
};

const CourseCreateInputSchema: any = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userInput: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        category: { type: 'string' },
        difficulty: { type: 'string' },
      },
      required: ['topic', 'category', 'difficulty'],
    },
    data: {},
    user: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        given_name: { type: 'string' },
        picture: { type: 'string' },
      },
      required: [],
    },
  },
  required: ['id', 'userInput', 'data'],
};

const CourseCreateOutputSchema: any = {
  type: 'object',
  properties: {
    insertedCount: { type: 'integer' },
  },
  required: ['insertedCount'],
};

function legacyGetSdkTools(): ToolWithHandler[] {
  return [
    {
      name: 'course.list',
      description: 'List courses with pagination',
      inputSchema: CourseListInputSchema,
      outputSchema: CourseListOutputSchema,
      handler: async ({ input }: any) => {
        // Apply defaults
        const page = typeof input?.page === 'number' ? input.page : 0;
        const limit = typeof input?.limit === 'number' ? input.limit : 8;
        return await listCourses({ page, limit });
      },
    },
    {
      name: 'course.create',
      description: 'Create a course entry',
      inputSchema: CourseCreateInputSchema,
      outputSchema: CourseCreateOutputSchema,
      handler: async ({ input }: any) => {
        return await createCourse(input as any);
      },
    },
    {
      name: 'course.get',
      description: 'Get single course by numeric id or courseId',
      inputSchema: { type: 'object', properties: { id: { type: 'string' }, testMode: { type: 'boolean' } }, required: ['id'] },
      outputSchema: { type: 'object', properties: { course: { type: 'object' } }, required: ['course'] },
      handler: async ({ input }: any) => getCourse(input as any),
    },
    {
      name: 'course.update',
      description: 'Update mutable fields of a course',
      inputSchema: {
        type: 'object',
        properties: {
          courseId: { type: 'string' },
          patch: { type: 'object' },
          testMode: { type: 'boolean' },
        },
        required: ['courseId', 'patch'],
      },
      outputSchema: { type: 'object', properties: { updated: { type: 'boolean' } }, required: ['updated'] },
      handler: async ({ input }: any) => updateCourse(input as any),
    },
    {
      name: 'course.delete',
      description: 'Delete a course by id or courseId',
      inputSchema: { type: 'object', properties: { id: { type: 'string' }, testMode: { type: 'boolean' } }, required: ['id'] },
      outputSchema: { type: 'object', properties: { deleted: { type: 'boolean' } }, required: ['deleted'] },
      handler: async ({ input }: any) => deleteCourse(input as any),
    },
    {
      name: 'course.chapter.get',
      description: 'Get a chapter for a course by index',
      inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, chapterIndex: { type: 'integer', minimum: 0 }, testMode: { type: 'boolean' } }, required: ['courseId', 'chapterIndex'] },
      outputSchema: { type: 'object', properties: { chapter: { type: 'object' } }, required: ['chapter'] },
      handler: async ({ input }: any) => getCourseChapter(input as any),
    },
    {
      name: 'course.progress.increment',
      description: 'Increment course progress (capped at 100)',
      inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, increment: { type: 'integer', minimum: 0, maximum: 100 }, testMode: { type: 'boolean' } }, required: ['courseId', 'increment'] },
      outputSchema: { type: 'object', properties: { progress: { type: 'integer', minimum: 0, maximum: 100 } }, required: ['progress'] },
      handler: async ({ input }: any) => incrementCourseProgress(input as any),
    },
    {
      name: 'course.listByUser',
      description: 'List courses by creator email',
      inputSchema: { type: 'object', properties: { email: { type: 'string' }, page: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 100 }, testMode: { type: 'boolean' } }, required: ['email'] },
      outputSchema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, page: { type: 'integer' }, limit: { type: 'integer' }, email: { type: 'string' } }, required: ['data', 'page', 'limit', 'email'] },
      handler: async ({ input }: any) => listUserCourses(input as any),
    },
    {
      name: 'resume.list',
      description: 'List previous resume analyses for a user',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 50 },
        },
        required: ['userId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } },
        },
        required: ['data'],
      },
      handler: async ({ input }: any) => {
        const userId = input?.userId;
        const limit = typeof input?.limit === 'number' ? input.limit : 20;
        return await listResumeAnalyses({ userId, limit } as any);
      },
    },
    {
      name: 'resume.analyze',
      description: 'Analyze a resume against a job description',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          resumeText: { type: 'string' },
          jobDescription: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          jobTitle: { type: 'string' },
          companyName: { type: 'string' },
        },
        required: ['jobDescription'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          analysisId: { type: 'string' },
          overallScore: { type: 'integer' },
          atsMatchPercentage: { type: 'integer' },
          analysis: { type: 'object' },
          stored: { type: 'boolean' },
        },
        required: ['analysisId', 'overallScore', 'atsMatchPercentage', 'analysis', 'stored'],
      },
      handler: async ({ input }: any) => {
        return await analyzeResume(input as any);
      },
    },
    {
      name: 'resume.report.get',
      description: 'Generate base64 PDF for stored analysis',
      inputSchema: { type: 'object', properties: { analysisId: { type: 'string' }, testMode: { type: 'boolean' } }, required: ['analysisId'] },
      outputSchema: { type: 'object', properties: { analysisId: { type: 'string' }, pdfBase64: { type: 'string' }, bytes: { type: 'integer' } }, required: ['analysisId','pdfBase64','bytes'] },
      handler: async ({ input }: any) => getResumeReport(input as any),
    },
    {
      name: 'resume.report.generate',
      description: 'Generate base64 PDF from provided analysis object',
      inputSchema: { type: 'object', properties: { analysis: { type: 'object' }, metadata: { type: 'object' }, testMode: { type: 'boolean' } }, required: ['analysis'] },
      outputSchema: { type: 'object', properties: { analysisId: { type: 'string' }, pdfBase64: { type: 'string' }, bytes: { type: 'integer' } }, required: ['analysisId','pdfBase64','bytes'] },
      handler: async ({ input }: any) => generateResumeReport(input as any),
    },
    {
      name: 'forum.topic.list',
      description: 'List forum topics for a course',
      inputSchema: {
        type: 'object',
        properties: { courseId: { type: 'integer' } },
        required: ['courseId'],
      },
      outputSchema: {
        type: 'object',
        properties: { data: { type: 'array', items: { type: 'object' } } },
        required: ['data'],
      },
      handler: async ({ input }: any) => {
        return await listTopics({ courseId: input.courseId });
      },
    },
    {
      name: 'forum.topic.create',
      description: 'Create a new forum topic',
      inputSchema: {
        type: 'object',
        properties: {
          courseId: { type: 'integer' },
          userId: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['courseId', 'title', 'content'],
      },
      outputSchema: {
        type: 'object',
        properties: { insertedCount: { type: 'integer' } },
        required: ['insertedCount'],
      },
      handler: async ({ input }: any) => {
        return await createTopic(input as any);
      },
    },
    {
      name: 'forum.reply.list',
      description: 'List replies for a forum topic',
      inputSchema: {
        type: 'object',
        properties: { topicId: { type: 'integer' } },
        required: ['topicId'],
      },
      outputSchema: {
        type: 'object',
        properties: { data: { type: 'array', items: { type: 'object' } } },
        required: ['data'],
      },
      handler: async ({ input }: any) => {
        return await listReplies({ topicId: input.topicId });
      },
    },
    {
      name: 'forum.reply.create',
      description: 'Create a reply for a forum topic',
      inputSchema: {
        type: 'object',
        properties: {
          topicId: { type: 'integer' },
          userId: { type: 'string' },
          content: { type: 'string' },
          createdAt: { type: 'string' },
        },
        required: ['topicId', 'content'],
      },
      outputSchema: {
        type: 'object',
        properties: { insertedCount: { type: 'integer' } },
        required: ['insertedCount'],
      },
      handler: async ({ input }: any) => {
        return await createReply(input as any);
      },
    },
    {
      name: 'events.list',
      description: 'List hackathons and meetups',
      inputSchema: {
        type: 'object',
        properties: {
          includeHackathons: { type: 'boolean' },
          includeMeetups: { type: 'boolean' },
        },
        required: [],
      },
      outputSchema: {
        type: 'object',
        properties: {
          events: { type: 'array', items: { type: 'object' } },
        },
        required: ['events'],
      },
      handler: async ({ input }: any) => {
        const includeHackathons = input?.includeHackathons !== false; // default true
        const includeMeetups = input?.includeMeetups !== false; // default true
        return await listEvents({ includeHackathons, includeMeetups });
      },
    },
    {
      name: 'internships.list',
      description: 'List internships (scraped)',
      inputSchema: { type: 'object', properties: { testMode: { type: 'boolean' } }, required: [] },
      outputSchema: { type: 'object', properties: { internships: { type: 'array', items: { type: 'object' } } }, required: ['internships'] },
      handler: async ({ input }: any) => listInternships(input as any),
    },
    {
      name: 'course.generate',
      description: 'Generate course chapters & publish course',
      inputSchema: {
        type: 'object',
        properties: {
          courseId: { type: 'string' },
          includeVideo: { type: 'boolean' },
          testMode: { type: 'boolean' },
          userId: { type: 'string' },
        },
        required: ['courseId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          courseId: { type: 'string' },
          published: { type: 'boolean' },
          usedAI: { type: 'boolean' },
          chapters: { type: 'array', items: { type: 'object' } },
        },
        required: ['courseId', 'published', 'chapters', 'usedAI'],
      },
      handler: async ({ input }: any) => {
        ensureUserId(input, 'course.generate');
        return await generateCourseContent(input as any);
      },
    },
    {
      name: 'course.chat',
      description: 'Answer a query about a course using its chapters',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          course: { type: 'object' },
          testMode: { type: 'boolean' },
        },
        required: ['query', 'course'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          usedAI: { type: 'boolean' },
        },
        required: ['answer', 'usedAI'],
      },
      handler: async ({ input }: any) => courseChat(input as any),
    },
    {
      name: 'pathway.create',
      description: 'Generate and optionally persist a learning pathway',
      inputSchema: {
        type: 'object',
        properties: {
          career: { type: 'string' },
          description: { type: 'string' },
          testMode: { type: 'boolean' },
          userId: { type: 'string' },
        },
        required: ['career', 'description'],
      },
      outputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
      handler: async ({ input }: any) => {
        ensureUserId(input, 'pathway.create');
        return createLearningPathway(input as any);
      },
    },
    {
      name: 'pathway.get',
      description: 'Get a pathway by slug',
      inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
      outputSchema: { type: 'object', properties: { slug: { type: 'string' } } },
      handler: async ({ input }: any) => getPathwayBySlug(input.slug),
    },
    {
      name: 'pathway.list',
      description: 'List all pathways',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: { pathways: { type: 'array', items: { type: 'object' } } }, required: ['pathways'] },
      handler: async () => listPathways(),
    },
    {
      name: 'pathway.progress.update',
      description: 'Update user progress for a pathway',
      inputSchema: { type: 'object', properties: { userId: { type: 'string' }, pathwayId: { type: 'integer' }, completedSteps: { type: 'integer' } }, required: ['userId', 'pathwayId', 'completedSteps'] },
      outputSchema: { type: 'object', properties: { completedSteps: { type: 'integer' } }, required: ['completedSteps'] },
      handler: async ({ input }: any) => updatePathwayProgress(input as any),
    },
    {
      name: 'pathway.progress.get',
      description: 'Get user progress for a pathway',
      inputSchema: { type: 'object', properties: { userId: { type: 'string' }, pathwayId: { type: 'integer' } }, required: ['userId', 'pathwayId'] },
      outputSchema: { type: 'object', properties: { completedSteps: { type: 'integer' } }, required: ['completedSteps'] },
      handler: async ({ input }: any) => getPathwayProgress(input as any),
    },
    {
      name: 'math.solveImage',
      description: 'Solve math problems from an image (handwritten or printed). Returns expressions with simplifications and steps.',
      inputSchema: {
        type: 'object',
        properties: {
          imageBase64: { type: 'string' },
          dictOfVars: { type: 'object' },
          testMode: { type: 'boolean' },
        },
        required: ['imageBase64'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                expression: { type: 'string' },
                simplified: { type: 'string' },
                steps: { type: 'array', items: { type: 'string' } },
              },
              required: ['expression', 'simplified'],
            },
          },
          usedAI: { type: 'boolean' },
        },
        required: ['answers', 'usedAI'],
      },
      handler: async ({ input }: any) => solveMathFromImage(input as any),
    },
    {
      name: 'ai.generate',
      description: 'Generic Gemini text generation with configurable params (temperature, topP, topK, max tokens, JSON mode).',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          model: { type: 'string' },
          system: { type: 'string' },
          temperature: { type: 'number' },
          topP: { type: 'number' },
          topK: { type: 'number' },
          maxOutputTokens: { type: 'number' },
          json: { type: 'boolean' },
          testMode: { type: 'boolean' },
        },
        required: ['prompt'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          usedAI: { type: 'boolean' },
          model: { type: 'string' },
          tokensApprox: { type: 'integer' },
        },
        required: ['text', 'usedAI', 'model'],
      },
      handler: async ({ input }: any) => aiGenerate(input as any),
    },
    {
      name: 'speech.transcribe',
      description: 'Transcribe spoken audio from base64 (stub in testMode).',
      inputSchema: {
        type: 'object',
        properties: {
          audioBase64: { type: 'string' },
          mimeType: { type: 'string' },
          languageCode: { type: 'string' },
          enablePunctuation: { type: 'boolean' },
          testMode: { type: 'boolean' },
        },
        required: ['audioBase64'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          segments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                startSec: { type: 'number' },
                endSec: { type: 'number' },
                text: { type: 'string' },
              },
              required: ['startSec', 'endSec', 'text'],
            },
          },
          fullText: { type: 'string' },
          usedAI: { type: 'boolean' },
          languageCode: { type: 'string' },
        },
        required: ['segments', 'fullText', 'usedAI'],
      },
      handler: async ({ input }: any) => speechTranscribe(input as any),
    },
    {
      name: 'code.run',
      description: 'Execute small code snippets in restricted sandbox (stub/pending).',
      inputSchema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['javascript','python','bash'] },
          code: { type: 'string' },
          stdin: { type: 'string' },
          timeLimitSec: { type: 'number' },
          memoryLimitMb: { type: 'number' },
          testMode: { type: 'boolean' },
        },
        required: ['language','code'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          stdout: { type: 'string' },
          stderr: { type: 'string' },
          exitCode: { type: 'integer' },
          durationMs: { type: 'integer' },
          usedSandbox: { type: 'boolean' },
          language: { type: 'string' },
          truncated: { type: 'boolean' },
        },
        required: ['stdout','stderr','exitCode','durationMs','usedSandbox','language','truncated'],
      },
      handler: async ({ input }: any) => codeRun(input as any),
    },
  ];
}

// If executed directly start Server with StdioServerTransport
if (require.main === module) {
  const server = new Server(
    {
      name: 'gen-ed-sdk',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Get all tools
  const allTools = getSdkTools();

  // Register handler for tools/list
  server.setRequestHandler(
    {
      method: z.literal('tools/list'),
      params: z.optional(z.object({
        _meta: z.optional(z.object({}).passthrough()),
        cursor: z.optional(z.string()),
      }).passthrough()),
    } as any,
    async (_request: any) => {
      return {
        tools: allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    }
  );

  // Register handler for tools/call
  server.setRequestHandler(
    {
      method: z.literal('tools/call'),
      params: z.object({
        name: z.string(),
        arguments: z.optional(z.record(z.unknown())),
        _meta: z.optional(z.object({}).passthrough()),
      }).passthrough(),
    } as any,
    async (request: any) => {
      const toolName = request.params.name;
      const tool = allTools.find(t => t.name === toolName) as ToolWithHandler | undefined;
      
      if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
      }
      
      const result = await tool.handler({ input: request.params.arguments || {} });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Connect transport and start
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  console.error('Gen-Ed MCP Server running on stdio');
}

// New dynamic schema-based tool registry (schema consolidation)
export function getSdkTools(): ToolWithHandler[] {
  return [
    {
      name: 'course.list',
      description: 'List courses with pagination',
      inputSchema: toJsonSchema(CourseListInput, 'CourseListInput'),
      outputSchema: toJsonSchema(CourseListOutput, 'CourseListOutput'),
      handler: async ({ input }: any) => {
        const page = typeof input?.page === 'number' ? input.page : 0;
        const limit = typeof input?.limit === 'number' ? input.limit : 8;
        return await listCourses({ page, limit });
      },
    },
    {
      name: 'course.create',
      description: 'Create a course entry',
      inputSchema: toJsonSchema(CourseCreateInput, 'CourseCreateInput'),
      outputSchema: toJsonSchema(CourseCreateOutput, 'CourseCreateOutput'),
      handler: async ({ input }: any) => createCourse(input as any),
    },
    {
      name: 'course.get',
      description: 'Get single course by numeric id or courseId',
      inputSchema: toJsonSchema(CourseGetInput, 'CourseGetInput'),
      outputSchema: toJsonSchema(CourseGetOutput, 'CourseGetOutput'),
      handler: async ({ input }: any) => getCourse(input as any),
    },
    {
      name: 'course.update',
      description: 'Update mutable fields of a course',
      inputSchema: toJsonSchema(CourseUpdateInput, 'CourseUpdateInput'),
      outputSchema: toJsonSchema(CourseUpdateOutput, 'CourseUpdateOutput'),
      handler: async ({ input }: any) => updateCourse(input as any),
    },
    {
      name: 'course.delete',
      description: 'Delete a course by id or courseId',
      inputSchema: toJsonSchema(CourseDeleteInput, 'CourseDeleteInput'),
      outputSchema: toJsonSchema(CourseDeleteOutput, 'CourseDeleteOutput'),
      handler: async ({ input }: any) => deleteCourse(input as any),
    },
    {
      name: 'course.chapter.get',
      description: 'Get a chapter for a course by index',
      inputSchema: toJsonSchema(CourseChapterGetInput, 'CourseChapterGetInput'),
      outputSchema: toJsonSchema(CourseChapterGetOutput, 'CourseChapterGetOutput'),
      handler: async ({ input }: any) => getCourseChapter(input as any),
    },
    {
      name: 'course.progress.increment',
      description: 'Increment course progress (capped at 100)',
      inputSchema: toJsonSchema(CourseProgressIncrementInput, 'CourseProgressIncrementInput'),
      outputSchema: toJsonSchema(CourseProgressIncrementOutput, 'CourseProgressIncrementOutput'),
      handler: async ({ input }: any) => incrementCourseProgress(input as any),
    },
    {
      name: 'course.listByUser',
      description: 'List courses by creator email',
      inputSchema: toJsonSchema(CourseListByUserInput, 'CourseListByUserInput'),
      outputSchema: toJsonSchema(CourseListByUserOutput, 'CourseListByUserOutput'),
      handler: async ({ input }: any) => listUserCourses(input as any),
    },
    {
      name: 'resume.list',
      description: 'List previous resume analyses for a user',
      inputSchema: toJsonSchema(ResumeListInput, 'ResumeListInput'),
      outputSchema: toJsonSchema(ResumeListOutput, 'ResumeListOutput'),
      handler: async ({ input }: any) => {
        const userId = input?.userId;
        const limit = typeof input?.limit === 'number' ? input.limit : 20;
        return await listResumeAnalyses({ userId, limit } as any);
      },
    },
    {
      name: 'resume.analyze',
      description: 'Analyze a resume against a job description',
      inputSchema: toJsonSchema(ResumeAnalyzeInput, 'ResumeAnalyzeInput'),
      outputSchema: toJsonSchema(ResumeAnalyzeOutput, 'ResumeAnalyzeOutput'),
      handler: async ({ input }: any) => analyzeResume(input as any),
    },
    {
      name: 'resume.report.get',
      description: 'Generate base64 PDF for stored analysis',
      inputSchema: toJsonSchema(ResumeReportGetInput, 'ResumeReportGetInput'),
      outputSchema: toJsonSchema(ResumeReportGetOutput, 'ResumeReportGetOutput'),
      handler: async ({ input }: any) => getResumeReport(input as any),
    },
    {
      name: 'resume.report.generate',
      description: 'Generate base64 PDF from provided analysis object',
      inputSchema: toJsonSchema(ResumeReportGenerateInput, 'ResumeReportGenerateInput'),
      outputSchema: toJsonSchema(ResumeReportGenerateOutput, 'ResumeReportGenerateOutput'),
      handler: async ({ input }: any) => generateResumeReport(input as any),
    },
    {
      name: 'forum.topic.list',
      description: 'List forum topics for a course',
      inputSchema: toJsonSchema(ForumTopicListInput, 'ForumTopicListInput'),
      outputSchema: toJsonSchema(ForumTopicListOutput, 'ForumTopicListOutput'),
      handler: async ({ input }: any) => listTopics({ courseId: input.courseId }),
    },
    {
      name: 'forum.topic.create',
      description: 'Create a new forum topic',
      inputSchema: toJsonSchema(ForumTopicCreateInput, 'ForumTopicCreateInput'),
      outputSchema: toJsonSchema(ForumTopicCreateOutput, 'ForumTopicCreateOutput'),
      handler: async ({ input }: any) => createTopic(input as any),
    },
    {
      name: 'forum.reply.list',
      description: 'List replies for a forum topic',
      inputSchema: toJsonSchema(ForumReplyListInput, 'ForumReplyListInput'),
      outputSchema: toJsonSchema(ForumReplyListOutput, 'ForumReplyListOutput'),
      handler: async ({ input }: any) => listReplies({ topicId: input.topicId }),
    },
    {
      name: 'forum.reply.create',
      description: 'Create a reply for a forum topic',
      inputSchema: toJsonSchema(ForumReplyCreateInput, 'ForumReplyCreateInput'),
      outputSchema: toJsonSchema(ForumReplyCreateOutput, 'ForumReplyCreateOutput'),
      handler: async ({ input }: any) => createReply(input as any),
    },
    {
      name: 'events.list',
      description: 'List hackathons and meetups',
      inputSchema: toJsonSchema(EventsListInput, 'EventsListInput'),
      outputSchema: toJsonSchema(EventsListOutput, 'EventsListOutput'),
      handler: async ({ input }: any) => {
        const includeHackathons = input?.includeHackathons !== false;
        const includeMeetups = input?.includeMeetups !== false;
        return await listEvents({ includeHackathons, includeMeetups });
      },
    },
    {
      name: 'internships.list',
      description: 'List internships (scraped)',
      inputSchema: toJsonSchema(InternshipsListInput, 'InternshipsListInput'),
      outputSchema: toJsonSchema(InternshipsListOutput, 'InternshipsListOutput'),
      handler: async ({ input }: any) => listInternships(input as any),
    },
    {
      name: 'course.generate',
      description: 'Generate course chapters & publish course',
      inputSchema: toJsonSchema(CourseGenerateInput, 'CourseGenerateInput'),
      outputSchema: toJsonSchema(CourseGenerateOutput, 'CourseGenerateOutput'),
      handler: async ({ input }: any) => {
        // SDK requires userId for course.generate, even in testMode
        ensureUserId(input, 'course.generate');
        return await generateCourseContent(input as any);
      },
    },
    {
      name: 'course.chat',
      description: 'Answer a query about a course using its chapters',
      inputSchema: toJsonSchema(CourseChatInput, 'CourseChatInput'),
      outputSchema: toJsonSchema(CourseChatOutput, 'CourseChatOutput'),
      handler: async ({ input }: any) => courseChat(input as any),
    },
    {
      name: 'pathway.create',
      description: 'Generate and optionally persist a learning pathway',
      inputSchema: toJsonSchema(PathwayCreateInput, 'PathwayCreateInput'),
      outputSchema: toJsonSchema(PathwayCreateOutput, 'PathwayCreateOutput'),
      handler: async ({ input }: any) => {
        // In SDK context, allow testMode to bypass strict auth for local experimentation
        if (!input?.testMode) ensureUserId(input, 'pathway.create');
        return createLearningPathway(input as any);
      },
    },
    {
      name: 'pathway.get',
      description: 'Get a pathway by slug',
      inputSchema: toJsonSchema(PathwayGetInput, 'PathwayGetInput'),
      outputSchema: toJsonSchema(PathwayCreateOutput, 'PathwayGetOutput'),
      handler: async ({ input }: any) => getPathwayBySlug(input.slug),
    },
    {
      name: 'pathway.list',
      description: 'List all pathways',
      inputSchema: toJsonSchema(undefined, 'PathwayListInput'),
      outputSchema: toJsonSchema(PathwayListOutput, 'PathwayListOutput'),
      handler: async () => listPathways(),
    },
    {
      name: 'pathway.progress.update',
      description: 'Update user progress for a pathway',
      inputSchema: toJsonSchema(PathwayProgressUpdateInput, 'PathwayProgressUpdateInput'),
      outputSchema: toJsonSchema(PathwayProgressOutput, 'PathwayProgressOutput'),
      handler: async ({ input }: any) => updatePathwayProgress(input as any),
    },
    {
      name: 'pathway.progress.get',
      description: 'Get user progress for a pathway',
      inputSchema: toJsonSchema(PathwayProgressGetInput, 'PathwayProgressGetInput'),
      outputSchema: toJsonSchema(PathwayProgressOutput, 'PathwayProgressOutput'),
      handler: async ({ input }: any) => getPathwayProgress(input as any),
    },
    {
      name: 'math.solveImage',
      description: 'Solve math problems from an image (handwritten or printed). Returns expressions with simplifications and steps.',
      inputSchema: toJsonSchema(MathSolveImageInput, 'MathSolveImageInput'),
      outputSchema: toJsonSchema(MathSolveImageOutput, 'MathSolveImageOutput'),
      handler: async ({ input }: any) => solveMathFromImage(input as any),
    },
    {
      name: 'ai.generate',
      description: 'Generic Gemini text generation with configurable params (temperature, topP, topK, max tokens, JSON mode).',
      inputSchema: toJsonSchema(AIGenerateInput, 'AIGenerateInput'),
      outputSchema: toJsonSchema(AIGenerateOutput, 'AIGenerateOutput'),
      handler: async ({ input }: any) => aiGenerate(input as any),
    },
    {
      name: 'speech.transcribe',
      description: 'Transcribe spoken audio from base64 (stub in testMode).',
      inputSchema: toJsonSchema(SpeechTranscribeInput, 'SpeechTranscribeInput'),
      outputSchema: toJsonSchema(SpeechTranscribeOutput, 'SpeechTranscribeOutput'),
      handler: async ({ input }: any) => speechTranscribe(input as any),
    },
    {
      name: 'code.run',
      description: 'Execute small code snippets in restricted sandbox (stub/pending).',
      inputSchema: toJsonSchema(CodeRunInput, 'CodeRunInput'),
      outputSchema: toJsonSchema(CodeRunOutput, 'CodeRunOutput'),
      handler: async ({ input }: any) => codeRun(input as any),
    },
  ];
}