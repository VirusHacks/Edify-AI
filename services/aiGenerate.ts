import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIGenerateInput {
  prompt: string;
  model?: string; // e.g. gemini-2.5-flash, gemini-pro
  system?: string; // optional system instruction
  temperature?: number; // 0-2
  topP?: number; // 0-1
  topK?: number; // integer
  maxOutputTokens?: number; // cap
  json?: boolean; // request JSON structured output
  testMode?: boolean; // stub path
}

export interface AIGenerateOutput {
  text: string;
  usedAI: boolean;
  model: string;
  tokensApprox?: number;
}

function isTestMode(input?: AIGenerateInput) {
  return input?.testMode || process.env.NODE_ENV === 'test';
}

export async function aiGenerate(input: AIGenerateInput): Promise<AIGenerateOutput> {
  const prompt = (input.prompt || '').trim();
  if (!prompt) {
    return { text: 'Empty prompt', usedAI: false, model: input.model || 'none' };
  }

  if (isTestMode(input)) {
    return { text: `Stub generated text for: ${prompt}`, usedAI: false, model: input.model || 'stub' };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { text: 'Missing GEMINI/GOOGLE_AI_API_KEY environment variable', usedAI: false, model: input.model || 'unknown' };
  }

  const modelName = input.model || 'gemini-2.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const generationConfig: any = {};
  if (typeof input.temperature === 'number') generationConfig.temperature = input.temperature;
  if (typeof input.topP === 'number') generationConfig.topP = input.topP;
  if (typeof input.topK === 'number') generationConfig.topK = input.topK;
  if (typeof input.maxOutputTokens === 'number') generationConfig.maxOutputTokens = input.maxOutputTokens;

  // Build full prompt with optional system instruction
  const finalParts: any[] = [];
  if (input.system) {
    finalParts.push(`System Instruction:\n${input.system}\n----\nUser Prompt:`);
  }
  finalParts.push(prompt);

  try {
    const result = await model.generateContent({ contents: [{ role: 'user', parts: finalParts.map(p => ({ text: p })) }], generationConfig });
    let text = result.response.text();
    if (input.json) {
      // attempt to extract JSON blob from response
      const match = text.match(/```json[\s\S]*?```/i);
      if (match) {
        text = match[0].replace(/```json/i, '').replace(/```/g, '').trim();
      } else {
        // naive fallback: try entire text as JSON
        try {
          JSON.parse(text);
        } catch {
          // leave as-is but annotate
          text = `{"warning":"Model did not return JSON","raw":"${escapeJson(text).slice(0,400)}"}`;
        }
      }
    }
    return { text, usedAI: true, model: modelName, tokensApprox: approxTokens(text) };
  } catch (err: any) {
    return { text: 'Generation error: ' + (err?.message || 'unknown'), usedAI: false, model: modelName };
  }
}

function approxTokens(s: string): number {
  // crude heuristic: 1 token ~ 4 chars
  return Math.ceil(s.length / 4);
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

export type { AIGenerateInput as AIGenerateInputType, AIGenerateOutput as AIGenerateOutputType };