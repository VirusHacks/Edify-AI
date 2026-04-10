// AI-powered search query generator using Gemini for personalized scraping

import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseEnvironment } from "@/configs/BaseEnvironment";

const env = new BaseEnvironment();

interface UserProfile {
  bio?: string | null;
  interests?: string | null; // JSON string array
  skills?: string | null; // JSON string array
  courses?: string | null; // JSON string array
  preferredLanguages?: string | null; // JSON string array
  learningGoals?: string | null; // JSON string array
  occupation?: string | null;
  location?: string | null;
}

interface SearchQueryResult {
  keywords: string[];
  priority: "high" | "medium" | "low";
  reasoning: string;
}

// Parse JSON strings to arrays
function parseJSONArray(jsonString: string | null | undefined): string[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Check if user has profile data
export function hasProfileData(profile: UserProfile): boolean {
  return !!(
    profile.interests ||
    profile.skills ||
    profile.courses ||
    profile.learningGoals ||
    profile.occupation ||
    profile.bio
  );
}

// Generate AI-powered search query based on user profile
export async function generateSearchQuery(
  profile: UserProfile,
  contentType: "internship" | "hackathon" | "meetup"
): Promise<SearchQueryResult> {
  try {
    const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMENI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare profile data
    const interests = parseJSONArray(profile.interests);
    const skills = parseJSONArray(profile.skills);
    const courses = parseJSONArray(profile.courses);
    const learningGoals = parseJSONArray(profile.learningGoals);

    const profileData = {
      interests,
      skills,
      courses,
      learningGoals,
      occupation: profile.occupation || null,
      location: profile.location || null,
      bio: profile.bio || null,
    };

    const prompt = `You are an intelligent search query generator. Based on the user's profile, generate optimized search keywords for finding ${contentType}s that match their interests and goals.

User Profile:
${JSON.stringify(profileData, null, 2)}

Content Type: ${contentType}

Your task:
1. Analyze the user's interests, skills, courses, learning goals, occupation, and location
2. Generate 5-10 highly relevant keywords that would help find ${contentType}s matching their profile
3. Prioritize keywords based on relevance to their goals
4. Consider:
   - Technical skills and technologies
   - Industry domains
   - Learning objectives
   - Career goals
   - Geographic preferences

Return ONLY a JSON object in this exact format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "priority": "high" | "medium" | "low",
  "reasoning": "Brief explanation of why these keywords were chosen"
}

Guidelines:
- Use specific technical terms from their skills
- Include domain/industry keywords from their interests
- Combine related concepts intelligently
- Keep keywords concise and search-friendly
- Prioritize keywords that directly relate to their learning goals or career path
- If location is specified, consider local/remote preferences

Example response:
{
  "keywords": ["React", "Frontend Development", "UI/UX Design", "JavaScript", "Web Development", "Remote"],
  "priority": "high",
  "reasoning": "User has React and JavaScript skills, interested in web development. Focus on frontend opportunities."
}`;

    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    };

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const parsed = JSON.parse(text);

    return {
      keywords: parsed.keywords || [],
      priority: parsed.priority || "medium",
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("Error generating AI search query:", error);
    
    // Fallback: Generate basic keywords from profile
    return generateFallbackKeywords(profile, contentType);
  }
}

// Fallback keyword generator if AI fails
function generateFallbackKeywords(
  profile: UserProfile,
  contentType: "internship" | "hackathon" | "meetup"
): SearchQueryResult {
  const interests = parseJSONArray(profile.interests);
  const skills = parseJSONArray(profile.skills);
  const courses = parseJSONArray(profile.courses);
  const learningGoals = parseJSONArray(profile.learningGoals);

  // Combine all keywords
  const allKeywords = [
    ...skills,
    ...interests,
    ...courses,
    ...learningGoals,
    profile.occupation,
  ].filter(Boolean) as string[];

  return {
    keywords: allKeywords.slice(0, 10),
    priority: "medium",
    reasoning: "Generated from user profile using fallback method",
  };
}

// Generate a combined search query string
export async function generateSearchQueryString(
  profile: UserProfile,
  contentType: "internship" | "hackathon" | "meetup"
): Promise<string> {
  if (!hasProfileData(profile)) {
    return ""; // Return empty for no filtering
  }

  const queryResult = await generateSearchQuery(profile, contentType);
  
  // Create a search query string from keywords
  // For scraping, we might want to use these keywords to filter results
  return queryResult.keywords.join(" ");
}

