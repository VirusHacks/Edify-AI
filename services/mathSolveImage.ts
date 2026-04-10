import { GoogleGenerativeAI } from "@google/generative-ai";

interface SolveImageInput {
  imageBase64: string; // raw base64 OR data URL
  dictOfVars?: Record<string, any>;
  testMode?: boolean;
}

interface SolveStepResult {
  expression: string;
  simplified: string;
  steps?: string[];
}

interface SolveImageOutput {
  answers: SolveStepResult[];
  usedAI: boolean;
}

function isTestMode(input?: SolveImageInput) {
  return input?.testMode || process.env.NODE_ENV === "test";
}

function extractPureBase64(data: string) {
  // Accept data URLs or plain base64
  const commaIndex = data.indexOf(",");
  if (commaIndex !== -1) return data.slice(commaIndex + 1).trim();
  return data.trim();
}

// Basic size guard (~5MB raw bytes)
function validateSize(base64: string) {
  // Approx bytes = (length * 3) / 4
  const approxBytes = (base64.length * 3) / 4;
  return approxBytes <= 5 * 1024 * 1024; // 5MB
}

export async function solveMathFromImage(input: SolveImageInput): Promise<SolveImageOutput> {
  if (!input?.imageBase64) {
    return { answers: [], usedAI: false };
  }

  const pureBase64 = extractPureBase64(input.imageBase64);
  if (!validateSize(pureBase64)) {
    // Return graceful error shape via answers array
    return {
      answers: [
        {
          expression: "<error>",
          simplified: "Image too large (max 5MB)",
          steps: [],
        },
      ],
      usedAI: false,
    };
  }

  if (isTestMode(input)) {
    return {
      answers: [
        {
          expression: "2x + 4 = 0",
          simplified: "x = -2",
          steps: ["Identify linear equation", "Move 4 to right side", "Divide by 2"],
        },
      ],
      usedAI: false,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return {
      answers: [
        {
          expression: "<error>",
          simplified: "Missing GEMINI/GOOGLE_AI_API_KEY env var",
          steps: [],
        },
      ],
      usedAI: false,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a math tutor. You will receive an image containing a (possibly handwritten) math problem.\n` +
      `Return ONLY valid JSON (no markdown) as an array of objects with keys: expression, simplified, steps (array of strings).\n` +
      `If multiple distinct expressions appear, include each. If ambiguous, make a best guess. Keep steps concise.`;

    // Build parts: text + inline image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: pureBase64,
          mimeType: "image/png", // assume PNG; Gemini auto-detects usually
        },
      },
    ]);

    const text = result.response.text();
    let parsed: SolveStepResult[] = [];
    try {
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch (e) {
      // Attempt rudimentary cleanup (remove leading/trailing code fences)
      const cleaned = text
        .replace(/^```json/gi, "")
        .replace(/```$/g, "")
        .trim();
      try {
        const again = JSON.parse(cleaned);
        if (Array.isArray(again)) parsed = again;
      } catch (_) {
        parsed = [
          {
            expression: "<parse-error>",
            simplified: "Failed to parse model output",
            steps: [text.slice(0, 200)],
          },
        ];
      }
    }

    // Normalize objects
    const answers = parsed.map((p) => ({
      expression: String((p as any).expression || ""),
      simplified: String((p as any).simplified || ""),
      steps: Array.isArray((p as any).steps) ? (p as any).steps.map(String) : [],
    }));

    return { answers, usedAI: true };
  } catch (err: any) {
    return {
      answers: [
        {
          expression: "<error>",
          simplified: "" + err?.message || "Unknown error",
          steps: [],
        },
      ],
      usedAI: false,
    };
  }
}

export type { SolveImageInput, SolveImageOutput };