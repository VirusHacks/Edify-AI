import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/db/schema/chapter';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '0');
    const limit = Number(url.searchParams.get('limit') || '8');
    const offset = page * limit;

    const result = await db.select().from(CourseList).limit(limit).offset(offset);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, userInput, data, user } = body;
    if (!id || !userInput || !data) {
      return NextResponse.json({ success: false, error: 'Missing payload' }, { status: 400 });
    }

    const insertRes = await db.insert(CourseList).values({
      courseId: id,
      courseName: userInput.topic,
      category: userInput.category,
      level: userInput.difficulty,
      courseOutput: data,
      createdBy: user?.email,
      username: user?.given_name,
      userprofileimage: user?.picture,
    } as any);

    return NextResponse.json({ success: true, data: insertRes }, { status: 201 });
  } catch (error) {
    console.error('POST /api/courses error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
