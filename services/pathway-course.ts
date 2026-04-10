import { generateCourseLayout } from "@/configs/ai-models";
import { z } from "zod";

/**
 * Schema for generating a course outline from a pathway step
 */
export const GenerateCourseFromStepInputSchema = z.object({
  pathwayTitle: z.string(),
  stepTitle: z.string(),
  stepDescription: z.string(),
  stepResources: z.array(z.object({
    title: z.string(),
    url: z.string().nullable().optional(),
  })).optional(),
  estimatedTime: z.string().optional(),
  difficulty: z.string().optional(),
  testMode: z.boolean().optional(),
});
export type GenerateCourseFromStepInput = z.infer<typeof GenerateCourseFromStepInputSchema>;

export const GenerateCourseFromStepOutputSchema = z.object({
  category: z.string(),
  topic: z.string(),
  description: z.string(),
  level: z.string(),
  duration: z.string(),
  chapters: z.array(z.object({
    chapter_name: z.string(),
    description: z.string(),
    duration: z.string(),
  })),
  suggestedChapterCount: z.number(),
});
export type GenerateCourseFromStepOutput = z.infer<typeof GenerateCourseFromStepOutputSchema>;

/**
 * Generate a course outline from a pathway step
 * This creates prefill data for the course creation wizard
 */
export async function generateCourseOutlineFromStep(
  input: GenerateCourseFromStepInput
): Promise<GenerateCourseFromStepOutput> {
  const { 
    pathwayTitle, 
    stepTitle, 
    stepDescription, 
    stepResources, 
    estimatedTime,
    difficulty,
    testMode 
  } = GenerateCourseFromStepInputSchema.parse(input);

  // In test mode, return stub data
  if (process.env.NODE_ENV === 'test' || testMode) {
    return {
      category: "Programming",
      topic: stepTitle,
      description: stepDescription,
      level: difficulty || "Beginner",
      duration: estimatedTime || "1 hour",
      chapters: [
        { chapter_name: "Introduction", description: "Getting started", duration: "15 minutes" },
        { chapter_name: "Core Concepts", description: "Main content", duration: "30 minutes" },
        { chapter_name: "Practice", description: "Hands-on exercises", duration: "15 minutes" },
      ],
      suggestedChapterCount: 3,
    };
  }

  // Build context from resources if available
  const resourceContext = stepResources?.length 
    ? `\nRelevant resources to consider: ${stepResources.map(r => r.title).join(", ")}`
    : "";

  const prompt = `Generate a detailed course outline for the following learning step from a "${pathwayTitle}" career pathway:

Step Title: ${stepTitle}
Step Description: ${stepDescription}
Estimated Time for Step: ${estimatedTime || "Not specified"}
Difficulty Level: ${difficulty || "Not specified"}${resourceContext}

Please generate a comprehensive course outline in JSON format with:
- category: The main category (e.g., "Programming", "Business", "Data Science", etc.)
- topic: A clear course topic based on the step title
- description: A compelling course description (2-3 sentences)
- level: Difficulty level ("Beginner", "Intermediate", or "Advanced")
- duration: Suggested total course duration
- chapters: An array of 4-8 chapters, each with chapter_name, description, and duration
- suggestedChapterCount: The number of chapters

Make the course practical and actionable, focused on building skills for the ${pathwayTitle} career path.`;

  try {
    const result = await generateCourseLayout.sendMessage(prompt);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    // Validate and return with defaults
    return {
      category: data.category || "Programming",
      topic: data.topic || stepTitle,
      description: data.description || stepDescription,
      level: data.level || difficulty || "Beginner",
      duration: data.duration || estimatedTime || "1 hour",
      chapters: data.chapters || [],
      suggestedChapterCount: data.suggestedChapterCount || data.chapters?.length || 5,
    };
  } catch (error) {
    console.error("Error generating course outline from step:", error);
    // Return fallback data
    return {
      category: inferCategory(stepTitle, stepDescription),
      topic: stepTitle,
      description: stepDescription,
      level: mapDifficulty(difficulty),
      duration: estimatedTime || "1 hour",
      chapters: generateFallbackChapters(stepTitle),
      suggestedChapterCount: 5,
    };
  }
}

/**
 * Infer category from step content
 */
function inferCategory(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes("python") || content.includes("javascript") || content.includes("coding") || 
      content.includes("programming") || content.includes("development") || content.includes("software")) {
    return "Programming";
  }
  if (content.includes("business") || content.includes("management") || content.includes("marketing")) {
    return "Business";
  }
  if (content.includes("data") || content.includes("analytics") || content.includes("machine learning") ||
      content.includes("ai") || content.includes("artificial intelligence")) {
    return "Data Science";
  }
  if (content.includes("design") || content.includes("ui") || content.includes("ux")) {
    return "Design";
  }
  if (content.includes("finance") || content.includes("accounting")) {
    return "Finance & Accounting";
  }
  
  return "Programming"; // Default
}

/**
 * Map pathway difficulty to course level
 */
function mapDifficulty(difficulty?: string): string {
  if (!difficulty) return "Beginner";
  const d = difficulty.toLowerCase();
  if (d.includes("beginner") || d.includes("basic") || d.includes("intro")) return "Beginner";
  if (d.includes("intermediate") || d.includes("medium")) return "Intermediate";
  if (d.includes("advanced") || d.includes("expert")) return "Advanced";
  return "Beginner";
}

/**
 * Generate fallback chapters when AI fails
 */
function generateFallbackChapters(stepTitle: string) {
  return [
    { chapter_name: `Introduction to ${stepTitle}`, description: "Overview and fundamentals", duration: "15 minutes" },
    { chapter_name: "Core Concepts", description: "Understanding the key principles", duration: "20 minutes" },
    { chapter_name: "Practical Applications", description: "Hands-on examples and exercises", duration: "25 minutes" },
    { chapter_name: "Best Practices", description: "Industry standards and tips", duration: "15 minutes" },
    { chapter_name: "Summary and Next Steps", description: "Review and further learning paths", duration: "10 minutes" },
  ];
}

/**
 * Quick outline generation for UI preview (lighter weight)
 */
export async function generateQuickCoursePreview(
  stepTitle: string,
  stepDescription: string,
  difficulty?: string
): Promise<{ topic: string; description: string; category: string; level: string }> {
  return {
    topic: stepTitle,
    description: stepDescription,
    category: inferCategory(stepTitle, stepDescription),
    level: mapDifficulty(difficulty),
  };
}
