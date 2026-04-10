import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";

// Get API key from environment
const apiKey =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_AI_KEY ||
  "";

export interface UserContextData {
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  interests: string[];
  occupation: string | null;
  location: string | null;
  learningGoals: string[];
  resumeParsedText: string | null;
  linkedinSummary: string | null;
}

export interface GeneratedContext {
  fullContext: string;
  generatedAt: string;
}

export interface ProfileCompleteness {
  score: number;
  details: {
    hasResume: boolean;
    hasLinkedIn: boolean;
    hasBio: boolean;
    hasSkills: boolean;
    hasInterests: boolean;
    hasOccupation: boolean;
    hasLocation: boolean;
    hasLearningGoals: boolean;
  };
}

/**
 * Helper to parse JSON array strings
 */
function parseJsonArray(str: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Fetch user data needed for context generation
 */
export async function fetchUserContextData(
  userId: string
): Promise<UserContextData | null> {
  const [userData] = await db
    .select({
      name: userTable.name,
      email: userTable.email,
      bio: userTable.bio,
      skills: userTable.skills,
      interests: userTable.interests,
      occupation: userTable.occupation,
      location: userTable.location,
      learningGoals: userTable.learningGoals,
      resumeParsedText: userTable.resumeParsedText,
      linkedinSummary: userTable.linkedinSummary,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!userData) return null;

  return {
    name: userData.name,
    email: userData.email,
    bio: userData.bio,
    skills: parseJsonArray(userData.skills),
    interests: parseJsonArray(userData.interests),
    occupation: userData.occupation,
    location: userData.location,
    learningGoals: parseJsonArray(userData.learningGoals),
    resumeParsedText: userData.resumeParsedText,
    linkedinSummary: userData.linkedinSummary,
  };
}

/**
 * Calculate profile completeness score
 */
export function calculateProfileCompleteness(
  data: UserContextData
): ProfileCompleteness {
  const details = {
    hasResume: !!data.resumeParsedText,
    hasLinkedIn: !!data.linkedinSummary,
    hasBio: !!data.bio && data.bio.length > 20,
    hasSkills: data.skills.length > 0,
    hasInterests: data.interests.length > 0,
    hasOccupation: !!data.occupation,
    hasLocation: !!data.location,
    hasLearningGoals: data.learningGoals.length > 0,
  };

  // Weight each field
  const weights = {
    hasResume: 20,
    hasLinkedIn: 15,
    hasBio: 15,
    hasSkills: 15,
    hasInterests: 10,
    hasOccupation: 10,
    hasLocation: 5,
    hasLearningGoals: 10,
  };

  let score = 0;
  for (const [key, hasValue] of Object.entries(details)) {
    if (hasValue) {
      score += weights[key as keyof typeof weights];
    }
  }

  return { score, details };
}

/**
 * Generate AI context for user using Gemini
 */
export async function generateUserContext(
  userId: string
): Promise<GeneratedContext | null> {
  const userData = await fetchUserContextData(userId);
  if (!userData) return null;

  // If no Gemini API key, generate a simple context
  if (!apiKey) {
    console.warn("No Gemini API key, generating basic context");
    const basicContext = generateBasicContext(userData);
    await saveContext(userId, basicContext);
    return basicContext;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Create a comprehensive AI context summary for this user that can be used to provide personalized learning recommendations, career advice, and course suggestions. Be concise but thorough.

User Profile:
- Name: ${userData.name}
- Occupation: ${userData.occupation || "Not specified"}
- Location: ${userData.location || "Not specified"}
- Bio: ${userData.bio || "Not provided"}
- Skills: ${userData.skills.join(", ") || "None listed"}
- Interests: ${userData.interests.join(", ") || "None listed"}
- Learning Goals: ${userData.learningGoals.join(", ") || "None listed"}

${userData.resumeParsedText ? `Resume Summary (key points only):
${userData.resumeParsedText.substring(0, 2000)}` : "No resume uploaded"}

${userData.linkedinSummary ? `LinkedIn Profile Summary:
${userData.linkedinSummary.substring(0, 1500)}` : "No LinkedIn profile linked"}

Generate a unified context that:
1. Summarizes the user's background and expertise
2. Identifies their career trajectory and goals
3. Notes their technical strengths
4. Suggests areas for growth
5. Provides context for personalized recommendations

Keep the response under 1500 words.`;

    const result = await model.generateContent(prompt);
    const contextText = result.response.text();

    const generatedContext: GeneratedContext = {
      fullContext: contextText,
      generatedAt: new Date().toISOString(),
    };

    // Save to database
    await saveContext(userId, generatedContext);

    // Also update profile completeness
    const completeness = calculateProfileCompleteness(userData);
    await db
      .update(userTable)
      .set({
        profileCompleteness: JSON.stringify(completeness),
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId));

    return generatedContext;
  } catch (error) {
    console.error("Error generating AI context:", error);
    // Fall back to basic context
    const basicContext = generateBasicContext(userData);
    await saveContext(userId, basicContext);
    return basicContext;
  }
}

/**
 * Generate basic context without AI
 */
function generateBasicContext(userData: UserContextData): GeneratedContext {
  const parts: string[] = [];

  parts.push(`## User Profile: ${userData.name}`);
  
  if (userData.occupation) {
    parts.push(`**Role:** ${userData.occupation}`);
  }
  if (userData.location) {
    parts.push(`**Location:** ${userData.location}`);
  }
  if (userData.bio) {
    parts.push(`\n**About:** ${userData.bio}`);
  }
  if (userData.skills.length > 0) {
    parts.push(`\n**Skills:** ${userData.skills.join(", ")}`);
  }
  if (userData.interests.length > 0) {
    parts.push(`\n**Interests:** ${userData.interests.join(", ")}`);
  }
  if (userData.learningGoals.length > 0) {
    parts.push(`\n**Learning Goals:** ${userData.learningGoals.join(", ")}`);
  }
  if (userData.resumeParsedText) {
    parts.push(`\n**Resume:** Available (${userData.resumeParsedText.length} characters)`);
  }
  if (userData.linkedinSummary) {
    parts.push(`\n**LinkedIn:** ${userData.linkedinSummary.substring(0, 300)}...`);
  }

  return {
    fullContext: parts.join("\n"),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Save generated context to database
 */
async function saveContext(
  userId: string,
  context: GeneratedContext
): Promise<void> {
  await db
    .update(userTable)
    .set({
      aiContext: context.fullContext,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, userId));
}
