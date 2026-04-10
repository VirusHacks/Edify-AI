/**
 * Market-Aware Personalized Roadmap Generation Service
 * Combines user profile analysis with real-time market intelligence
 * to create highly customized career pathways
 */

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/configs/db";
import { pathways } from "@/db/schema/chapter";
import { user as userTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMarketInsights, analyzeCareerGap, isPerplexityAvailable, MarketInsights } from "@/lib/perplexity-ai";
import { generatePathway } from "@/configs/ai-models";

// =============================================================================
// SCHEMAS
// =============================================================================

export const PersonalizedRoadmapInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  targetCareer: z.string().optional(), // If not provided, will be inferred from profile
  customGoals: z.array(z.string()).optional(),
  timeframe: z.enum(["3months", "6months", "1year", "2years"]).optional().default("1year"),
  focusAreas: z.array(z.string()).optional(),
  skillGaps: z.array(z.string()).optional(), // For ATS integration
  targetRole: z.string().optional(), // For ATS integration
  targetCompany: z.string().optional(), // For ATS integration
});

export type PersonalizedRoadmapInput = z.infer<typeof PersonalizedRoadmapInputSchema>;

export const MarketAwareStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedTime: z.string(),
  marketRelevance: z.string(), // Why this is important in current market
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().nullable().optional(),
    type: z.enum(["course", "certification", "project", "article", "tool"]).optional(),
  })),
  milestones: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

export const PersonalizedRoadmapSchema = z.object({
  id: z.number().optional(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  targetCareer: z.string(),
  estimatedTime: z.string(),
  difficulty: z.string(),
  prerequisites: z.array(z.string()),
  steps: z.array(MarketAwareStepSchema),
  marketInsights: z.object({
    demandTrends: z.array(z.string()),
    salaryRange: z.string(),
    topCompanies: z.array(z.string()),
    futureOutlook: z.string(),
    certifications: z.array(z.string()),
  }).optional(),
  personalizedFor: z.object({
    currentSkills: z.array(z.string()),
    skillGaps: z.array(z.string()),
    quickWins: z.array(z.string()),
  }).optional(),
  isMarketAware: z.literal(true).default(true),
  generatedAt: z.string(),
  citations: z.array(z.string()).optional(),
});

export type PersonalizedRoadmap = z.infer<typeof PersonalizedRoadmapSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Fetch user profile data for personalization
 */
async function getUserProfile(userId: string) {
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
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!userData) return null;

  return {
    name: userData.name,
    bio: userData.bio,
    skills: parseJsonArray(userData.skills),
    interests: parseJsonArray(userData.interests),
    occupation: userData.occupation,
    location: userData.location,
    learningGoals: parseJsonArray(userData.learningGoals),
    resumeParsedText: userData.resumeParsedText,
  };
}

/**
 * Infer target career from user profile if not specified
 */
function inferTargetCareer(profile: {
  interests: string[];
  learningGoals: string[];
  occupation: string | null;
  bio: string | null;
}): string {
  // Check learning goals first
  if (profile.learningGoals.length > 0) {
    const goal = profile.learningGoals[0];
    // Try to extract a career from the goal
    const careerPatterns = [
      /become\s+(?:a|an)\s+(.+)/i,
      /work\s+as\s+(?:a|an)\s+(.+)/i,
      /(.+)\s+career/i,
      /(.+)\s+role/i,
    ];
    for (const pattern of careerPatterns) {
      const match = goal.match(pattern);
      if (match) return match[1].trim();
    }
    return goal;
  }

  // Check interests
  if (profile.interests.length > 0) {
    const techInterests = profile.interests.filter(i => 
      /developer|engineer|data|ai|ml|web|mobile|cloud|devops|security/i.test(i)
    );
    if (techInterests.length > 0) {
      return `${techInterests[0]} Professional`;
    }
    return profile.interests[0];
  }

  // Fall back to current occupation or generic
  if (profile.occupation) {
    return `Senior ${profile.occupation}`;
  }

  return "Software Developer"; // Default fallback
}

// =============================================================================
// MAIN SERVICE FUNCTION
// =============================================================================

/**
 * Generate a personalized, market-aware career roadmap
 */
export async function generatePersonalizedRoadmap(
  input: PersonalizedRoadmapInput
): Promise<PersonalizedRoadmap> {
  const { userId, targetCareer: inputTargetCareer, customGoals, timeframe, focusAreas } = 
    PersonalizedRoadmapInputSchema.parse(input);

  // Step 1: Fetch user profile
  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new Error("User profile not found");
  }

  // Step 2: Determine target career
  const targetCareer = inputTargetCareer || inferTargetCareer(profile);

  // Step 3: Get market insights using Perplexity (if available)
  let marketInsights: MarketInsights | null = null;
  let gapAnalysis: {
    skillGaps: string[];
    learningPriorities: { skill: string; priority: "high" | "medium" | "low"; reason: string }[];
    estimatedTimeline: string;
    quickWins: string[];
    longTermGoals: string[];
  } | null = null;

  if (isPerplexityAvailable()) {
    try {
      // Fetch market insights and gap analysis in parallel
      [marketInsights, gapAnalysis] = await Promise.all([
        getMarketInsights(targetCareer, {
          currentSkills: profile.skills,
          experience: profile.occupation || undefined,
          location: profile.location || undefined,
          interests: profile.interests,
        }),
        analyzeCareerGap(targetCareer, {
          currentSkills: profile.skills,
          experience: profile.occupation || "Entry level",
          currentRole: profile.occupation || undefined,
        }),
      ]);
    } catch (error) {
      console.warn("Failed to fetch market insights from Perplexity, falling back to AI generation:", error);
    }
  }

  // Step 4: Generate the personalized roadmap using Gemini with market context
  const timeframeMap: Record<string, string> = {
    "3months": "3 months",
    "6months": "6 months",
    "1year": "1 year",
    "2years": "2 years",
  };

  const marketContext = marketInsights ? `
## REAL-TIME MARKET INTELLIGENCE (Use this to make the roadmap market-relevant):

### Current Market Demand Trends:
${marketInsights.demandTrends.map(t => `- ${t}`).join("\n")}

### Emerging Technologies to Include:
${marketInsights.emergingTechnologies.map(t => `- ${t}`).join("\n")}

### Required Skills (from real job postings):
Technical: ${marketInsights.requiredSkills.technical.join(", ")}
Soft Skills: ${marketInsights.requiredSkills.soft.join(", ")}

### Top Hiring Companies:
${marketInsights.topCompanies.join(", ")}

### Valuable Certifications:
${marketInsights.certificationRecommendations.join(", ")}

### Competitive Advantages:
${marketInsights.competitiveAdvantages.map(a => `- ${a}`).join("\n")}

### Future Outlook (2030):
${marketInsights.futureOutlook2030}

### Job Growth Rate:
${marketInsights.jobGrowthRate}
` : "";

  const gapContext = gapAnalysis ? `
## USER'S SKILL GAP ANALYSIS:

### Skills to Develop (Prioritized):
${gapAnalysis.learningPriorities.map(p => `- ${p.skill} (${p.priority} priority): ${p.reason}`).join("\n")}

### Quick Wins (Include early in roadmap):
${gapAnalysis.quickWins.map(w => `- ${w}`).join("\n")}

### Long-term Goals:
${gapAnalysis.longTermGoals.map(g => `- ${g}`).join("\n")}

### Estimated Timeline to Job-Ready:
${gapAnalysis.estimatedTimeline}
` : "";

  const prompt = `Generate a HIGHLY PERSONALIZED learning pathway for someone to become a "${targetCareer}".

## USER PROFILE (Customize the roadmap for this person):
- Name: ${profile.name}
- Current Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "None specified"}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "Not specified"}
- Current Occupation: ${profile.occupation || "Not specified"}
- Location: ${profile.location || "Not specified"}
- Learning Goals: ${profile.learningGoals.length > 0 ? profile.learningGoals.join(", ") : "Not specified"}
${customGoals?.length ? `- Custom Goals: ${customGoals.join(", ")}` : ""}
${focusAreas?.length ? `- Focus Areas (from discovery): ${focusAreas.join(", ")}` : ""}
${input.skillGaps?.length ? `- Skill Gaps to Address: ${input.skillGaps.join(", ")}` : ""}
${input.targetRole ? `- Target Role: ${input.targetRole}` : ""}
${input.targetCompany ? `- Target Company: ${input.targetCompany}` : ""}

## TIMEFRAME: ${timeframeMap[timeframe]}

${marketContext}

${gapContext}

## IMPORTANT INSTRUCTIONS:
1. Create a roadmap that builds on the user's EXISTING skills (don't teach what they already know)
2. Prioritize skills based on current market demand and the gap analysis
3. Include real, actionable resources (real course names, real certification names)
4. Each step should explain WHY it's market-relevant
5. Include milestones that could go on a resume or LinkedIn
6. Make it achievable within the specified timeframe
7. Focus on skills that will be valuable for 2025-2030 job market
8. Include both technical skills AND soft skills development

Generate the roadmap in this EXACT JSON format:
{
  "title": "Personalized path title (include user's name or make it personal)",
  "description": "Compelling description explaining why this path is perfect for them based on their profile and market needs",
  "estimatedTime": "${timeframeMap[timeframe]}",
  "difficulty": "Personalized based on their current skills (Beginner/Intermediate/Advanced)",
  "prerequisites": ["List what they already have that qualifies them"],
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed description of what they'll learn",
      "estimatedTime": "Time for this step",
      "marketRelevance": "Why this skill is in-demand right now and future-proof",
      "resources": [
        {"title": "Resource name", "url": "https://...", "type": "course|certification|project|article|tool"}
      ],
      "milestones": ["Concrete achievements to add to resume/portfolio"],
      "skills": ["Skills gained from this step"]
    }
  ]
}

Make 6-10 steps depending on the timeframe. Be specific, practical, and market-aware.`;

  try {
    const result = await generatePathway.sendMessage(prompt);
    const responseText = result.response.text();
    
    // Parse the generated roadmap
    let roadmapData;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      roadmapData = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse roadmap response:", responseText);
      throw new Error("Failed to parse AI-generated roadmap");
    }

    // Step 5: Save to database
    const slug = uuidv4();
    const roadmap: PersonalizedRoadmap = {
      slug,
      title: roadmapData.title,
      description: roadmapData.description,
      targetCareer,
      estimatedTime: roadmapData.estimatedTime,
      difficulty: roadmapData.difficulty,
      prerequisites: roadmapData.prerequisites || [],
      steps: roadmapData.steps.map((step: any) => ({
        title: step.title,
        description: step.description,
        estimatedTime: step.estimatedTime,
        marketRelevance: step.marketRelevance || "High market demand",
        resources: step.resources || [],
        milestones: step.milestones || [],
        skills: step.skills || [],
      })),
      marketInsights: marketInsights ? {
        demandTrends: marketInsights.demandTrends,
        salaryRange: `${marketInsights.salaryInsights.entry} - ${marketInsights.salaryInsights.senior}`,
        topCompanies: marketInsights.topCompanies,
        futureOutlook: marketInsights.futureOutlook2030,
        certifications: marketInsights.certificationRecommendations,
      } : undefined,
      personalizedFor: {
        currentSkills: profile.skills,
        skillGaps: gapAnalysis?.skillGaps || [],
        quickWins: gapAnalysis?.quickWins || [],
      },
      isMarketAware: true,
      generatedAt: new Date().toISOString(),
      citations: marketInsights?.citations || [],
    };

    // Save to database (upsert - update if exists, insert if not)
    try {
      // Check if user already has a personalized roadmap
      const [existingRoadmap] = await db
        .select({ id: pathways.id, slug: pathways.slug })
        .from(pathways)
        .where(and(
          eq(pathways.userId, userId),
          eq(pathways.isPersonalized, true)
        ));

      if (existingRoadmap) {
        // Update existing personalized roadmap
        await db.update(pathways)
          .set({
            title: roadmap.title,
            description: roadmap.description,
            estimatedTime: roadmap.estimatedTime,
            difficulty: roadmap.difficulty,
            prerequisites: roadmap.prerequisites,
            steps: roadmap.steps as any,
            targetCareer,
            marketInsights: roadmap.marketInsights || null,
            personalizedFor: roadmap.personalizedFor || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(pathways.id, existingRoadmap.id));
        
        roadmap.id = existingRoadmap.id;
        roadmap.slug = existingRoadmap.slug; // Keep the same slug
        console.log(`Updated existing personalized roadmap for user ${userId}`);
      } else {
        // Insert new personalized roadmap
        const [inserted] = await db.insert(pathways).values({
          slug,
          title: roadmap.title,
          description: roadmap.description,
          estimatedTime: roadmap.estimatedTime,
          difficulty: roadmap.difficulty,
          prerequisites: roadmap.prerequisites,
          steps: roadmap.steps as any,
          userId, // Associate with user
          isPersonalized: true, // Mark as personalized
          targetCareer,
          marketInsights: roadmap.marketInsights || null,
          personalizedFor: roadmap.personalizedFor || null,
        }).returning();
        
        roadmap.id = inserted.id;
        console.log(`Created new personalized roadmap for user ${userId}`);
      }
    } catch (dbError) {
      console.error("Failed to save roadmap to database:", dbError);
      // Continue without DB save - user still gets the roadmap
    }

    return roadmap;
  } catch (error) {
    console.error("Error generating personalized roadmap:", error);
    throw new Error("Failed to generate personalized roadmap");
  }
}

/**
 * Get user's existing personalized roadmap (if any)
 */
export async function getUserPersonalizedRoadmap(userId: string): Promise<PersonalizedRoadmap | null> {
  try {
    const [existing] = await db
      .select()
      .from(pathways)
      .where(and(
        eq(pathways.userId, userId),
        eq(pathways.isPersonalized, true)
      ));

    if (!existing) return null;

    return {
      id: existing.id,
      slug: existing.slug,
      title: existing.title,
      description: existing.description,
      targetCareer: existing.targetCareer || "Career Development",
      estimatedTime: existing.estimatedTime,
      difficulty: existing.difficulty,
      prerequisites: existing.prerequisites as string[],
      steps: existing.steps as any,
      marketInsights: existing.marketInsights as any,
      personalizedFor: existing.personalizedFor as any,
      isMarketAware: true,
      generatedAt: existing.updatedAt || existing.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching user's personalized roadmap:", error);
    return null;
  }
}

/**
 * Get market insights for a career (standalone function for preview)
 */
export async function getCareerMarketInsights(career: string, userId?: string) {
  let userContext;
  
  if (userId) {
    const profile = await getUserProfile(userId);
    if (profile) {
      userContext = {
        currentSkills: profile.skills,
        experience: profile.occupation || undefined,
        location: profile.location || undefined,
        interests: profile.interests,
      };
    }
  }

  if (!isPerplexityAvailable()) {
    throw new Error("Market insights require Perplexity API. Please configure PERPLEXITY_API_KEY.");
  }

  return getMarketInsights(career, userContext);
}
