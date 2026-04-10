import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { UserAnswer } from '@/db/schema/mock';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import moment from 'moment';

export async function POST(
  req: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { interviewId } = params;
    const body = await req.json();
    const { 
      question, 
      correctAns, 
      userAns, 
      feedback, 
      rating,
      // Body language metrics
      eyeContactScore,
      engagementScore,
      confidenceScore,
      dominantExpression,
      bodyLanguageMetrics,
    } = body;

    if (!question || !userAns) {
      return NextResponse.json(
        {
          success: false,
          error: 'Question and user answer are required',
        },
        { status: 400 }
      );
    }

    const resp = await db.insert(UserAnswer).values({
      mockIdRef: interviewId,
      question,
      correctAns: correctAns || null,
      userAns,
      feedback: feedback || null,
      rating: rating ? String(rating) : null,
      userEmail: user.email,
      createdAt: moment().format('DD-MM-yyyy'),
      // Body language metrics
      eyeContactScore: eyeContactScore || null,
      engagementScore: engagementScore || null,
      confidenceScore: confidenceScore || null,
      dominantExpression: dominantExpression || null,
      bodyLanguageMetrics: bodyLanguageMetrics || null,
    });

    return NextResponse.json({
      success: true,
      data: resp,
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save answer',
      },
      { status: 500 }
    );
  }
}

