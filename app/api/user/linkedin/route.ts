import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { inngest } from "@/inngest/client";

// LinkedIn Profile Summary API (Relevance AI)
const LINKEDIN_API_URL = "https://api-f1db6c.stack.tryrelevance.com/latest/studios/49a4564d-06a4-47fa-b8c4-31c19b5f5f61/trigger_webhook?project=b0807056-61f8-4ce0-a7f9-7367fd27a405";

interface LinkedInApiResponse {
  // Direct fields (Relevance AI returns answer at top level)
  answer?: string;
  // Alternative nested format
  output?: {
    answer?: string;
    summary?: string;
    profile_summary?: string;
  };
  status?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Parse request body
    const body = await request.json();
    const { linkedin_url } = body;

    console.log("[LinkedIn API] Received request for URL:", linkedin_url);

    if (!linkedin_url) {
      return NextResponse.json(
        { success: false, error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format (more flexible)
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?.*$/i;
    if (!linkedinRegex.test(linkedin_url)) {
      return NextResponse.json(
        { success: false, error: "Invalid LinkedIn URL format. Please use format: https://linkedin.com/in/username" },
        { status: 400 }
      );
    }

    // Call LinkedIn Profile Summary API
    console.log("[LinkedIn API] Calling Relevance AI API...");
    
    let apiResponse;
    try {
      apiResponse = await fetch(LINKEDIN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkedin_url }),
      });
    } catch (fetchError) {
      console.error("[LinkedIn API] Fetch error:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to connect to LinkedIn profile service" },
        { status: 502 }
      );
    }

    console.log("[LinkedIn API] API response status:", apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("[LinkedIn API] API error response:", errorText);
      return NextResponse.json(
        { success: false, error: `LinkedIn service error: ${apiResponse.status}` },
        { status: 502 }
      );
    }

    let apiData: LinkedInApiResponse;
    try {
      apiData = await apiResponse.json();
      console.log("[LinkedIn API] API response data:", JSON.stringify(apiData).substring(0, 500));
    } catch (parseError) {
      console.error("[LinkedIn API] JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid response from LinkedIn service" },
        { status: 502 }
      );
    }

    // Extract summary from response (handle different response formats)
    // Relevance AI returns { answer: "..." } at the top level
    let summary = apiData.answer ||  // Top-level answer (primary format)
                  apiData.output?.answer || 
                  apiData.output?.summary || 
                  apiData.output?.profile_summary ||
                  (typeof apiData.output === 'string' ? apiData.output : null);

    console.log("[LinkedIn API] Extracted summary from 'answer' field:", !!apiData.answer);

    if (!summary) {
      console.error("[LinkedIn API] Could not extract summary from response:", apiData);
      return NextResponse.json(
        { success: false, error: "Could not extract profile summary. The LinkedIn profile might be private or the service is unavailable." },
        { status: 422 }
      );
    }

    console.log("[LinkedIn API] Extracted summary length:", summary.length);

    // Get current user data to check if bio is empty
    const [currentUser] = await db
      .select({
        bio: userTable.bio,
        occupation: userTable.occupation,
      })
      .from(userTable)
      .where(eq(userTable.id, kindeUser.id));

    // Generate a concise bio from LinkedIn summary if user doesn't have one
    let generatedBio: string | null = null;
    if (!currentUser?.bio || currentUser.bio.length < 20) {
      // Extract first meaningful paragraph or create a short bio
      generatedBio = generateBioFromLinkedIn(summary);
    }

    // Extract occupation from LinkedIn summary if not set
    let extractedOccupation: string | null = null;
    if (!currentUser?.occupation) {
      extractedOccupation = extractOccupationFromLinkedIn(summary);
    }

    // Update user record with LinkedIn data
    try {
      const updateData: Record<string, any> = {
        linkedinProfileUrl: linkedin_url,
        linkedinSummary: summary,
        updatedAt: new Date(),
      };

      // Auto-populate bio if empty
      if (generatedBio) {
        updateData.bio = generatedBio;
      }

      // Auto-populate occupation if empty
      if (extractedOccupation) {
        updateData.occupation = extractedOccupation;
      }

      await db
        .update(userTable)
        .set(updateData)
        .where(eq(userTable.id, kindeUser.id));
      console.log("[LinkedIn API] Database updated successfully", { 
        bioUpdated: !!generatedBio, 
        occupationUpdated: !!extractedOccupation 
      });
    } catch (dbError) {
      console.error("[LinkedIn API] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save LinkedIn data to database" },
        { status: 500 }
      );
    }

    // Trigger AI context regeneration
    try {
      await inngest.send({
        name: "user/profile-updated",
        data: { 
          userId: kindeUser.id,
          trigger: "linkedin-import",
        },
      });
      console.log("[LinkedIn API] Inngest event sent");
    } catch (error) {
      console.error("[LinkedIn API] Failed to trigger context regeneration:", error);
      // Don't fail the request if Inngest fails
    }

    // Build auto-populated fields list for response
    const autoPopulatedFields: string[] = [];
    if (generatedBio) autoPopulatedFields.push("bio");
    if (extractedOccupation) autoPopulatedFields.push("occupation");

    return NextResponse.json({
      success: true,
      linkedinUrl: linkedin_url,
      summaryLength: summary.length,
      summaryPreview: summary.substring(0, 500) + (summary.length > 500 ? "..." : ""),
      message: "LinkedIn profile imported successfully",
      autoPopulated: {
        bio: generatedBio,
        occupation: extractedOccupation,
        fieldsUpdated: autoPopulatedFields,
      },
    });

  } catch (error) {
    console.error("[LinkedIn API] Unexpected error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to import LinkedIn profile" 
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve user's LinkedIn info
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

    const [userData] = await db
      .select({
        linkedinProfileUrl: userTable.linkedinProfileUrl,
        linkedinSummary: userTable.linkedinSummary,
      })
      .from(userTable)
      .where(eq(userTable.id, kindeUser.id));

    return NextResponse.json({
      success: true,
      hasLinkedIn: !!userData?.linkedinProfileUrl,
      linkedinUrl: userData?.linkedinProfileUrl,
      summaryPreview: userData?.linkedinSummary?.substring(0, 500),
    });

  } catch (error) {
    console.error("LinkedIn fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch LinkedIn info" },
      { status: 500 }
    );
  }
}

// DELETE - Remove user's LinkedIn data
export async function DELETE(request: NextRequest) {
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

    // Clear LinkedIn data from user record
    await db
      .update(userTable)
      .set({
        linkedinProfileUrl: null,
        linkedinSummary: null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, kindeUser.id));

    // Trigger context regeneration
    try {
      await inngest.send({
        name: "user/profile-updated",
        data: { 
          userId: kindeUser.id,
          trigger: "linkedin-delete",
        },
      });
    } catch (error) {
      console.error("Failed to trigger context regeneration:", error);
    }

    return NextResponse.json({
      success: true,
      message: "LinkedIn data removed successfully",
    });

  } catch (error) {
    console.error("LinkedIn delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete LinkedIn data" },
      { status: 500 }
    );
  }
}

// Helper: Generate a concise bio from LinkedIn summary
function generateBioFromLinkedIn(linkedinSummary: string): string {
  // Extract the first line which usually has name and role info
  const lines = linkedinSummary.split('\n').filter(line => line.trim());
  
  // Look for personality/values paragraph (usually starts with description of the person)
  const personalityMatch = linkedinSummary.match(/(?:profile reads as|He|She|They)\s+[^.]+\./i);
  
  // Look for aspirations paragraph
  const aspirationsMatch = linkedinSummary.match(/(?:aspirations|values|emphasizes)[^.]+\./i);
  
  // Build a concise bio (max 300 chars)
  let bio = "";
  
  // Try to extract key traits
  if (personalityMatch) {
    bio = personalityMatch[0].replace(/^(profile reads as|His profile reads as|Her profile reads as)\s*/i, "");
  } else if (lines.length > 0) {
    // Use the first descriptive paragraph
    const descParagraph = lines.find(line => 
      line.length > 50 && 
      !line.includes("—") && 
      !line.includes("followers")
    );
    if (descParagraph) {
      bio = descParagraph;
    }
  }
  
  // Truncate if too long
  if (bio.length > 350) {
    bio = bio.substring(0, 347) + "...";
  }
  
  return bio.trim() || "";
}

// Helper: Extract occupation from LinkedIn summary
function extractOccupationFromLinkedIn(linkedinSummary: string): string | null {
  // Look for job title patterns
  // Format: "Name — Location — Company — Role"
  const dashPattern = linkedinSummary.match(/—[^—]+—\s*([^—\n]+)/);
  if (dashPattern && dashPattern[1]) {
    const role = dashPattern[1].trim();
    // Clean up the role (remove company details if present)
    const cleanRole = role.split('(')[0].trim();
    if (cleanRole.length > 3 && cleanRole.length < 100) {
      return cleanRole;
    }
  }
  
  // Look for explicit role mentions
  const rolePatterns = [
    /(?:works as|working as)\s+(?:an?\s+)?([^,.]+)/i,
    /(?:current role|position):\s*([^,.]+)/i,
    /(?:AI|ML|Software|Full Stack|Frontend|Backend|Data|Research)\s+(?:Engineer|Developer|Scientist|Intern|Analyst)/i,
  ];
  
  for (const pattern of rolePatterns) {
    const match = linkedinSummary.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.trim() || null;
    }
  }
  
  return null;
}
