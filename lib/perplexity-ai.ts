/**
 * Perplexity AI API Client
 * Uses Perplexity's Sonar models for real-time web search and market intelligence
 */

export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MarketInsights {
  demandTrends: string[];
  emergingTechnologies: string[];
  salaryInsights: {
    entry: string;
    mid: string;
    senior: string;
  };
  topCompanies: string[];
  requiredSkills: {
    technical: string[];
    soft: string[];
  };
  futureOutlook2030: string;
  certificationRecommendations: string[];
  competitiveAdvantages: string[];
  industryShifts: string[];
  jobGrowthRate: string;
  citations: string[];
}

// Get API key from environment
const getApiKey = (): string => {
  const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || "";
  return apiKey;
};

export const isPerplexityAvailable = (): boolean => {
  return !!getApiKey();
};

/**
 * Make a request to Perplexity API
 */
export async function queryPerplexity(
  messages: PerplexityMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    returnCitations?: boolean;
  }
): Promise<PerplexityResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Perplexity API key is not configured. Please set PERPLEXITY_API_KEY in your environment.");
  }

  const model = options?.model || "sonar-pro"; // Using sonar-pro for best quality
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 4096,
      return_citations: options?.returnCitations ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get real-time market insights for a career/field
 */
export async function getMarketInsights(
  career: string,
  userContext?: {
    currentSkills?: string[];
    experience?: string;
    location?: string;
    interests?: string[];
  }
): Promise<MarketInsights> {
  const contextInfo = userContext ? `
User's current profile:
- Current skills: ${userContext.currentSkills?.join(", ") || "Not specified"}
- Experience level: ${userContext.experience || "Not specified"}
- Location: ${userContext.location || "Global"}
- Interests: ${userContext.interests?.join(", ") || "Not specified"}
` : "";

  const systemPrompt = `You are a career market analyst specializing in technology and professional development. 
Your task is to provide accurate, up-to-date market intelligence for career planning.
Always base your analysis on current market data, job postings, industry reports, and hiring trends.
Focus on practical, actionable insights that help someone prepare for success in 2025-2030.`;

  const userPrompt = `Analyze the current job market and future outlook (2025-2030) for: "${career}"

${contextInfo}

Provide comprehensive market intelligence in the following JSON format:
{
  "demandTrends": ["List of 4-5 current demand trends for this career"],
  "emergingTechnologies": ["List of 5-7 emerging technologies/tools to learn"],
  "salaryInsights": {
    "entry": "Entry-level salary range with location context",
    "mid": "Mid-level salary range (3-5 years exp)",
    "senior": "Senior-level salary range (7+ years exp)"
  },
  "topCompanies": ["List of 8-10 top hiring companies for this role"],
  "requiredSkills": {
    "technical": ["List of 8-10 must-have technical skills"],
    "soft": ["List of 5-6 important soft skills"]
  },
  "futureOutlook2030": "Detailed paragraph about job market outlook for 2030, including AI impact, automation risks, and growth opportunities",
  "certificationRecommendations": ["List of 4-6 valuable certifications"],
  "competitiveAdvantages": ["List of 4-5 skills/experiences that give candidates an edge"],
  "industryShifts": ["List of 3-4 major industry shifts affecting this career"],
  "jobGrowthRate": "Expected job growth rate percentage and context"
}

Be specific, cite real companies, technologies, and market data. Focus on actionable insights.`;

  try {
    const response = await queryPerplexity(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { 
        temperature: 0.2,
        returnCitations: true,
      }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Perplexity");
    }

    // Parse the JSON response
    let insights: MarketInsights;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", content);
      // Return a fallback structure if parsing fails
      insights = {
        demandTrends: ["High demand for AI/ML integration", "Remote work opportunities growing", "Cross-functional roles increasing"],
        emergingTechnologies: ["AI/ML tools", "Cloud platforms", "Automation frameworks"],
        salaryInsights: {
          entry: "Contact local job boards for accurate data",
          mid: "Contact local job boards for accurate data",
          senior: "Contact local job boards for accurate data",
        },
        topCompanies: ["Major tech companies", "Growing startups", "Enterprise organizations"],
        requiredSkills: {
          technical: ["Programming fundamentals", "Domain expertise", "Tool proficiency"],
          soft: ["Communication", "Problem-solving", "Adaptability"],
        },
        futureOutlook2030: "The field is evolving rapidly with AI integration. Professionals who adapt to new technologies while maintaining core expertise will thrive.",
        certificationRecommendations: ["Industry-standard certifications", "Platform-specific credentials"],
        competitiveAdvantages: ["AI/ML knowledge", "Cross-functional experience", "Continuous learning mindset"],
        industryShifts: ["AI automation", "Remote-first culture", "Skills-based hiring"],
        jobGrowthRate: "Growing - check Bureau of Labor Statistics for precise data",
        citations: [],
      };
    }

    // Add citations if available
    insights.citations = response.citations || [];

    return insights;
  } catch (error) {
    console.error("Error getting market insights:", error);
    throw error;
  }
}

/**
 * Generate a personalized career gap analysis
 */
export async function analyzeCareerGap(
  targetCareer: string,
  userProfile: {
    currentSkills: string[];
    experience: string;
    education?: string;
    currentRole?: string;
  }
): Promise<{
  skillGaps: string[];
  learningPriorities: { skill: string; priority: "high" | "medium" | "low"; reason: string }[];
  estimatedTimeline: string;
  quickWins: string[];
  longTermGoals: string[];
}> {
  const systemPrompt = `You are a career advisor specializing in skill gap analysis and professional development planning.
Provide practical, achievable recommendations based on current market requirements.`;

  const userPrompt = `Analyze the skill gap for someone wanting to become a "${targetCareer}".

Current Profile:
- Current skills: ${userProfile.currentSkills.join(", ") || "None specified"}
- Experience: ${userProfile.experience || "Not specified"}
- Education: ${userProfile.education || "Not specified"}
- Current role: ${userProfile.currentRole || "Not specified"}

Provide a detailed gap analysis in JSON format:
{
  "skillGaps": ["List of 6-8 key skills the person needs to develop"],
  "learningPriorities": [
    {"skill": "Skill name", "priority": "high|medium|low", "reason": "Why this priority"}
  ],
  "estimatedTimeline": "Realistic timeline to become job-ready (e.g., '6-9 months with dedicated study')",
  "quickWins": ["List of 4-5 things they can do immediately to boost their profile"],
  "longTermGoals": ["List of 3-4 strategic long-term objectives"]
}`;

  const response = await queryPerplexity(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.3 }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Perplexity");
  }

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    return JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse career gap analysis response");
  }
}
