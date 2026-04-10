import { NextResponse } from "next/server";
import { generateCourseOutlineFromStep, GenerateCourseFromStepInputSchema } from "@/services/pathway-course";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedInput = GenerateCourseFromStepInputSchema.safeParse(body);
    if (!validatedInput.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validatedInput.error.errors },
        { status: 400 }
      );
    }

    // Generate course outline
    const outline = await generateCourseOutlineFromStep(validatedInput.data);

    return NextResponse.json({ 
      success: true, 
      data: outline 
    });
  } catch (error) {
    console.error("Error in generate-course-outline:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate course outline" },
      { status: 500 }
    );
  }
}
