import { GoogleGenerativeAI } from "@google/generative-ai";

// Extracted data structure from resume
export interface ExtractedResumeData {
  // Contact & social links
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  githubUsername: string | null;
  portfolioUrl: string | null;
  location: string | null;
  
  // Professional info
  currentRole: string | null;
  careerLevel: "entry" | "mid" | "senior" | "executive" | null;
  
  // Skills & interests
  technicalSkills: string[];
  softSkills: string[];
  interests: string[];
  
  // Education
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string | null;
  }>;
  
  // Experience summary
  totalYearsExperience: number | null;
  industries: string[];
}

// Get API key from environment
const apiKey =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_AI_KEY ||
  "";

/**
 * Extract structured data from resume text using AI
 */
export async function extractResumeData(
  resumeText: string
): Promise<ExtractedResumeData> {
  // Default empty result
  const defaultResult: ExtractedResumeData = {
    email: null,
    phone: null,
    linkedinUrl: null,
    githubUsername: null,
    portfolioUrl: null,
    location: null,
    currentRole: null,
    careerLevel: null,
    technicalSkills: [],
    softSkills: [],
    interests: [],
    education: [],
    totalYearsExperience: null,
    industries: [],
  };

  if (!apiKey) {
    console.warn("No Gemini API key found, using regex extraction fallback");
    return extractWithRegex(resumeText);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this resume text and extract structured information. Return ONLY a valid JSON object with these exact fields:

{
  "email": "email address or null",
  "phone": "phone number or null",
  "linkedinUrl": "LinkedIn URL or null",
  "githubUsername": "GitHub username (just the username, not URL) or null",
  "portfolioUrl": "portfolio/website URL or null",
  "location": "city, state/country or null",
  "currentRole": "most recent job title or null",
  "careerLevel": "entry|mid|senior|executive or null",
  "technicalSkills": ["array", "of", "technical", "skills"],
  "softSkills": ["array", "of", "soft", "skills"],
  "interests": ["array", "of", "professional", "interests"],
  "education": [{"institution": "name", "degree": "type", "field": "major", "year": "graduation year or null"}],
  "totalYearsExperience": number or null,
  "industries": ["array", "of", "industries"]
}

Resume text:
${resumeText.substring(0, 8000)}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      email: parsed.email || null,
      phone: parsed.phone || null,
      linkedinUrl: parsed.linkedinUrl || null,
      githubUsername: parsed.githubUsername || null,
      portfolioUrl: parsed.portfolioUrl || null,
      location: parsed.location || null,
      currentRole: parsed.currentRole || null,
      careerLevel: parsed.careerLevel || null,
      technicalSkills: Array.isArray(parsed.technicalSkills)
        ? parsed.technicalSkills
        : [],
      softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      totalYearsExperience: parsed.totalYearsExperience || null,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
    };
  } catch (error) {
    console.error("Error extracting resume data with AI:", error);
    return extractWithRegex(resumeText);
  }
}

/**
 * Fallback extraction using regex patterns
 */
function extractWithRegex(text: string): ExtractedResumeData {
  // Email extraction
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );

  // Phone extraction
  const phoneMatch = text.match(
    /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );

  // LinkedIn extraction
  const linkedinMatch = text.match(
    /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/i
  );

  // GitHub extraction
  const githubMatch = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);

  // Portfolio/Website extraction
  const portfolioMatch = text.match(
    /(?:portfolio|website|site)[\s:]*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  );

  // Common technical skills to look for
  const techSkillPatterns = [
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "C++",
    "C#",
    "React",
    "Node.js",
    "Angular",
    "Vue",
    "Next.js",
    "Express",
    "Django",
    "Flask",
    "FastAPI",
    "Spring",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Git",
    "Linux",
    "TensorFlow",
    "PyTorch",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "Data Science",
    "AI",
    "REST API",
    "GraphQL",
    "Microservices",
  ];

  const foundSkills = techSkillPatterns.filter((skill) =>
    new RegExp(`\\b${skill}\\b`, "i").test(text)
  );

  // Common interests/domains
  const interestPatterns = [
    "Machine Learning",
    "Artificial Intelligence",
    "Web Development",
    "Mobile Development",
    "Cloud Computing",
    "DevOps",
    "Data Science",
    "Cybersecurity",
    "Blockchain",
    "IoT",
    "Distributed Systems",
  ];

  const foundInterests = interestPatterns.filter((interest) =>
    new RegExp(`\\b${interest}\\b`, "i").test(text)
  );

  return {
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0] || null,
    linkedinUrl: linkedinMatch
      ? `https://linkedin.com/in/${linkedinMatch[1]}`
      : null,
    githubUsername: githubMatch?.[1] || null,
    portfolioUrl: portfolioMatch?.[1] || null,
    location: null,
    currentRole: null,
    careerLevel: null,
    technicalSkills: foundSkills,
    softSkills: [],
    interests: foundInterests,
    education: [],
    totalYearsExperience: null,
    industries: [],
  };
}

/**
 * Get fields to auto-populate based on extracted data and current profile
 */
export function getAutoPopulateFields(
  extracted: ExtractedResumeData,
  currentProfile: {
    skills: string[];
    interests: string[];
    occupation: string | null;
    location: string | null;
    website: string | null;
    githubUsername: string | null;
  }
): {
  skills: string[];
  interests: string[];
  occupation: string | null;
  location: string | null;
  website: string | null;
  githubUsername: string | null;
} {
  // Merge skills (existing + new from resume)
  const mergedSkills = Array.from(
    new Set([...currentProfile.skills, ...extracted.technicalSkills])
  );

  // Merge interests (existing + new from resume)
  const mergedInterests = Array.from(
    new Set([...currentProfile.interests, ...extracted.interests])
  );

  return {
    skills: mergedSkills,
    interests: mergedInterests,
    occupation: currentProfile.occupation || extracted.currentRole,
    location: currentProfile.location || extracted.location,
    website: currentProfile.website || extracted.portfolioUrl,
    githubUsername: currentProfile.githubUsername || extracted.githubUsername,
  };
}

/**
 * Generate profile improvement suggestions based on extracted data
 */
export function generateProfileSuggestions(
  extracted: ExtractedResumeData,
  currentProfile: {
    skills: string[];
    interests: string[];
    occupation: string | null;
    location: string | null;
    bio: string | null;
  }
): string[] {
  const suggestions: string[] = [];

  // Suggest adding missing skills from resume
  const newSkills = extracted.technicalSkills.filter(
    (skill) => !currentProfile.skills.includes(skill)
  );
  if (newSkills.length > 0) {
    suggestions.push(
      `Add ${newSkills.length} skills from your resume: ${newSkills.slice(0, 3).join(", ")}${newSkills.length > 3 ? "..." : ""}`
    );
  }

  // Suggest bio if missing
  if (!currentProfile.bio && extracted.currentRole) {
    suggestions.push(
      `Add a bio describing your experience as a ${extracted.currentRole}`
    );
  }

  // Suggest location if missing
  if (!currentProfile.location && extracted.location) {
    suggestions.push(`Add your location: ${extracted.location}`);
  }

  // Suggest occupation if missing
  if (!currentProfile.occupation && extracted.currentRole) {
    suggestions.push(`Set your occupation to: ${extracted.currentRole}`);
  }

  // General suggestions
  if (currentProfile.interests.length < 3) {
    suggestions.push("Add more interests to get better course recommendations");
  }

  return suggestions;
}
