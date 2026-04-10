import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/db/schema/chapter';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    if (!idParam) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const body = await request.json();
    const increment = Number(body.increment) || 0;

    // get current progress
    const res = await db.select({ id: CourseList.id, progress: CourseList.progress }).from(CourseList).where(eq(CourseList.courseId, idParam));
    const current = res[0];
    if (!current) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    let newProgress = (current.progress || 0) + increment;
    newProgress = Math.min(newProgress, 100);

    await db.update(CourseList).set({ progress: newProgress }).where(eq(CourseList.courseId, idParam));

    return NextResponse.json({ success: true, data: { progress: newProgress } }, { status: 200 });
  } catch (error) {
    console.error('POST /api/courses/[id]/progress error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
