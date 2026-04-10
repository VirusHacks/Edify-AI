import { z } from 'zod';

export const CodeRunInput = z.object({
  language: z.string().min(1, 'language required'), // handler enforces allowlist
  code: z.string().min(1, 'code required'),
  stdin: z.string().optional(),
  timeLimitSec: z.number().min(1).max(30).optional(),
  memoryLimitMb: z.number().min(16).max(512).optional(),
  testMode: z.boolean().optional(),
});

export const CodeRunOutput = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  durationMs: z.number(),
  usedSandbox: z.boolean(),
  language: z.string(),
  truncated: z.boolean(),
});

export type CodeRunInputType = z.infer<typeof CodeRunInput>;
export type CodeRunOutputType = z.infer<typeof CodeRunOutput>;