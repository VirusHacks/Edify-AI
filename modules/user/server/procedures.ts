import { z } from "zod";
import { eq, and, ne, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "@/db";
import { user as userTable, documentTable } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { userUpdateSchema } from "@/modules/user/schemas";
import { CourseList, userProgress, pathways } from "@/db/schema/chapter";
import { inngest } from "@/inngest/client";

export const userRouter = createTRPCRouter({
  getOne: protectedProcedure.query(async ({ ctx }) => {
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, ctx.dbUserId));

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return existingUser;
  }),
  update: protectedProcedure
    .input(userUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Transform arrays and objects to JSON strings for storage
      const updateData: Record<string, any> = {};
      
      if (input.interests !== undefined) {
        updateData.interests = JSON.stringify(input.interests);
      }
      if (input.skills !== undefined) {
        updateData.skills = JSON.stringify(input.skills);
      }
      if (input.courses !== undefined) {
        updateData.courses = JSON.stringify(input.courses);
      }
      if (input.preferredLanguages !== undefined) {
        updateData.preferredLanguages = JSON.stringify(input.preferredLanguages);
      }
      if (input.learningGoals !== undefined) {
        updateData.learningGoals = JSON.stringify(input.learningGoals);
      }
      if (input.socialLinks !== undefined) {
        updateData.socialLinks = JSON.stringify(input.socialLinks);
      }

      // Add other optional fields
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.occupation !== undefined) updateData.occupation = input.occupation;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.website !== undefined) updateData.website = input.website;
      
      // New enhanced profile fields
      if (input.linkedinProfileUrl !== undefined) updateData.linkedinProfileUrl = input.linkedinProfileUrl;
      if (input.githubUsername !== undefined) updateData.githubUsername = input.githubUsername;

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      const [updatedUser] = await db
        .update(userTable)
        .set(updateData)
        .where(eq(userTable.id, ctx.dbUserId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Trigger AI context regeneration in background
      try {
        await inngest.send({
          name: "user/profile-updated",
          data: { userId: ctx.dbUserId },
        });
      } catch (error) {
        console.error("Failed to trigger profile embedding update:", error);
        // Don't fail the request if Inngest fails
      }

      return updatedUser;
    }),
  // Get user's AI context (for internal use by features)
  getAiContext: protectedProcedure.query(async ({ ctx }) => {
    const [existingUser] = await db
      .select({
        aiContext: userTable.aiContext,
        resumeParsedText: userTable.resumeParsedText,
        linkedinSummary: userTable.linkedinSummary,
        bio: userTable.bio,
        skills: userTable.skills,
        interests: userTable.interests,
        learningGoals: userTable.learningGoals,
        occupation: userTable.occupation,
      })
      .from(userTable)
      .where(eq(userTable.id, ctx.dbUserId));

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return existingUser;
  }),
  // Get user's created courses
  getCreatedCourses: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.user.email;
    if (!userEmail) {
      return [];
    }
    
    const courses = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.createdBy, userEmail))
      .limit(20);
    
    return courses;
  }),
  // Get user's pathway progress
  getPathwayProgress: protectedProcedure.query(async ({ ctx }) => {
    const progressRecords = await db
      .select({
        progress: userProgress,
        pathway: pathways,
      })
      .from(userProgress)
      .leftJoin(pathways, eq(userProgress.pathwayId, pathways.id))
      .where(eq(userProgress.userId, ctx.dbUserId));
    
    return progressRecords.map((record) => ({
      ...record.progress,
      pathway: record.pathway,
    }));
  }),
  // Get user's documents/resumes
  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.user.email;
    if (!userEmail) {
      return [];
    }
    
    const documents = await db
      .select()
      .from(documentTable)
      .where(
        and(
          eq(documentTable.userId, ctx.dbUserId),
          ne(documentTable.status, "archived")
        )
      )
      .orderBy(desc(documentTable.updatedAt))
      .limit(20);
    
    return documents;
  }),
});
