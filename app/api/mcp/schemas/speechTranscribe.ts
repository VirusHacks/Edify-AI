import { z } from 'zod';

export const SpeechTranscribeInput = z.object({
  audioBase64: z.string().min(20, 'audioBase64 too short'),
  mimeType: z.string().optional(),
  languageCode: z.string().optional(),
  enablePunctuation: z.boolean().optional(),
  testMode: z.boolean().optional(),
});

export const SpeechTranscribeOutput = z.object({
  segments: z.array(
    z.object({
      startSec: z.number(),
      endSec: z.number(),
      text: z.string(),
    })
  ),
  fullText: z.string(),
  usedAI: z.boolean(),
  languageCode: z.string().optional(),
});

export type SpeechTranscribeInputType = z.infer<typeof SpeechTranscribeInput>;
export type SpeechTranscribeOutputType = z.infer<typeof SpeechTranscribeOutput>;