import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { UserAnswer } from '@/db/schema/mock';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    const { interviewId } = params;

    if (!interviewId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview ID is required',
        },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, interviewId))
      .orderBy(UserAnswer.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feedback',
      },
      { status: 500 }
    );
  }
}

