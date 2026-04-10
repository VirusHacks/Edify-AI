import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Get user session
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

    // Parse request body
    const body = await req.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'resumeText and jobDescription are required',
        },
        { status: 400 }
      );
    }

    // Get Python backend URL from environment
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    // Call Python backend optimization endpoint
    const backendResponse = await fetch(`${pythonBackendUrl}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
      }),
      // Add timeout
      signal: AbortSignal.timeout(180000), // 3 minutes timeout for optimization
    });

    if (!backendResponse.ok) {
      // Try to get error message from backend
      let errorMessage = `Backend returned ${backendResponse.status}`;
      try {
        const errorData = await backendResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status message
      }
      // Log the backend error but don't throw yet - let backend handle logging
      console.error(`Backend error (${backendResponse.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    const backendData = await backendResponse.json();

    if (!backendData.success) {
      const errorMsg = backendData.error || 'Backend optimization failed';
      console.error('Backend returned success:false:', errorMsg);
      throw new Error(errorMsg);
    }

    // Return the optimization result
    return NextResponse.json({
      success: true,
      data: backendData.data,
    });
  } catch (error) {
    // Only log in frontend if it's a frontend error (network, timeout, etc.)
    // Backend errors should already be logged in the backend
    if (error instanceof Error && error.message.includes('Backend')) {
      // Backend error - already logged there, just pass it through
      console.error('Backend error received:', error.message);
    } else {
      // Frontend error (network, parsing, etc.)
      console.error('Frontend error in optimizeResume route:', error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to optimize resume',
      },
      { status: 500 }
    );
  }
}

