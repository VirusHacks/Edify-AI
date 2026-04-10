import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { extractResumeData, generateProfileSuggestions } from "@/lib/resume-extractor";
import { generateUserContext, calculateProfileCompleteness, fetchUserContextData } from "@/lib/user-context-generator";

/**
 * POST - Generate/regenerate AI context for user (synchronous - returns full context)
 */
export async function POST(request: NextRequest) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const kindeUser = await getUser();
    if (!kindeUser?.id) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    console.log(`[AI Context] Generating context for user ${kindeUser.id}`);

    // Generate the AI context (this also saves to DB)
    const generatedContext = await generateUserContext(kindeUser.id);

    if (!generatedContext) {
      return NextResponse.json(
        { success: false, error: "Failed to generate AI context" },
        { status: 500 }
      );
    }

    // Fetch the latest data including the generated context and completeness
    const contextData = await fetchUserContextData(kindeUser.id);
    const completeness = contextData ? calculateProfileCompleteness(contextData) : null;

    return NextResponse.json({
      success: true,
      message: "AI context generated successfully",
      context: {
        fullContext: generatedContext.fullContext,
        preview: generatedContext.fullContext.substring(0, 500) + "...",
        length: generatedContext.fullContext.length,
        generatedAt: generatedContext.generatedAt,
      },
      profileCompleteness: completeness ? {
        score: completeness.score,
        details: completeness.details,
      } : null,
    });

  } catch (error) {
    console.error("AI context generation error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate AI context" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get AI context and profile suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const kindeUser = await getUser();
    if (!kindeUser?.id) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Fetch user data
    const [userData] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, kindeUser.id));

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User data not found" },
        { status: 404 }
      );
    }

    // Parse JSON arrays
    const parseJsonArray = (str: string | null): string[] => {
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const parseJsonObject = (str: string | null): Record<string, any> => {
      if (!str) return {};
      try {
        return JSON.parse(str);
      } catch {
        return {};
      }
    };

    const currentProfile = {
      skills: parseJsonArray(userData.skills),
      interests: parseJsonArray(userData.interests),
      learningGoals: parseJsonArray(userData.learningGoals),
      occupation: userData.occupation,
      location: userData.location,
      website: userData.website,
      githubUsername: userData.githubUsername,
      bio: userData.bio,
    };

    // Get suggestions from resume if available
    let suggestions = null;
    if (userData.resumeParsedText) {
      const extractedData = await extractResumeData(userData.resumeParsedText);
      // Pass only the fields expected by generateProfileSuggestions
      suggestions = generateProfileSuggestions(extractedData, {
        skills: currentProfile.skills,
        interests: currentProfile.interests,
        occupation: currentProfile.occupation,
        location: currentProfile.location,
        bio: currentProfile.bio,
      });
    }

    // Calculate completeness
    const contextData = await fetchUserContextData(kindeUser.id);
    const completeness = contextData ? calculateProfileCompleteness(contextData) : null;

    return NextResponse.json({
      success: true,
      aiContext: {
        hasContext: !!userData.aiContext,
        preview: userData.aiContext?.substring(0, 500),
        length: userData.aiContext?.length || 0,
      },
      profileCompleteness: completeness ? {
        score: completeness.score,
        details: completeness.details,
        ...parseJsonObject(userData.profileCompleteness),
      } : null,
      suggestions: suggestions && suggestions.length > 0 ? suggestions : null,
      currentProfile: {
        skillsCount: currentProfile.skills.length,
        interestsCount: currentProfile.interests.length,
        hasResume: !!userData.resumeParsedText,
        hasLinkedIn: !!userData.linkedinSummary,
      },
    });

  } catch (error) {
    console.error("AI context fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch AI context" },
      { status: 500 }
    );
  }
}
