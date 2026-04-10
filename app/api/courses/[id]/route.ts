import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/db/schema/chapter';
import { eq } from 'drizzle-orm';


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const res = await db.delete(CourseList).where(eq(CourseList.id, id)).returning({ id: CourseList.id });
    return NextResponse.json({ success: true, data: res }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/courses/[id] error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;

    // try numeric id first
    const numericId = Number(idParam);
    let courseResult;

    if (!Number.isNaN(numericId)) {
      const res = await db.select().from(CourseList).where(eq(CourseList.id, numericId));
      courseResult = res[0];
    } else {
      // treat as courseId (string)
      const res = await db.select().from(CourseList).where(eq(CourseList.courseId, idParam));
      courseResult = res[0];
    }

    if (!courseResult) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Note: chapter content is stored in the CourseChapters table and can be requested
    // via the dedicated chapter endpoint (GET /api/courses/[id]/chapters/[chapterId]).

    return NextResponse.json({ success: true, data: courseResult }, { status: 200 });
  } catch (error) {
    console.error('GET /api/courses/[id] error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    if (!idParam) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const body = await request.json();
    const allowed = ['courseOutput', 'isPublished', 'courseBanner', 'courseName', 'category', 'level'];
    const updates: any = {};
    for (const key of Object.keys(body)) {
      if (allowed.includes(key)) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    // Try updating by courseId string
    await db.update(CourseList).set(updates).where(eq(CourseList.courseId, idParam));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/courses/[id] error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
