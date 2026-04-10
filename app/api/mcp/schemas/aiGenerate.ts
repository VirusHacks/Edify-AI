import { z } from 'zod';

export const AIGenerateInput = z.object({
  prompt: z.string().min(1, 'prompt required'),
  model: z.string().optional(),
  system: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(0).optional(),
  maxOutputTokens: z.number().min(1).max(8192).optional(),
  json: z.boolean().optional(),
  testMode: z.boolean().optional(),
});

export const AIGenerateOutput = z.object({
  text: z.string(),
  usedAI: z.boolean(),
  model: z.string(),
  tokensApprox: z.number().optional(),
});

export type AIGenerateInputType = z.infer<typeof AIGenerateInput>;
export type AIGenerateOutputType = z.infer<typeof AIGenerateOutput>;