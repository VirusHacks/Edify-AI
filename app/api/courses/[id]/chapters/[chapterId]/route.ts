import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseChapters } from '@/db/schema/chapter';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: { id: string; chapterId: string } }) {
  try {
    const { id, chapterId } = params;

    if (!id) return NextResponse.json({ success: false, error: 'Missing course id' }, { status: 400 });

    const numericChapter = Number(chapterId);
    if (Number.isNaN(numericChapter)) {
      return NextResponse.json({ success: false, error: 'Invalid chapter id' }, { status: 400 });
    }

    // Query CourseChapters by courseId AND chapterId
    const res = await db.select().from(CourseChapters).where(
      and(
        eq(CourseChapters.courseId, id),
        eq(CourseChapters.chapterId, numericChapter)
      )
    );

    const chapter = res[0];
    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: chapter }, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses/[id]/chapters/[chapterId] error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
