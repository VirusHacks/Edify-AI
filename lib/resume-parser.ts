import mammoth from 'mammoth';
import { Buffer } from 'buffer';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParseResult {
  text: string;
  success: boolean;
  error?: string;
}

// Use the API key from environment (check multiple possible env var names for compatibility)
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                process.env.GOOGLE_GEMINI_API_KEY || 
                process.env.GOOGLE_AI_KEY || 
                process.env.GOOGLE_AI_API_KEY || 
                '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Parse PDF resume using Gemini Vision API
 */
export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Convert buffer to base64
    const base64Data = buffer.toString('base64');
    
    const prompt = `Extract all text content from this PDF resume. Return ONLY the text content, preserving the structure and formatting as much as possible. Do not add any commentary or explanations.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf',
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    return {
      text: text,
      success: true,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
  }
}

/**
 * Parse DOCX resume and extract text content
 */
export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      success: true,
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse DOCX',
    };
  }
}

/**
 * Parse resume file based on MIME type
 */
export async function parseResumeFile(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult> {
  if (mimeType === 'application/pdf') {
    return parsePDF(buffer);
  } else if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return parseDOCX(buffer);
  } else {
    return {
      text: '',
      success: false,
      error: `Unsupported file type: ${mimeType}`,
    };
  }
}

/**
 * Parse resume from File object
 */
export async function parseResume(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;
    
    return parseResumeFile(buffer, mimeType);
  } catch (error) {
    console.error('Error parsing resume file:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse resume file',
    };
  }
}

// Resume parsing logic improved

// Resume parsing logic improved
