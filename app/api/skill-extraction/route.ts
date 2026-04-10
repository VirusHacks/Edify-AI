import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

interface SkillExtractionResult {
  skills: string[];
  careerPaths: Array<{
    title: string;
    description: string;
    requiredSkills: string[];
    averageSalary?: string;
    growthOutlook?: string;
  }>;
  prerequisites: string[];
  learningPath: Array<{
    step: number;
    title: string;
    description: string;
    estimatedTime?: string;
  }>;
  summary: string;
}

/**
 * Extract and parse JSON from AI response
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
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']')
              .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1:/g, '"$2":');
            try {
              return JSON.parse(fixed);
            } catch (e4) {
              throw new Error(`Failed to parse JSON after multiple attempts`);
            }
          }
        }
      }
    }
    
    throw new Error(`No JSON object found in response`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, contentType, title, url } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content is required and must be at least 50 characters',
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

    // Generate analysis prompt
    const prompt = `You are an expert career advisor and learning path analyst. Analyze the following educational/career content and extract valuable insights.

**Content Type:** ${contentType || 'General'}
**Title:** ${title || 'Untitled'}
**URL:** ${url || 'N/A'}

**Content:**
${content.substring(0, 8000)}

**Your Task:**
Analyze this content and provide:

1. **Skills You Can Learn** (5-15 specific, actionable skills):
   - Technical skills (programming languages, tools, frameworks)
   - Soft skills (communication, leadership, etc.)
   - Domain-specific knowledge

2. **Career Paths** (3-7 related career paths):
   - Job titles/roles related to this content
   - Brief description of each career path
   - Required skills for each path
   - Average salary range (if known)
   - Growth outlook (if known)

3. **Prerequisites** (What you need to know before learning this):
   - Foundational knowledge
   - Required skills
   - Recommended background

4. **Learning Path** (Step-by-step guide):
   - Ordered steps to master the content
   - Estimated time for each step
   - Clear progression from beginner to advanced

5. **Summary** (2-3 sentence overview of what this content teaches)

**CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.**

**Output Format (JSON only):**

{
  "skills": ["skill1", "skill2", "skill3"],
  "careerPaths": [
    {
      "title": "Career Title",
      "description": "Brief description",
      "requiredSkills": ["skill1", "skill2"],
      "averageSalary": "$XX,XXX - $XX,XXX",
      "growthOutlook": "Growing/Stable/Declining"
    }
  ],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "learningPath": [
    {
      "step": 1,
      "title": "Step Title",
      "description": "What to learn",
      "estimatedTime": "X hours/days/weeks"
    }
  ],
  "summary": "Brief summary of the content"
}

**IMPORTANT: Return ONLY the JSON object, nothing else.**`;

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
    let analysisResult: SkillExtractionResult;

    try {
      analysisResult = extractJSONFromResponse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response (first 2000 chars):', aiResponse.substring(0, 2000));
      console.error('AI Response length:', aiResponse.length);
      console.error('Full AI Response:', aiResponse);
      throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate and ensure all required fields exist
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('AI response is not a valid JSON object');
    }

    // Ensure all required fields exist with defaults
    const validatedResult: SkillExtractionResult = {
      skills: Array.isArray(analysisResult.skills) ? analysisResult.skills : [],
      careerPaths: Array.isArray(analysisResult.careerPaths) 
        ? analysisResult.careerPaths.map((path: any) => ({
            title: path.title || 'Unknown Career',
            description: path.description || '',
            requiredSkills: Array.isArray(path.requiredSkills) ? path.requiredSkills : [],
            averageSalary: path.averageSalary || undefined,
            growthOutlook: path.growthOutlook || undefined,
          }))
        : [],
      prerequisites: Array.isArray(analysisResult.prerequisites) ? analysisResult.prerequisites : [],
      learningPath: Array.isArray(analysisResult.learningPath)
        ? analysisResult.learningPath.map((step: any) => ({
            step: step.step || 0,
            title: step.title || 'Untitled Step',
            description: step.description || '',
            estimatedTime: step.estimatedTime || undefined,
          }))
        : [],
      summary: analysisResult.summary || 'No summary available',
    };

    return NextResponse.json({
      success: true,
      data: validatedResult,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Skill extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to extract skills from content',
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

