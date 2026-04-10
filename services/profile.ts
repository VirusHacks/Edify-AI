import { db } from "@/configs/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

// Helper to parse JSON string arrays
function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper to parse JSON string objects
function parseJsonObject(val: string | null | undefined): Record<string, string> {
  if (!val) return {};
  try {
    const parsed = JSON.parse(val);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// Input schema for getting profile
export const GetProfileInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Output schema for profile data
export const ProfileDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  bio: z.string().nullable(),
  interests: z.array(z.string()),
  skills: z.array(z.string()),
  courses: z.array(z.string()),
  preferredLanguages: z.array(z.string()),
  learningGoals: z.array(z.string()),
  occupation: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  socialLinks: z.record(z.string()),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const GetProfileOutputSchema = z.object({
  success: z.boolean(),
  data: ProfileDataSchema.nullable(),
  error: z.string().optional(),
});

// Input schema for updating profile
export const UpdateProfileInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  courses: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  learningGoals: z.array(z.string()).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
});

export const UpdateProfileOutputSchema = z.object({
  success: z.boolean(),
  data: ProfileDataSchema.nullable(),
  fieldsUpdated: z.array(z.string()),
  error: z.string().optional(),
});

// Type exports
export type GetProfileInput = z.infer<typeof GetProfileInputSchema>;
export type GetProfileOutput = z.infer<typeof GetProfileOutputSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
export type UpdateProfileOutput = z.infer<typeof UpdateProfileOutputSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get user profile by userId
 */
export async function getProfile(input: GetProfileInput): Promise<GetProfileOutput> {
  try {
    const validated = GetProfileInputSchema.parse(input);
    
    const [userData] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, validated.userId))
      .limit(1);
    
    if (!userData) {
      return {
        success: false,
        data: null,
        error: "User not found",
      };
    }
    
    // Transform raw DB data to ProfileData format
    const profileData: ProfileData = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      bio: userData.bio,
      interests: parseJsonArray(userData.interests),
      skills: parseJsonArray(userData.skills),
      courses: parseJsonArray(userData.courses),
      preferredLanguages: parseJsonArray(userData.preferredLanguages),
      learningGoals: parseJsonArray(userData.learningGoals),
      occupation: userData.occupation,
      location: userData.location,
      website: userData.website,
      socialLinks: parseJsonObject(userData.socialLinks),
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
    
    return {
      success: true,
      data: profileData,
    };
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to get profile",
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
  try {
    const validated = UpdateProfileInputSchema.parse(input);
    const { userId, ...updateData } = validated;
    
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);
    
    if (!existingUser) {
      return {
        success: false,
        data: null,
        fieldsUpdated: [],
        error: "User not found",
      };
    }
    
    // Build the update object, converting arrays to JSON strings
    const updateFields: Record<string, any> = {};
    const fieldsUpdated: string[] = [];
    
    if (updateData.bio !== undefined) {
      updateFields.bio = updateData.bio;
      fieldsUpdated.push("bio");
    }
    if (updateData.interests !== undefined) {
      updateFields.interests = JSON.stringify(updateData.interests);
      fieldsUpdated.push("interests");
    }
    if (updateData.skills !== undefined) {
      updateFields.skills = JSON.stringify(updateData.skills);
      fieldsUpdated.push("skills");
    }
    if (updateData.courses !== undefined) {
      updateFields.courses = JSON.stringify(updateData.courses);
      fieldsUpdated.push("courses");
    }
    if (updateData.preferredLanguages !== undefined) {
      updateFields.preferredLanguages = JSON.stringify(updateData.preferredLanguages);
      fieldsUpdated.push("preferredLanguages");
    }
    if (updateData.learningGoals !== undefined) {
      updateFields.learningGoals = JSON.stringify(updateData.learningGoals);
      fieldsUpdated.push("learningGoals");
    }
    if (updateData.occupation !== undefined) {
      updateFields.occupation = updateData.occupation;
      fieldsUpdated.push("occupation");
    }
    if (updateData.location !== undefined) {
      updateFields.location = updateData.location;
      fieldsUpdated.push("location");
    }
    if (updateData.website !== undefined) {
      updateFields.website = updateData.website;
      fieldsUpdated.push("website");
    }
    if (updateData.socialLinks !== undefined) {
      updateFields.socialLinks = JSON.stringify(updateData.socialLinks);
      fieldsUpdated.push("socialLinks");
    }
    
    // Add updatedAt timestamp
    updateFields.updatedAt = new Date();
    
    // Update the user
    const [updatedUser] = await db
      .update(userTable)
      .set(updateFields)
      .where(eq(userTable.id, userId))
      .returning();
    
    // Transform to ProfileData format
    const profileData: ProfileData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      interests: parseJsonArray(updatedUser.interests),
      skills: parseJsonArray(updatedUser.skills),
      courses: parseJsonArray(updatedUser.courses),
      preferredLanguages: parseJsonArray(updatedUser.preferredLanguages),
      learningGoals: parseJsonArray(updatedUser.learningGoals),
      occupation: updatedUser.occupation,
      location: updatedUser.location,
      website: updatedUser.website,
      socialLinks: parseJsonObject(updatedUser.socialLinks),
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
    
    return {
      success: true,
      data: profileData,
      fieldsUpdated,
    };
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return {
      success: false,
      data: null,
      fieldsUpdated: [],
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Helper to extract profile data suitable for resume building
 * Returns formatted data from profile to pre-fill resume
 */
export function extractProfileForResume(profile: ProfileData) {
  const socialLinks = profile.socialLinks || {};
  
  return {
    personalInfo: {
      firstName: profile.name?.split(" ")[0] || "",
      lastName: profile.name?.split(" ").slice(1).join(" ") || "",
      email: profile.email,
      jobTitle: profile.occupation || "",
      address: profile.location || "",
    },
    skills: profile.skills.map((skill) => ({
      name: skill,
      rating: 3, // Default rating
    })),
    summary: profile.bio || "",
    socialLinks: {
      linkedin: socialLinks.linkedin || socialLinks.LinkedIn || "",
      github: socialLinks.github || socialLinks.GitHub || "",
      twitter: socialLinks.twitter || socialLinks.Twitter || "",
      portfolio: profile.website || socialLinks.portfolio || socialLinks.website || "",
    },
    interests: profile.interests,
    learningGoals: profile.learningGoals,
  };
}
