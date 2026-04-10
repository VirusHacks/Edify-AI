import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { getSupabaseAdmin, RESUME_BUCKET } from "@/configs/supabase";
import { parseResume } from "@/lib/resume-parser";
import { extractResumeData, getAutoPopulateFields } from "@/lib/resume-extractor";
import { inngest } from "@/inngest/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

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

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a PDF or Word document." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert File to Buffer for parsing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse resume content using existing parser
    const parseResult = await parseResume(file);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error || "Failed to parse resume" },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const supabaseAdmin = getSupabaseAdmin();
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "pdf";
    const fileName = `${kindeUser.id}/${timestamp}_resume.${fileExtension}`;

    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .getPublicUrl(fileName);

    const downloadUrl = urlData.publicUrl;

    // Extract structured data from resume for auto-population
    console.log("[Resume API] Extracting structured data from resume...");
    const extractedData = await extractResumeData(parseResult.text);
    console.log("[Resume API] Extracted skills:", extractedData.technicalSkills.length);
    console.log("[Resume API] Extracted interests:", extractedData.interests.length);

    // Get current user profile to merge with extracted data
    const [currentUser] = await db
      .select({
        skills: userTable.skills,
        interests: userTable.interests,
        occupation: userTable.occupation,
        location: userTable.location,
        website: userTable.website,
        githubUsername: userTable.githubUsername,
      })
      .from(userTable)
      .where(eq(userTable.id, kindeUser.id));

    // Parse current arrays
    const parseJsonArray = (str: string | null): string[] => {
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const currentProfile = {
      skills: parseJsonArray(currentUser?.skills || null),
      interests: parseJsonArray(currentUser?.interests || null),
      occupation: currentUser?.occupation || null,
      location: currentUser?.location || null,
      website: currentUser?.website || null,
      githubUsername: currentUser?.githubUsername || null,
    };

    // Get auto-populated fields (merges extracted with existing)
    const autoPopulated = getAutoPopulateFields(extractedData, currentProfile);
    console.log("[Resume API] Auto-populated skills:", autoPopulated.skills.length);
    console.log("[Resume API] Auto-populated data:", JSON.stringify({
      skills: autoPopulated.skills.slice(0, 5),
      occupation: autoPopulated.occupation,
      githubUsername: autoPopulated.githubUsername,
    }));

    // Update user record with resume data AND auto-populated fields
    console.log("[Resume API] Updating database for user:", kindeUser.id);
    
    try {
      const updateResult = await db
        .update(userTable)
        .set({
          resumeUrl: downloadUrl,
          resumeParsedText: parseResult.text,
          // Auto-populate empty fields from resume
          skills: JSON.stringify(autoPopulated.skills),
          interests: JSON.stringify(autoPopulated.interests),
          occupation: autoPopulated.occupation || currentProfile.occupation,
          location: autoPopulated.location || currentProfile.location,
          website: autoPopulated.website || currentProfile.website,
          githubUsername: autoPopulated.githubUsername || currentProfile.githubUsername,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, kindeUser.id))
        .returning({ id: userTable.id });
      
      console.log("[Resume API] Database update result:", updateResult);
    } catch (dbError) {
      console.error("[Resume API] Database update error:", dbError);
      throw dbError;
    }

    // Trigger AI context regeneration
    try {
      await inngest.send({
        name: "user/profile-updated",
        data: { 
          userId: kindeUser.id,
          trigger: "resume-upload",
        },
      });
    } catch (error) {
      console.error("Failed to trigger context regeneration:", error);
    }

    return NextResponse.json({
      success: true,
      resumeUrl: downloadUrl,
      parsedTextLength: parseResult.text.length,
      message: "Resume uploaded and profile auto-populated successfully",
      autoPopulated: {
        skillsAdded: autoPopulated.skills.length - currentProfile.skills.length,
        interestsAdded: autoPopulated.interests.length - currentProfile.interests.length,
        fieldsUpdated: [
          autoPopulated.occupation !== currentProfile.occupation ? 'occupation' : null,
          autoPopulated.location !== currentProfile.location ? 'location' : null,
          autoPopulated.website !== currentProfile.website ? 'website' : null,
          autoPopulated.githubUsername !== currentProfile.githubUsername ? 'github' : null,
        ].filter(Boolean),
      },
      extracted: {
        skills: extractedData.technicalSkills.slice(0, 10),
        interests: extractedData.interests.slice(0, 5),
        currentRole: extractedData.currentRole,
        careerLevel: extractedData.careerLevel,
      },
    });

  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to upload resume" 
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve user's resume info
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
        resumeUrl: userTable.resumeUrl,
        resumeParsedText: userTable.resumeParsedText,
      })
      .from(userTable)
      .where(eq(userTable.id, kindeUser.id));

    // Check if full text is requested (for mock interviews)
    const url = new URL(request.url);
    const fullText = url.searchParams.get('fullText') === 'true';

    return NextResponse.json({
      success: true,
      hasResume: !!userData?.resumeUrl,
      resumeUrl: userData?.resumeUrl,
      parsedTextPreview: userData?.resumeParsedText?.substring(0, 500),
      ...(fullText && userData?.resumeParsedText ? { 
        resumeText: userData.resumeParsedText 
      } : {}),
    });

  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume info" },
      { status: 500 }
    );
  }
}

// DELETE - Remove user's resume
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

    // Clear resume data from user record
    await db
      .update(userTable)
      .set({
        resumeUrl: null,
        resumeParsedText: null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, kindeUser.id));

    // Trigger context regeneration
    try {
      await inngest.send({
        name: "user/profile-updated",
        data: { 
          userId: kindeUser.id,
          trigger: "resume-delete",
        },
      });
    } catch (error) {
      console.error("Failed to trigger context regeneration:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Resume removed successfully",
    });

  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
