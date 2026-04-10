import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { inngest } from "@/inngest/client";

/**
 * API to manually trigger AI context and embedding regeneration for the current user
 * 
 * POST /api/user/regenerate-context
 * 
 * This triggers the Inngest background job to:
 * 1. Regenerate the aiContext field from all user data
 * 2. Create new embedding from the context
 * 3. Store embedding in vector database
 */
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

    // Trigger the Inngest job
    await inngest.send({
      name: "user/profile-updated",
      data: { 
        userId: kindeUser.id,
        trigger: "manual-regenerate",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Context regeneration triggered. This may take a few seconds.",
      userId: kindeUser.id,
    });

  } catch (error) {
    console.error("Context regeneration error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to trigger regeneration" 
      },
      { status: 500 }
    );
  }
}
