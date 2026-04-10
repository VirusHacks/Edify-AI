import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { MockInterview } from '@/db/schema/mock';
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
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interview',
      },
      { status: 500 }
    );
  }
}

