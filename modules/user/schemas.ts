import { z } from "zod";

// Helper function to transform JSON strings to arrays
const jsonStringArray = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return val;
  },
  z.array(z.string()).optional(),
);

// Helper function to transform JSON strings to objects
const jsonStringObject = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    return val;
  },
  z.record(z.string()).optional(),
);

// Structured social links schema with common platforms
export const socialLinksSchema = z.object({
  github: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  kaggle: z.string().url().optional().or(z.literal("")),
  leetcode: z.string().url().optional().or(z.literal("")),
  medium: z.string().url().optional().or(z.literal("")),
  devto: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  dribbble: z.string().url().optional().or(z.literal("")),
  behance: z.string().url().optional().or(z.literal("")),
}).optional();

// Profile completeness tracking schema
export const profileCompletenessSchema = z.object({
  hasResume: z.boolean().default(false),
  hasLinkedIn: z.boolean().default(false),
  hasBio: z.boolean().default(false),
  hasSkills: z.boolean().default(false),
  hasInterests: z.boolean().default(false),
  hasOccupation: z.boolean().default(false),
  hasSocialLinks: z.boolean().default(false),
  overallScore: z.number().min(0).max(100).default(0),
}).optional();

export const userUpdateSchema = z.object({
  bio: z.string().optional(),
  interests: jsonStringArray,
  skills: jsonStringArray,
  courses: jsonStringArray,
  preferredLanguages: jsonStringArray,
  learningGoals: jsonStringArray,
  occupation: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialLinks: jsonStringObject,
  // New enhanced profile fields
  linkedinProfileUrl: z.string().url().optional().or(z.literal("")),
  githubUsername: z.string().optional(),
});

// Schema for resume upload response
export const resumeUploadResponseSchema = z.object({
  success: z.boolean(),
  resumeUrl: z.string().url().optional(),
  parsedText: z.string().optional(),
  error: z.string().optional(),
});

// Schema for LinkedIn import response  
export const linkedinImportResponseSchema = z.object({
  success: z.boolean(),
  summary: z.string().optional(),
  error: z.string().optional(),
});

// Schema for AI context generation
export const aiContextSchema = z.object({
  resumeSummary: z.string().optional(),
  linkedinSummary: z.string().optional(),
  skillsContext: z.string().optional(),
  interestsContext: z.string().optional(),
  goalsContext: z.string().optional(),
  fullContext: z.string(),
  generatedAt: z.string(),
});

