import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resumeAnalysisTable } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { parseResume } from '@/lib/resume-parser';
import { generateResumeAnalysisPrompt } from '@/lib/resume-analysis-prompt';
import { GoogleAIModel } from '@/lib/google-ai-model';
import { v4 as uuidv4 } from 'uuid';

// GET endpoint to fetch previous analyses
export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Fetch all analyses for the user
    const analyses = await db
      .select()
      .from(resumeAnalysisTable)
      .where(eq(resumeAnalysisTable.userId, user.id))
      .orderBy(desc(resumeAnalysisTable.createdAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      data: analyses.map((analysis) => ({
        analysisId: analysis.analysisId,
        jobTitle: analysis.jobTitle,
        companyName: analysis.companyName,
        overallScore: analysis.overallScore,
        atsMatchPercentage: analysis.atsMatchPercentage,
        createdAt: analysis.createdAt,
        recommendations: analysis.recommendations,
        aiGeneratedSummary: analysis.aiGeneratedSummary,
        resumeText: analysis.resumeText,
        jobDescription: analysis.jobDescription,
        resumeStructured: (analysis.recommendations as any)?.resumeStructured || null,
      })),
    });
  } catch (error) {
    console.error('Fetch analyses error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analyses',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for new analysis (keeping existing functionality)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const keywords = formData.get('keywords') as string | null;
    const jobTitle = formData.get('jobTitle') as string | null;
    const companyName = formData.get('companyName') as string | null;

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resume file and job description are required',
        },
        { status: 400 }
      );
    }

    // Parse resume - extract text from PDF using Gemini
    const parseResult = await parseResume(resumeFile);

    if (!parseResult.success || !parseResult.text) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || 'Failed to parse resume file',
        },
        { status: 400 }
      );
    }

    // Get user ID
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Call Python backend for multi-agent analysis
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    let analysisResult;
    
    try {
      const backendResponse = await fetch(`${pythonBackendUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: parseResult.text,
          job_description: jobDescription,
        }),
        // Add timeout
        signal: AbortSignal.timeout(120000), // 2 minutes timeout
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ error: 'Backend request failed' }));
        throw new Error(errorData.error || `Backend returned ${backendResponse.status}`);
      }

      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.error || 'Backend analysis failed');
      }

      // Use the backend analysis result
      analysisResult = {
        ...backendData.data.analysis,
        resumeStructured: backendData.data.resumeStructured, // Include structured resume data
      };
      
    } catch (backendError) {
      // Fallback to original method if backend is unavailable
      console.warn('Python backend unavailable, using fallback method:', backendError);

    // Generate analysis prompt
    const prompt = generateResumeAnalysisPrompt({
      resumeText: parseResult.text,
      jobDescription,
      keywords: keywords || undefined,
    });

    // Get AI model and generate analysis
    const model = new GoogleAIModel();
    const aiResponse = await model.generateContent(prompt);
      analysisResult = JSON.parse(aiResponse);
    }

    // Generate unique analysis ID
    const analysisId = `analysis_${uuidv4()}`;

    // Normalize analysis result format
    const normalizedAnalysis = analysisResult.analysis || analysisResult;
    const overallScore = normalizedAnalysis.overallScore || normalizedAnalysis.overall_score || analysisResult.overallScore || 0;
    const atsMatchPercentage = normalizedAnalysis.atsMatchPercentage || normalizedAnalysis.ats_match_percentage || overallScore;

    // Try to store analysis in database
    try {
      const [savedAnalysis] = await db
        .insert(resumeAnalysisTable)
        .values({
          analysisId,
          userId: user.id,
          jobTitle: jobTitle || null,
          companyName: companyName || null,
          overallScore: Math.round(overallScore),
          atsMatchPercentage: Math.round(atsMatchPercentage),
          resumeText: parseResult.text,
          jobDescription,
          keywords: keywords || null,
          recommendations: normalizedAnalysis,
          aiGeneratedSummary: normalizedAnalysis.aiGeneratedSummary || normalizedAnalysis.ai_generated_summary || null,
          reportUrl: null, // Will be set when PDF is generated
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          analysisId: savedAnalysis.analysisId,
          overallScore: savedAnalysis.overallScore,
          atsMatchPercentage: savedAnalysis.atsMatchPercentage,
          analysis: normalizedAnalysis,
          resumeText: savedAnalysis.resumeText,
          jobDescription: savedAnalysis.jobDescription,
          resumeStructured: analysisResult.resumeStructured || normalizedAnalysis.resumeStructured || null,
        },
      });
    } catch (dbError) {
      // If database insert fails (table doesn't exist), return analysis without storage
      console.warn('Database storage failed, returning analysis without storage:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          analysisId,
          overallScore: Math.round(overallScore),
          atsMatchPercentage: Math.round(atsMatchPercentage),
          analysis: normalizedAnalysis,
          resumeText: parseResult.text,
          jobDescription,
          resumeStructured: analysisResult.resumeStructured || null,
        },
      });
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze resume',
      },
      { status: 500 }
    );
  }
}
