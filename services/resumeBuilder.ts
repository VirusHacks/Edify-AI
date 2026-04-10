import { db } from "@/configs/db";
import { documentTable } from "@/db/schema/document";
import { personalInfoTable } from "@/db/schema/personal-info";
import { experienceTable } from "@/db/schema/experience";
import { educationTable } from "@/db/schema/education";
import { skillsTable } from "@/db/schema/skills";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { GoogleAIModel } from "@/lib/google-ai-model";
import { getProfile, extractProfileForResume } from "@/services/profile";

// Schema for personal info input
const PersonalInfoInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  jobTitle: z.string().optional(),
});

// Schema for experience input
const ExperienceInputSchema = z.object({
  title: z.string(),
  companyName: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  workSummary: z.string().optional(),
});

// Schema for education input
const EducationInputSchema = z.object({
  universityName: z.string(),
  degree: z.string(),
  major: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Schema for skill input
const SkillInputSchema = z.object({
  name: z.string(),
  rating: z.number().min(0).max(5).optional(),
});

// Main input schema for resume creation
export const CreateResumeInputSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string(),
  
  // Resume title
  title: z.string().optional(),
  summary: z.string().optional(),
  themeColor: z.string().optional(),
  
  // Personal info
  personalInfo: PersonalInfoInputSchema.optional(),
  
  // Experience (array)
  experience: z.array(ExperienceInputSchema).optional(),
  
  // Education (array)
  education: z.array(EducationInputSchema).optional(),
  
  // Skills (array of strings or objects)
  skills: z.array(z.union([z.string(), SkillInputSchema])).optional(),
  
  // Raw text input for AI parsing
  rawInput: z.string().optional(),
  
  // Test mode flag
  testMode: z.boolean().optional(),
});

export type CreateResumeInput = z.infer<typeof CreateResumeInputSchema>;

// Output schema
export const CreateResumeOutputSchema = z.object({
  success: z.boolean(),
  documentId: z.string(),
  title: z.string(),
  url: z.string(),
  message: z.string(),
  missingFields: z.array(z.string()).optional(),
  needsMoreInfo: z.boolean(),
  data: z.object({
    documentId: z.string(),
    title: z.string(),
    redirectUrl: z.string(),
    sectionsCreated: z.object({
      personalInfo: z.boolean(),
      experiences: z.number(),
      educations: z.number(),
      skills: z.number(),
    }),
  }).optional(),
  error: z.string().optional(),
});

export type CreateResumeOutput = z.infer<typeof CreateResumeOutputSchema>;

// Validation result schema
export const ValidateResumeInputSchema = z.object({
  userId: z.string().min(1),
  personalInfo: PersonalInfoInputSchema.optional(),
  experience: z.array(ExperienceInputSchema).optional(),
  education: z.array(EducationInputSchema).optional(),
  skills: z.array(z.union([z.string(), SkillInputSchema])).optional(),
  rawInput: z.string().optional(),
});

export const ValidateResumeOutputSchema = z.object({
  isValid: z.boolean(),
  missingRequired: z.array(z.string()),
  missingOptional: z.array(z.string()),
  suggestions: z.array(z.string()),
  parsedData: z.any().optional(),
});

/**
 * Parse raw text input into structured resume data using AI
 */
async function parseRawInput(rawInput: string, testMode?: boolean): Promise<Partial<CreateResumeInput>> {
  if (testMode) {
    // Return mock parsed data in test mode
    return {
      personalInfo: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        jobTitle: "Software Engineer",
      },
      skills: ["JavaScript", "React", "Node.js"],
    };
  }

  try {
    const model = new GoogleAIModel();
    const prompt = `Parse the following text into structured resume data. Extract any information about:
- Personal info (name, email, phone, address, job title)
- Work experience (job titles, companies, dates, descriptions)
- Education (schools, degrees, majors, dates)
- Skills (technical and soft skills)

Return ONLY valid JSON in this exact format (omit empty arrays/objects):
{
  "personalInfo": {
    "firstName": "string or null",
    "lastName": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "address": "string or null",
    "jobTitle": "string or null"
  },
  "experience": [
    {
      "title": "job title",
      "companyName": "company",
      "city": "city or null",
      "state": "state or null",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "currentlyWorking": false,
      "workSummary": "description or null"
    }
  ],
  "education": [
    {
      "universityName": "school name",
      "degree": "degree type",
      "major": "field of study or null",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null"
    }
  ],
  "skills": ["skill1", "skill2"]
}

TEXT TO PARSE:
${rawInput}

JSON OUTPUT:`;

    const result = await model.generateContent(prompt);
    
    // Extract JSON from response
    let jsonStr = result.trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/g, "");
    
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(jsonStr.slice(jsonStart, jsonEnd + 1));
      return parsed;
    }
  } catch (error) {
    console.error("[ResumeBuilder] Failed to parse raw input:", error);
  }
  
  return {};
}

/**
 * Generate a professional summary using AI
 */
async function generateSummary(data: Partial<CreateResumeInput>, testMode?: boolean): Promise<string> {
  if (testMode) {
    return "Experienced professional with expertise in software development.";
  }

  try {
    const model = new GoogleAIModel();
    const jobTitle = data.personalInfo?.jobTitle || "Professional";
    const skills = Array.isArray(data.skills) 
      ? data.skills.map(s => typeof s === 'string' ? s : s.name).join(", ")
      : "";
    const experience = data.experience?.map(e => `${e.title} at ${e.companyName}`).join("; ") || "";
    
    const prompt = `Write a brief, professional resume summary (2-3 sentences) for a ${jobTitle}.
${skills ? `Skills: ${skills}` : ""}
${experience ? `Experience: ${experience}` : ""}

The summary should be in first person, confident, and highlight key strengths. Return ONLY the summary text, no quotes or formatting.`;

    const result = await model.generateContent(prompt);
    return result.trim().replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error("[ResumeBuilder] Failed to generate summary:", error);
    return "";
  }
}

/**
 * Validate resume input and identify missing fields
 * Checks profile data to see what's already available
 */
export async function validateResumeInput(input: z.infer<typeof ValidateResumeInputSchema>): Promise<z.infer<typeof ValidateResumeOutputSchema>> {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const suggestions: string[] = [];

  // Fetch user profile to check existing data
  let profileData: ReturnType<typeof extractProfileForResume> | null = null;
  if (input.userId) {
    try {
      const profileResult = await getProfile({ userId: input.userId });
      if (profileResult.success && profileResult.data) {
        profileData = extractProfileForResume(profileResult.data);
      }
    } catch (error) {
      console.warn("[ResumeBuilder] Could not load profile for validation:", error);
    }
  }

  // Parse raw input if provided
  let parsedData: Partial<CreateResumeInput> = {};
  if (input.rawInput) {
    parsedData = await parseRawInput(input.rawInput);
  }

  // Merge with provided structured data and profile (profile as base)
  const merged = {
    personalInfo: { 
      ...(profileData?.personalInfo || {}),
      ...parsedData.personalInfo, 
      ...input.personalInfo 
    },
    experience: input.experience?.length ? input.experience : parsedData.experience,
    education: input.education?.length ? input.education : parsedData.education,
    skills: input.skills?.length ? input.skills : (parsedData.skills || profileData?.skills),
  };

  // Check required fields
  if (!merged.personalInfo?.firstName && !merged.personalInfo?.lastName) {
    missingRequired.push("name (firstName and/or lastName)");
    suggestions.push("Please provide your full name.");
  }

  if (!merged.personalInfo?.email) {
    missingRequired.push("email");
    suggestions.push("Please provide your email address.");
  }

  // Check recommended fields
  if (!merged.personalInfo?.phone) {
    missingOptional.push("phone");
  }

  if (!merged.personalInfo?.jobTitle) {
    missingOptional.push("jobTitle");
    suggestions.push("What is your current or desired job title?");
  }

  if (!merged.experience?.length) {
    missingOptional.push("experience");
    suggestions.push("Would you like to add any work experience?");
  }

  if (!merged.education?.length) {
    missingOptional.push("education");
    suggestions.push("Would you like to add your education background?");
  }

  if (!merged.skills?.length) {
    missingOptional.push("skills");
    suggestions.push("What are your key skills?");
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    suggestions,
    parsedData: merged,
  };
}

/**
 * Create a new resume document with all provided data
 * Automatically fetches and merges user profile data
 */
export async function createResume(input: CreateResumeInput): Promise<CreateResumeOutput> {
  const validated = CreateResumeInputSchema.parse(input);
  
  // Fetch user profile to pre-fill data
  let profileData: ReturnType<typeof extractProfileForResume> | null = null;
  if (validated.userId && !validated.testMode) {
    try {
      const profileResult = await getProfile({ userId: validated.userId });
      if (profileResult.success && profileResult.data) {
        profileData = extractProfileForResume(profileResult.data);
        console.log("[ResumeBuilder] Loaded profile data for user:", validated.userId);
      }
    } catch (error) {
      console.warn("[ResumeBuilder] Could not load profile data:", error);
    }
  }
  
  // Parse raw input if provided
  let parsedData: Partial<CreateResumeInput> = {};
  if (validated.rawInput) {
    parsedData = await parseRawInput(validated.rawInput, validated.testMode);
  }

  // Merge data with priority: structured input > parsed input > profile data
  // Profile data acts as the base/fallback
  const personalInfo = { 
    ...(profileData?.personalInfo || {}),
    ...parsedData.personalInfo, 
    ...validated.personalInfo 
  };
  
  // For skills, merge from profile if not provided
  let skills = validated.skills?.length ? validated.skills : parsedData.skills;
  if ((!skills || skills.length === 0) && profileData?.skills?.length) {
    skills = profileData.skills;
  }
  
  const experience = validated.experience?.length ? validated.experience : parsedData.experience;
  const education = validated.education?.length ? validated.education : parsedData.education;

  // Check for required fields
  const missingFields: string[] = [];
  
  if (!personalInfo?.firstName && !personalInfo?.lastName) {
    missingFields.push("name");
  }
  if (!personalInfo?.email) {
    missingFields.push("email");
  }

  // If critical fields are missing, return early with suggestions
  if (missingFields.length > 0) {
    return {
      success: false,
      documentId: "",
      title: "",
      url: "",
      message: `I need a bit more information to create your resume. Please provide: ${missingFields.join(", ")}.`,
      missingFields,
      needsMoreInfo: true,
    };
  }

  // Generate document ID
  const documentId = `doc-${uuidv4()}`;
  
  // Determine title
  const firstName = personalInfo?.firstName || "";
  const lastName = personalInfo?.lastName || "";
  const jobTitle = personalInfo?.jobTitle || "Professional";
  const title = validated.title || `${firstName} ${lastName} - ${jobTitle} Resume`.trim();

  // Generate summary if not provided
  let summary = validated.summary;
  if (!summary) {
    summary = await generateSummary({
      personalInfo,
      experience,
      education,
      skills,
    }, validated.testMode);
  }

  // Create the document (without transaction - neon-http doesn't support transactions)
  try {
    // Track what sections were created for the response
    const sectionsCreated = {
      personalInfo: false,
      experiences: 0,
      educations: 0,
      skills: 0,
    };

    // 1. Create the main document
    const [doc] = await db
      .insert(documentTable)
      .values({
        documentId,
        userId: validated.userId,
        title,
        summary,
        themeColor: validated.themeColor || "#7c3aed",
        authorName: validated.userName,
        authorEmail: validated.userEmail,
        status: "private",
      })
      .returning();

    if (!doc) {
      throw new Error("Failed to create document record");
    }

    // 2. Add personal info
    if (personalInfo && Object.keys(personalInfo).length > 0) {
      await db.insert(personalInfoTable).values({
        docId: doc.id,
        firstName: personalInfo.firstName || null,
        lastName: personalInfo.lastName || null,
        email: personalInfo.email || null,
        phone: personalInfo.phone || null,
        address: personalInfo.address || null,
        jobTitle: personalInfo.jobTitle || null,
      });
      sectionsCreated.personalInfo = true;
    }

    // 3. Add experiences
    if (experience && experience.length > 0) {
      for (const exp of experience) {
        await db.insert(experienceTable).values({
          docId: doc.id,
          title: exp.title,
          companyName: exp.companyName,
          city: exp.city || null,
          state: exp.state || null,
          startDate: exp.startDate || null,
          endDate: exp.endDate || null,
          currentlyWorking: exp.currentlyWorking || false,
          workSummary: exp.workSummary || null,
        });
        sectionsCreated.experiences++;
      }
    }

    // 4. Add education
    if (education && education.length > 0) {
      for (const edu of education) {
        await db.insert(educationTable).values({
          docId: doc.id,
          universityName: edu.universityName,
          degree: edu.degree,
          major: edu.major || null,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          description: edu.description || null,
        });
        sectionsCreated.educations++;
      }
    }

    // 5. Add skills
    if (skills && skills.length > 0) {
      for (const skill of skills) {
        const skillData = typeof skill === "string" 
          ? { name: skill, rating: 3 } 
          : { name: skill.name, rating: skill.rating || 3 };
        
        await db.insert(skillsTable).values({
          docId: doc.id,
          name: skillData.name,
          rating: skillData.rating,
        });
        sectionsCreated.skills++;
      }
    }

    return {
      success: true,
      documentId,
      title,
      url: `/dashboard/document/${documentId}/edit`,
      message: `Great! I've created your resume "${title}". Click below to view and edit it.`,
      needsMoreInfo: false,
      data: {
        documentId,
        title,
        redirectUrl: `/dashboard/document/${documentId}/edit`,
        sectionsCreated,
      },
    };
  } catch (error) {
    console.error("[ResumeBuilder] Failed to create resume:", error);
    return {
      success: false,
      documentId: "",
      title: "",
      url: "",
      message: "Sorry, I encountered an error while creating your resume. Please try again.",
      needsMoreInfo: false,
      error: String(error),
    };
  }
}
