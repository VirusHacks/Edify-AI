import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList, CourseChapters } from '@/db/schema/chapter';
import { eq } from 'drizzle-orm';
import { MODEL } from '@/configs/ai-models';
import { getYoutubeVideos } from '@/configs/service';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseEnvironment } from "@/configs/BaseEnvironment";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

/**
 * Creates a fresh chat session for each chapter to avoid context pollution
 */
function createFreshChapterSession() {
  const env = new BaseEnvironment();
  const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMENI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL });
  
  return model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "Explain the concepts in detail on Topic: Python Basics, Chapter: Introduction to python, in JSON Format with list of array with fields as Title, explanation of given chapter in detail, code examples (code field <precode> format) if applicable. Additionally, generate 3-4 questions to test the user's understanding of the chapter.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: '```json\n[\n  {\n    "title": "What is Python?",\n    "explanation": "Python is a high-level, interpreted, general-purpose programming language.",\n    "code_examples": [],\n    "quiz": [\n      { "question": "What does Python support?", "options": ["Integers", "Strings", "Loops", "All of the above"], "answer": "All of the above" }\n    ]\n  }\n]\n```',
          },
        ],
      },
    ],
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    if (!idParam) return NextResponse.json({ success: false, error: 'Missing course id' }, { status: 400 });

    // Fetch the course by courseId
    const courseRes = await db.select().from(CourseList).where(eq(CourseList.courseId, idParam));
    const course = courseRes[0];
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    const chapters = (course?.courseOutput as any)?.chapters || [];

    // Delete existing chapters for this course to ensure fresh content
    try {
      await db.delete(CourseChapters).where(eq(CourseChapters.courseId, course.courseId));
      console.log(`[API Generate] Cleared existing chapters for course "${course.courseId}"`);
    } catch (e) {
      console.warn(`[API Generate] Could not clear existing chapters:`, e);
    }

    // Process chapters SEQUENTIALLY to avoid context pollution and rate limits
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index];
      try {
        // Create a FRESH chat session for each chapter
        const chapterSession = createFreshChapterSession();

        const PROMPT = `Explain the concepts in detail on Topic: ${course.courseName}, Chapter: ${chapter.chapter_name}, in JSON Format with list of array with fields as Title, explanation of given chapter in detail, code examples (code field <precode> format) if applicable. Additionally, generate 3-4 questions to test the user's understanding of the chapter.

IMPORTANT: Your response MUST be about "${chapter.chapter_name}" which is part of the course "${course.courseName}". Do NOT generate content about any other topic. Stay strictly focused on the chapter topic provided.`;

        console.log(`[API Generate] Generating chapter ${index + 1}/${chapters.length}: "${chapter.chapter_name}" for course "${course.courseName}"`);

        // Fetch video ID
        const resp = await getYoutubeVideos(course.courseName + ':' + chapter.chapter_name);
        const videoId = resp && resp[0] && resp[0].id ? resp[0].id.videoId : '';

        // Generate course content using FRESH AI session
        const result = await chapterSession.sendMessage(PROMPT);
        const responseText = result?.response?.text() || '[]';
        
        // Parse response, handling markdown code blocks
        let content;
        try {
          content = JSON.parse(responseText);
        } catch {
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            content = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error("Failed to parse AI response");
          }
        }

        const quiz = (content?.map((item: any) => item.quiz).flat() || []).filter(Boolean);

        await db.insert(CourseChapters).values({
          chapterId: index,
          courseId: course.courseId,
          content: content,
          videoId: videoId,
          quiz: quiz,
        });

        console.log(`[API Generate] Successfully generated chapter ${index + 1}: "${chapter.chapter_name}"`);
      } catch (e) {
        console.error(`[API Generate] Error generating chapter ${index} "${chapter.chapter_name}":`, e);
      }
    }

    // Update course as published
    await db.update(CourseList).set({ isPublished: true }).where(eq(CourseList.courseId, idParam));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/courses/[id]/generate error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
