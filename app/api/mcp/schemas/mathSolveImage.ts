import { z } from 'zod';

export const MathSolveImageInput = z.object({
  imageBase64: z.string().min(20, 'imageBase64 too short'),
  dictOfVars: z.record(z.any()).optional(),
  testMode: z.boolean().optional(),
});

export const MathSolveImageOutput = z.object({
  answers: z.array(
    z.object({
      expression: z.string(),
      simplified: z.string(),
      steps: z.array(z.string()).optional(),
    })
  ),
  usedAI: z.boolean(),
});

export type MathSolveImageInputType = z.infer<typeof MathSolveImageInput>;
export type MathSolveImageOutputType = z.infer<typeof MathSolveImageOutput>;