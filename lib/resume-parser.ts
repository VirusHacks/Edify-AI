/**
 * @file resume-parser.ts
 * @description Core utility for parsing various resume formats (PDF, DOCX) using Gemini AI and Mammoth.
 */

import mammoth from 'mammoth';
import { Buffer } from 'buffer';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Result structure for the parsing process
 */
export interface ParseResult {
  text: string;
  success: boolean;
  error?: string;
}

// API Configuration for Gemini
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                process.env.GEMINI_API_KEY || 
                process.env.GOOGLE_GEMINI_API_KEY || 
                process.env.GOOGLE_AI_KEY || 
                process.env.GOOGLE_AI_API_KEY || 
                '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Parses a PDF resume by converting it to base64 and sending it to Gemini Vision.
 * @param buffer The raw binary data of the PDF file.
 * @returns A promise resolving to the parsed text and success status.
 */
export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Convert buffer to base64 for vision processing
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
    console.error('[ResumeParser] Error parsing PDF:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
  }
}

/**
 * Extracts raw text from a DOCX file using mammoth.
 * @param buffer The binary data of the DOCX file.
 * @returns A promise resolving to the extracted text.
 */
export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      success: true,
    };
  } catch (error) {
    console.error('[ResumeParser] Error parsing DOCX:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse DOCX',
    };
  }
}

/**
 * Orchestrates resume parsing based on the detected MIME type.
 * Supports PDF and DOCX.
 * @param buffer Binary file content.
 * @param mimeType Specified MIME type of the file.
 * @returns ParseResult with extracted text.
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
 * High-level API for parsing a File object from the browser.
 * @param file The File object from an input element or drag-and-drop.
 */
export async function parseResume(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;
    
    return parseResumeFile(buffer, mimeType);
  } catch (error) {
    console.error('[ResumeParser] Error processing file:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process resume file',
    };
  }
}
