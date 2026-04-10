import { 
  CreateResumeInputSchema, 
  CreateResumeOutputSchema,
  ValidateResumeInputSchema,
  ValidateResumeOutputSchema 
} from "@/services/resumeBuilder";

export const ResumeCreateInput = CreateResumeInputSchema;
export const ResumeCreateOutput = CreateResumeOutputSchema;
export const ResumeValidateInput = ValidateResumeInputSchema;
export const ResumeValidateOutput = ValidateResumeOutputSchema;
