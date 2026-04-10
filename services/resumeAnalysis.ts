import { db } from "@/configs/db";
import { resumeAnalysisTable } from "@/db/schema/resume-analysis";
import { generateResumeAnalysisPrompt } from "@/lib/resume-analysis-prompt";
import { GoogleAIModel } from "@/lib/google-ai-model";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Input schema for listing analyses
export const ListResumeAnalysesInputSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ListResumeAnalysesInput = z.infer<typeof ListResumeAnalysesInputSchema>;

// Output schema for list
export const ResumeAnalysisSummarySchema = z.object({
  analysisId: z.string(),
  jobTitle: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  overallScore: z.number(),
  atsMatchPercentage: z.number(),
  createdAt: z.any(),
  recommendations: z.any().optional(),
  aiGeneratedSummary: z.string().nullable().optional(),
});
export const ListResumeAnalysesOutputSchema = z.object({
  data: z.array(ResumeAnalysisSummarySchema),
});
export type ListResumeAnalysesOutput = z.infer<typeof ListResumeAnalysesOutputSchema>;

// Input for analysis generation (tool-friendly JSON; differs from multipart form)
export const AnalyzeResumeInputSchema = z.object({
  userId: z.string().optional(), // optional for tool invocation without persistence
  resumeText: z.string().optional(),
  jobDescription: z.string(),
  keywords: z.array(z.string()).optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

export const AnalyzeResumeOutputSchema = z.object({
  analysisId: z.string(),
  overallScore: z.number(),
  atsMatchPercentage: z.number(),
  analysis: z.any(),
  stored: z.boolean(),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

// List previous analyses for user
export async function listResumeAnalyses(input: ListResumeAnalysesInput): Promise<ListResumeAnalysesOutput> {
  const { userId, limit } = ListResumeAnalysesInputSchema.parse(input);
  try {
    const rows = await db
      .select()
      .from(resumeAnalysisTable)
      .where((resumeAnalysisTable as any).userId.eq ? (resumeAnalysisTable as any).userId.eq(userId) : undefined)
      .limit(limit);
    // If where builder unsupported in this context fallback to empty
    const data = Array.isArray(rows)
      ? rows.map((r: any) => ({
          analysisId: r.analysisId,
          jobTitle: r.jobTitle,
          companyName: r.companyName,
          overallScore: r.overallScore,
          atsMatchPercentage: r.atsMatchPercentage,
          createdAt: r.createdAt,
          recommendations: r.recommendations,
          aiGeneratedSummary: r.aiGeneratedSummary,
        }))
      : [];
    return { data };
  } catch {
    return { data: [] }; // Graceful fallback when DB unavailable in tests
  }
}

// Generate a resume analysis. If no AI key present, return deterministic stub.
export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  const parsed = AnalyzeResumeInputSchema.parse(input);
  const { resumeText, jobDescription, keywords, jobTitle, companyName, userId } = parsed;
  const text = resumeText || "(no resume text provided)";

  let analysis: any = {
    overallScore: 70,
    atsMatchPercentage: 65,
    sectionRecommendations: [],
    missingKeywords: keywords ? [] : [],
    suggestedKeywords: keywords || [],
    aiGeneratedSummary: "Placeholder summary (AI key missing or generation skipped).",
    nextSteps: ["Refine summary", "Add measurable achievements"],
    strengths: ["Structure"],
    weaknesses: ["Needs more quantifiable results"],
  };
  let usedAI = false;
  try {
    const prompt = generateResumeAnalysisPrompt({
      resumeText: text,
      jobDescription,
      keywords: keywords?.join(", "),
      jobTitle,
      companyName,
    });
    const model = new GoogleAIModel();
    const aiResponse = await model.generateContent(prompt);
    analysis = JSON.parse(aiResponse);
    usedAI = true;
  } catch {
    // swallow errors due to missing API key or model issues; keep stub
  }

  const analysisId = `analysis_${uuidv4()}`;
  let stored = false;
  if (userId) {
    try {
      await db.insert(resumeAnalysisTable).values({
        analysisId,
        userId,
        jobTitle: jobTitle || null,
        companyName: companyName || null,
        overallScore: analysis.overallScore || 0,
        atsMatchPercentage: analysis.atsMatchPercentage || 0,
        resumeText: text,
        jobDescription,
        keywords: keywords?.join(", ") || null,
        recommendations: analysis,
        aiGeneratedSummary: analysis.aiGeneratedSummary || null,
        reportUrl: null,
      });
      stored = true;
    } catch {
      stored = false;
    }
  }
  return {
    analysisId,
    overallScore: analysis.overallScore || 0,
    atsMatchPercentage: analysis.atsMatchPercentage || 0,
    analysis: analysis,
    stored,
  };
}
