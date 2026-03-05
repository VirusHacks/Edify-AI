import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 0.7, // Reduced for more consistent responses
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 4096, // Reduced to avoid token limits
  responseMimeType: "application/json",
};

export const AIChatSession = model?.startChat({
  generationConfig,
  history: [],
});

// Helper function to check if AI is available
export const isAIAvailable = () => {
  return !!apiKey && !!AIChatSession;
};

/**
 * Google AI Model class for generating content
 */
export class GoogleAIModel {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Gemini API key is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  async generateContent(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}