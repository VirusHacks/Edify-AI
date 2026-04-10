import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { MockInterview } from '@/db/schema/mock';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
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

    // Get email from query params or use authenticated user's email
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || user.email;

    // Only allow fetching own interviews
    if (email !== user.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - can only fetch your own interviews',
        },
        { status: 403 }
      );
    }

    const interviews = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.createdBy, email))
      .orderBy(desc(MockInterview.id));

    return NextResponse.json({
      success: true,
      data: interviews,
    });
  } catch (error) {
    console.error('Error fetching mock interviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interviews',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { jsonMockResp, jobPosition, jobDesc, jobExperience, linkedinUrl } = body;

    if (!jsonMockResp || !jobPosition || !jobDesc || !jobExperience) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const mockId = uuidv4();
    const createdAt = moment().format('DD-MM-yyyy');

    const [createdInterview] = await db
      .insert(MockInterview)
      .values({
        mockId,
        jsonMockResp,
        jobPosition,
        jobDesc,
        jobExperience,
        linkedinUrl: linkedinUrl || null,
        createdBy: user.email,
        createdAt,
      })
      .returning({ mockId: MockInterview.mockId });

    if (!createdInterview) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create interview',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mockId: createdInterview.mockId,
      },
    });
  } catch (error) {
    console.error('Error creating mock interview:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create interview',
      },
      { status: 500 }
    );
  }
}

