/**
 * @file perplexity-ai.ts
 * @description Market Intelligence client utilizing Perplexity's Sonar models.
 * Provides real-time career insights, salary data, and skill gap analysis
 * by grounding LLM responses in active web search citations.
 */

/**
 * Standard message format for Perplexity API interactions.
 */
export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Response schema conforming to Perplexity's JSON-RPC/REST output.
 */
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

/**
 * Deep domain intelligence schema for career mapping.
 */
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

/**
 * Resolves the Perplexity API key from multi-variant environment variables.
 */
const getApiKey = (): string => {
  return process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || "";
};

/**
 * Connectivity check to verify AI search availability.
 */
export const isPerplexityAvailable = (): boolean => {
  return !!getApiKey();
};

/**
 * Orchestrates a request to the Perplexity Sonar inference engine.
 * @param messages Thread of conversation history.
 * @param options Model tuning parameters.
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
    throw new Error("Perplexity API key is not configured. Check PERPLEXITY_API_KEY.");
  }

  const model = options?.model || "sonar-pro";
  
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
    throw new Error(`Perplexity API failure: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Performs deep-search research on a specific career trajectory.
 * Grounded in real-time job market data and industry shifts.
 * @param career Target job title or domain.
 * @param userContext Personal metadata to ground the search impact.
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
User Context:
- Skills: ${userContext.currentSkills?.join(", ") || "None"}
- Location: ${userContext.location || "Global"}
` : "";

  const systemPrompt = `You are a Career Architect and Market Analyst. 
Analyze the 2025-2030 professional landscape for "${career}". 
Ground your response in verified job market data and technological shifts.`;

  const userPrompt = `${contextInfo}
Provide market intelligence in STRICT JSON format:
{
  "demandTrends": ["string[]"],
  "emergingTechnologies": ["string[]"],
  "salaryInsights": { "entry": "string", "mid": "string", "senior": "string" },
  "topCompanies": ["string[]"],
  "requiredSkills": { "technical": ["string[]"], "soft": ["string[]"] },
  "futureOutlook2030": "string paragraph",
  "certificationRecommendations": ["string[]"],
  "competitiveAdvantages": ["string[]"],
  "industryShifts": ["string[]"],
  "jobGrowthRate": "string"
}`;

  try {
    const response = await queryPerplexity(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.1 }
    );

    const content = response.choices[0]?.message?.content;
    
    // Robust parsing for valid JSON recovery
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const insights: MarketInsights = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    
    insights.citations = response.citations || [];
    return insights;
  } catch (error) {
    console.error("[Perplexity] Inference failed:", error);
    throw error;
  }
}

/**
 * Conducts a gap analysis between a user's current professional profile 
 * and a target career's market requirements.
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
  const systemPrompt = `You are a Career Advisor. Map the skill deltas for becoming a "${targetCareer}".`;

  const userPrompt = `
Current Inventory: ${userProfile.currentSkills.join(", ")}
Target Role: ${targetCareer}

Generate a gap analysis in JSON:
{
  "skillGaps": ["string[]"],
  "learningPriorities": [{"skill": "string", "priority": "high|medium|low", "reason": "string"}],
  "estimatedTimeline": "string",
  "quickWins": ["string[]"],
  "longTermGoals": ["string[]"]
}`;

  const response = await queryPerplexity(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.2 }
  );

  const content = response.choices[0]?.message?.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
}
