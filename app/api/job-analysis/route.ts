import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseResume } from '@/lib/resume-parser';
import { generateResumeAnalysisPrompt } from '@/lib/resume-analysis-prompt';

// CORS headers for extension requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Use the API key from environment (check multiple possible env var names for compatibility)
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                process.env.GOOGLE_GEMINI_API_KEY || 
                process.env.GOOGLE_AI_KEY || 
                process.env.GOOGLE_AI_API_KEY || 
                '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Extract and parse JSON from AI response, handling various formats
 */
function extractJSONFromResponse(response: string): any {
  let cleaned = response.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Try to find the largest JSON object
        let startIdx = cleaned.indexOf('{');
        let endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          try {
            return JSON.parse(cleaned.substring(startIdx, endIdx + 1));
          } catch (e3) {
            // Last resort: try to fix common JSON issues
            let fixed = cleaned.substring(startIdx, endIdx + 1)
              .replace(/,\s*}/g, '}')  // Remove trailing commas
              .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
              .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1:/g, '"$2":'); // Fix unquoted keys
            try {
              return JSON.parse(fixed);
            } catch (e4) {
              throw new Error(`Failed to parse JSON after multiple attempts. Original error: ${e instanceof Error ? e.message : 'Unknown'}`);
            }
          }
        }
      }
    }
    
    throw new Error(`No JSON object found in response. Response preview: ${response.substring(0, 200)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const jobTitle = formData.get('jobTitle') as string | null;
    const companyName = formData.get('companyName') as string | null;

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resume file and job description are required',
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!genAI) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key not configured',
        },
        { 
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Parse resume
    const parseResult = await parseResume(resumeFile);

    if (!parseResult.success || !parseResult.text) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || 'Failed to parse resume file',
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Generate analysis prompt
    const prompt = generateResumeAnalysisPrompt({
      resumeText: parseResult.text,
      jobDescription,
      jobTitle: jobTitle || undefined,
      companyName: companyName || undefined,
    });

    // Get AI model and generate analysis
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
    });

    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const aiResponse = result.response.text();
    let analysisResult;

    try {
      analysisResult = extractJSONFromResponse(aiResponse);
    } catch (parseError) {
      // Log the actual response for debugging
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response (first 2000 chars):', aiResponse.substring(0, 2000));
      console.error('AI Response length:', aiResponse.length);
      throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate that we have the required fields
    if (!analysisResult || typeof analysisResult !== 'object') {
      console.error('Invalid analysis result structure:', analysisResult);
      throw new Error('AI response is not a valid JSON object');
    }

    // Ensure all required fields exist with defaults
    analysisResult = {
      overallScore: analysisResult.overallScore ?? 0,
      atsMatchPercentage: analysisResult.atsMatchPercentage ?? 0,
      sectionRecommendations: Array.isArray(analysisResult.sectionRecommendations) 
        ? analysisResult.sectionRecommendations 
        : [],
      missingKeywords: Array.isArray(analysisResult.missingKeywords) 
        ? analysisResult.missingKeywords 
        : [],
      suggestedKeywords: Array.isArray(analysisResult.suggestedKeywords) 
        ? analysisResult.suggestedKeywords 
        : [],
      aiGeneratedSummary: analysisResult.aiGeneratedSummary ?? 'No summary generated',
      rewrittenSummary: analysisResult.rewrittenSummary ?? null,
      nextSteps: Array.isArray(analysisResult.nextSteps) 
        ? analysisResult.nextSteps 
        : [],
      strengths: Array.isArray(analysisResult.strengths) 
        ? analysisResult.strengths 
        : [],
      weaknesses: Array.isArray(analysisResult.weaknesses) 
        ? analysisResult.weaknesses 
        : [],
    };

    return NextResponse.json({
      success: true,
      data: {
        overallScore: analysisResult.overallScore || 0,
        atsMatchPercentage: analysisResult.atsMatchPercentage || 0,
        analysis: analysisResult,
      },
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze resume',
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

