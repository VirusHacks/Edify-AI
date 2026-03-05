import { getYoutubeVideos } from "@/configs/service";
import { db } from "@/configs/db";
import { CourseChapters } from "@/db/schema/chapter";
import { CourseType } from "@/types/resume.type";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
import { MODEL } from "@/configs/ai-models";
import { eq } from "drizzle-orm";

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

export const generateCourseContent = async (
  course: CourseType,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);

  try {
    const chapters = course?.courseOutput.chapters;

    // Delete existing chapters for this course first to avoid stale data
    try {
      await db.delete(CourseChapters).where(eq(CourseChapters.courseId, course.courseId));
      console.log(`[Client] Cleared existing chapters for course "${course.courseId}"`);
    } catch (e) {
      console.warn(`[Client] Could not clear existing chapters:`, e);
    }

    // Process chapters sequentially to avoid rate limits and ensure clean context
    for (let index = 0; index < (chapters?.length || 0); index++) {
      const chapter = chapters![index];
      
      // Create a FRESH chat session for each chapter
      const chapterSession = createFreshChapterSession();
      
      const PROMPT = `Explain the concepts in detail on Topic: ${course?.courseName}, Chapter: ${chapter.chapter_name}, in JSON Format with list of array with fields as Title, explanation of given chapter in detail, code examples (code field <precode> format) if applicable. Additionally, generate 3-4 questions to test the user's understanding of the chapter.

IMPORTANT: Your response MUST be about "${chapter.chapter_name}" which is part of the course "${course?.courseName}". Do NOT generate content about any other topic.`;

      try {
        const query = course!.courseName + ":" + chapter.chapter_name;

        // Fetch video ID
        const resp = await getYoutubeVideos(query);
        console.log("Videos", resp);
        const videoId = resp?.[0]?.id?.videoId || '';

        console.log(`[Client] Generating chapter ${index + 1}/${chapters?.length}: "${chapter.chapter_name}"`);

        // Generate course content with fresh session
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

        // Extract quiz from content
        const quiz = content?.map((item: any) => item.quiz).flat().filter(Boolean) || [];

        // Insert into the database
        await db.insert(CourseChapters).values({
          chapterId: index,
          courseId: course.courseId,
          content: content,
          videoId: videoId,
          quiz: quiz,
        });
        
        console.log(`[Client] Successfully generated chapter ${index + 1}: "${chapter.chapter_name}"`);
      } catch (error) {
        console.error(`[Client] Error in processing chapter ${index}:`, error);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};
