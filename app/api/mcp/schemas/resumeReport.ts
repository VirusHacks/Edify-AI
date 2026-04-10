import { z } from 'zod';
import { ResumeReportGetInputSchema, ResumeReportGetOutputSchema, ResumeReportGenerateInputSchema, ResumeReportGenerateOutputSchema } from '@/services/resumeReport';

export const ResumeReportGetInput = ResumeReportGetInputSchema;
export const ResumeReportGetOutput = ResumeReportGetOutputSchema;
export const ResumeReportGenerateInput = ResumeReportGenerateInputSchema;
export const ResumeReportGenerateOutput = ResumeReportGenerateOutputSchema;

export type ResumeReportGetInputT = z.infer<typeof ResumeReportGetInput>;
export type ResumeReportGetOutputT = z.infer<typeof ResumeReportGetOutput>;
export type ResumeReportGenerateInputT = z.infer<typeof ResumeReportGenerateInput>;
export type ResumeReportGenerateOutputT = z.infer<typeof ResumeReportGenerateOutput>;