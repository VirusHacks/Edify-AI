import { z } from 'zod';
import { CourseChatInputSchema, CourseChatOutputSchema } from '@/services/courseChat';

export const CourseChatInput = CourseChatInputSchema;
export const CourseChatOutput = CourseChatOutputSchema;

export type CourseChatInputT = z.infer<typeof CourseChatInput>;
export type CourseChatOutputT = z.infer<typeof CourseChatOutput>;