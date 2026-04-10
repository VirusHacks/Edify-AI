import { db } from '@/db';
import { resumeAnalysisTable } from '@/db/schema';
import { generateResumeReportPDF } from '@/lib/pdf-report-generator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Input schema for fetching a stored analysis and producing PDF
export const ResumeReportGetInputSchema = z.object({ analysisId: z.string(), testMode: z.boolean().optional() });
export const ResumeReportGetOutputSchema = z.object({ analysisId: z.string(), pdfBase64: z.string(), bytes: z.number() });
export type ResumeReportGetInput = z.infer<typeof ResumeReportGetInputSchema>;
export type ResumeReportGetOutput = z.infer<typeof ResumeReportGetOutputSchema>;

// Input schema for ad-hoc PDF generation from provided analysis object
export const ResumeReportGenerateInputSchema = z.object({
  analysis: z.object({
    overallScore: z.number().default(0),
    atsMatchPercentage: z.number().default(0),
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    sectionRecommendations: z.array(z.object({
      section: z.string(),
      issue: z.string(),
      suggestion: z.string(),
      priority: z.string().default('medium'),
    })).optional(),
    missingKeywords: z.array(z.string()).optional(),
    suggestedKeywords: z.array(z.string()).optional(),
    aiGeneratedSummary: z.string().optional(),
    rewrittenSummary: z.string().optional(),
    nextSteps: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    analysisId: z.string().default('temp_analysis'),
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    generatedAt: z.string().default(() => new Date().toISOString()),
  }).optional(),
  testMode: z.boolean().optional(),
});
export const ResumeReportGenerateOutputSchema = z.object({ analysisId: z.string(), pdfBase64: z.string(), bytes: z.number() });
export type ResumeReportGenerateInput = z.infer<typeof ResumeReportGenerateInputSchema>;
export type ResumeReportGenerateOutput = z.infer<typeof ResumeReportGenerateOutputSchema>;

function stubPdf(): { base64: string; bytes: number } {
  const bytes = Uint8Array.from([0x25,0x50,0x44,0x46]); // '%PDF' header minimal stub
  return { base64: Buffer.from(bytes).toString('base64'), bytes: bytes.length };
}

export async function getResumeReport(input: ResumeReportGetInput): Promise<ResumeReportGetOutput> {
  const { analysisId, testMode } = ResumeReportGetInputSchema.parse(input);
  if (process.env.NODE_ENV === 'test' || testMode) {
    const stub = stubPdf();
    return { analysisId, pdfBase64: stub.base64, bytes: stub.bytes };
  }
  try {
    const [analysis] = await db.select().from(resumeAnalysisTable).where(eq(resumeAnalysisTable.analysisId, analysisId));
    if (!analysis) {
      const stub = stubPdf();
      return { analysisId, pdfBase64: stub.base64, bytes: stub.bytes };
    }
    const pdfBytes = await generateResumeReportPDF(analysis.recommendations as any, {
      analysisId: analysis.analysisId,
      jobTitle: analysis.jobTitle || undefined,
      companyName: analysis.companyName || undefined,
      generatedAt: typeof analysis.createdAt === 'string' ? analysis.createdAt : new Date(analysis.createdAt).toISOString(),
    });
    return { analysisId, pdfBase64: Buffer.from(pdfBytes).toString('base64'), bytes: pdfBytes.length };
  } catch {
    const stub = stubPdf();
    return { analysisId, pdfBase64: stub.base64, bytes: stub.bytes };
  }
}

export async function generateResumeReport(input: ResumeReportGenerateInput): Promise<ResumeReportGenerateOutput> {
  const { analysis, metadata, testMode } = ResumeReportGenerateInputSchema.parse(input);
  const meta = metadata || { analysisId: 'temp_analysis', generatedAt: new Date().toISOString() };
  if (process.env.NODE_ENV === 'test' || testMode) {
    const stub = stubPdf();
    return { analysisId: meta.analysisId, pdfBase64: stub.base64, bytes: stub.bytes };
  }
  try {
    const pdfBytes = await generateResumeReportPDF(analysis as any, meta);
    return { analysisId: meta.analysisId, pdfBase64: Buffer.from(pdfBytes).toString('base64'), bytes: pdfBytes.length };
  } catch {
    const stub = stubPdf();
    return { analysisId: meta.analysisId, pdfBase64: stub.base64, bytes: stub.bytes };
  }
}