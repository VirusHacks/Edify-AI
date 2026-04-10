export interface ResumeAnalysisInput {
  resumeText: string;
  jobDescription: string;
  keywords?: string;
  jobTitle?: string;
  companyName?: string;
}

export interface SectionRecommendation {
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ResumeAnalysisResult {
  overallScore: number;
  atsMatchPercentage: number;
  sectionRecommendations: SectionRecommendation[];
  missingKeywords: string[];
  suggestedKeywords: string[];
  aiGeneratedSummary: string;
  rewrittenSummary?: string;
  nextSteps: string[];
  strengths: string[];
  weaknesses: string[];
}

/**
 * Generate comprehensive resume analysis prompt for Gemini
 */
export function generateResumeAnalysisPrompt(
  input: ResumeAnalysisInput
): string {
  const { resumeText, jobDescription, keywords, jobTitle, companyName } = input;

  return `You are an expert career advisor and ATS (Applicant Tracking System) optimization analyst. Your task is to analyze a resume against a job description and provide comprehensive feedback.

**Resume Content:**
${resumeText}

**Job Description:**
${jobDescription}

${keywords ? `**Additional Keywords to Consider:**\n${keywords}` : ''}

${jobTitle ? `**Target Job Title:** ${jobTitle}` : ''}
${companyName ? `**Target Company:** ${companyName}` : ''}

**Your Analysis Should Include:**

1. **Overall Resume Score** (0-100): Rate the resume's overall quality and relevance to the job description.

2. **ATS Match Percentage** (0-100): Calculate how well the resume matches the job requirements based on keywords, skills, and qualifications.

3. **Section-wise Recommendations** (for each section: Summary/Objective, Experience, Skills, Projects, Achievements):
   - Identify specific issues or areas for improvement
   - Provide concrete suggestions
   - Assign priority level (high/medium/low)

4. **Keyword Analysis**:
   - List missing critical keywords from the job description
   - Suggest additional relevant keywords to include

5. **AI-Generated Summary**: Write a compelling professional summary (2-3 sentences) tailored to this specific job, incorporating key qualifications and value propositions.

6. **Rewritten Summary**: If the original summary exists, provide an improved version.

7. **Next-Step Suggestions**: Provide 3-5 actionable steps to improve the resume before submission.

8. **Strengths**: Highlight 3-5 key strengths in the current resume.

9. **Weaknesses**: Identify 3-5 areas that need improvement.

**CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.**

**Output Format (JSON only, no markdown, no code blocks):**

{
  "overallScore": 85,
  "atsMatchPercentage": 78,
  "sectionRecommendations": [
    {
      "section": "Summary",
      "issue": "Missing key skills",
      "suggestion": "Add relevant technologies",
      "priority": "high"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestedKeywords": ["keyword1", "keyword2"],
  "aiGeneratedSummary": "Compelling summary text here",
  "rewrittenSummary": "Improved summary if applicable",
  "nextSteps": ["step1", "step2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}

**IMPORTANT: Return ONLY the JSON object above, nothing else. No markdown, no code blocks, no explanations.**`;
}

