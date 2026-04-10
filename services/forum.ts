import { db } from "@/configs/db";
import { forumTopics, forumReplies } from "@/db/schema/chapter";
import { z } from "zod";

// Schemas
export const ForumTopicSchema = z.object({
  id: z.number(),
  courseId: z.number(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export const ForumReplySchema = z.object({
  id: z.number(),
  topicId: z.number(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const ListTopicsInputSchema = z.object({
  courseId: z.number(),
});
export const ListTopicsOutputSchema = z.object({
  data: z.array(ForumTopicSchema),
});
export type ListTopicsInput = z.infer<typeof ListTopicsInputSchema>;
export type ListTopicsOutput = z.infer<typeof ListTopicsOutputSchema>;

export const CreateTopicInputSchema = z.object({
  courseId: z.number(),
  userId: z.string().optional(),
  title: z.string(),
  content: z.string(),
});
export const CreateTopicOutputSchema = z.object({
  insertedCount: z.number(),
});
export type CreateTopicInput = z.infer<typeof CreateTopicInputSchema>;
export type CreateTopicOutput = z.infer<typeof CreateTopicOutputSchema>;

export const ListRepliesInputSchema = z.object({
  topicId: z.number(),
});
export const ListRepliesOutputSchema = z.object({
  data: z.array(ForumReplySchema),
});
export type ListRepliesInput = z.infer<typeof ListRepliesInputSchema>;
export type ListRepliesOutput = z.infer<typeof ListRepliesOutputSchema>;

export const CreateReplyInputSchema = z.object({
  topicId: z.number(),
  userId: z.string().optional(),
  content: z.string(),
  createdAt: z.date().optional(),
});
export const CreateReplyOutputSchema = z.object({
  insertedCount: z.number(),
});
export type CreateReplyInput = z.infer<typeof CreateReplyInputSchema>;
export type CreateReplyOutput = z.infer<typeof CreateReplyOutputSchema>;

// Service functions with graceful DB fallback
export async function listTopics(input: ListTopicsInput): Promise<ListTopicsOutput> {
  const { courseId } = ListTopicsInputSchema.parse(input);
  try {
    const rows = await db.select().from(forumTopics).where((forumTopics as any).courseId.eq ? (forumTopics as any).courseId.eq(courseId) : undefined);
    return { data: (rows as any[]) || [] };
  } catch {
    return { data: [] };
  }
}

export async function createTopic(input: CreateTopicInput): Promise<CreateTopicOutput> {
  const parsed = CreateTopicInputSchema.parse(input);
  try {
    const res = await db.insert(forumTopics).values({
      courseId: parsed.courseId,
      userId: parsed.userId || "anonymous",
      title: parsed.title,
      content: parsed.content,
    } as any);
    return { insertedCount: Array.isArray(res) ? res.length : 1 };
  } catch {
    return { insertedCount: 0 };
  }
}

export async function listReplies(input: ListRepliesInput): Promise<ListRepliesOutput> {
  const { topicId } = ListRepliesInputSchema.parse(input);
  try {
    const rows = await db.select().from(forumReplies).where((forumReplies as any).topicId.eq ? (forumReplies as any).topicId.eq(topicId) : undefined);
    return { data: (rows as any[]) || [] };
  } catch {
    return { data: [] };
  }
}

export async function createReply(input: CreateReplyInput): Promise<CreateReplyOutput> {
  const parsed = CreateReplyInputSchema.parse(input);
  try {
    const res = await db.insert(forumReplies).values({
      topicId: parsed.topicId,
      userId: parsed.userId || "anonymous",
      content: parsed.content,
      createdAt: parsed.createdAt || new Date(),
    } as any);
    return { insertedCount: Array.isArray(res) ? res.length : 1 };
  } catch {
    return { insertedCount: 0 };
  }
}
