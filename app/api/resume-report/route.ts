import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { resumeAnalysisTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateResumeReportPDF } from '@/lib/pdf-report-generator';

export async function GET(req: NextRequest) {
  try {
    const analysisId = req.nextUrl.searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch analysis from database
    const [analysis] = await db
      .select()
      .from(resumeAnalysisTable)
      .where(eq(resumeAnalysisTable.analysisId, analysisId));

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found',
        },
        { status: 404 }
      );
    }

    // Generate PDF report
    const pdfBytes = await generateResumeReportPDF(
      analysis.recommendations as any,
      {
        analysisId: analysis.analysisId,
        jobTitle: analysis.jobTitle || undefined,
        companyName: analysis.companyName || undefined,
        generatedAt: analysis.createdAt,
      }
    );

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-analysis-${analysisId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate PDF report',
      },
      { status: 500 }
    );
  }
}

