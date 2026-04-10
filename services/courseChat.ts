import { z } from 'zod';
import { processDescriptionAndQuery } from '@/app/api/lib/helper';

// Mirror structure expected by original /api/chat route
export const CourseChatChapterSchema = z.object({
  chapter_name: z.string(),
  description: z.string(),
  duration: z.string().optional(),
});

export const CourseChatCourseSchema = z.object({
  courseName: z.string(),
  courseOutput: z.object({
    category: z.string(),
    chapters: z.array(CourseChatChapterSchema),
  }),
});

export const CourseChatInputSchema = z.object({
  query: z.string().min(1),
  course: CourseChatCourseSchema,
  testMode: z.boolean().optional(),
});
export type CourseChatInput = z.infer<typeof CourseChatInputSchema>;

export const CourseChatOutputSchema = z.object({
  answer: z.string(),
  usedAI: z.boolean(),
});
export type CourseChatOutput = z.infer<typeof CourseChatOutputSchema>;

export async function courseChat(input: CourseChatInput): Promise<CourseChatOutput> {
  const { query, course, testMode } = CourseChatInputSchema.parse(input);
  const { category, chapters } = course.courseOutput;
  let description = `Course: ${course.courseName} (${category})\n\n`;
  chapters.forEach((chapter, index) => {
    description += `${index + 1}. ${chapter.chapter_name}\n`;
    description += `   Description: ${chapter.description}\n`;
    if (chapter.duration) description += `   Duration: ${chapter.duration}\n`;
    description += `\n`;
  });

  if (process.env.NODE_ENV === 'test' || testMode) {
    return { answer: `Stub response for query: ${query}`, usedAI: false };
  }
  try {
    const result = await processDescriptionAndQuery(description, query);
    return { answer: result, usedAI: true };
  } catch {
    return { answer: 'Unable to process query at this time.', usedAI: false };
  }
}