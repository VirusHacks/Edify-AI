import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { inngest } from "@/inngest/client";

/**
 * POST /api/user/update-profile-embeddings
 * Trigger user profile embedding update (called after profile changes)
 */
export async function POST(req: NextRequest) {
  try {
    // Check if Inngest is configured
    if (!process.env.INNGEST_EVENT_KEY) {
      console.warn("⚠️ INNGEST_EVENT_KEY not set - profile embedding generation disabled");
      return NextResponse.json(
        {
          error: "Inngest not configured",
          message: "INNGEST_EVENT_KEY environment variable is required. See docs/ENV_SETUP.md for setup instructions.",
          hint: "Quick fix: Get a free key at https://www.inngest.com/ or run 'npx inngest-cli dev' for local testing",
        },
        { status: 503 }
      );
    }

    const { getUser, isAuthenticated } = getKindeServerSession();
    
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Trigger Inngest function to update user embeddings
    await inngest.send({
      name: "user/profile-updated",
      data: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Profile embedding update triggered",
      userId: user.id,
    });
  } catch (error) {
    console.error("Error triggering profile update:", error);
    
    // Provide helpful error messages
    let errorMessage = "Failed to trigger profile update";
    let hint = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common Inngest errors
      if (error.message.includes("Event key not found") || error.message.includes("401")) {
        hint = "Your INNGEST_EVENT_KEY may be invalid. Check your .env file or get a new key at https://www.inngest.com/";
      } else if (error.message.includes("ENOTFOUND") || error.message.includes("network")) {
        hint = "Network error - check your internet connection or use local Inngest dev server: npx inngest-cli dev";
      }
    }
    
    return NextResponse.json(
      {
        error: "Failed to trigger profile update",
        message: errorMessage,
        ...(hint && { hint }),
      },
      { status: 500 }
    );
  }
}
