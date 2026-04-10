import { z } from 'zod';
import { ListInternshipsInputSchema, ListInternshipsOutputSchema } from '@/services/internships';

export const InternshipsListInput = ListInternshipsInputSchema;
export const InternshipsListOutput = ListInternshipsOutputSchema;

export type InternshipsListInputT = z.infer<typeof InternshipsListInput>;
export type InternshipsListOutputT = z.infer<typeof InternshipsListOutput>;