import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/configs/db';
import { CourseList } from '@/db/schema/chapter';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email') || '';

    if (!email) {
      return NextResponse.json({ success: false, error: 'email query param required' }, { status: 400 });
    }

    const result = await db.select().from(CourseList).where(eq(CourseList.createdBy, email));
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses/user error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
