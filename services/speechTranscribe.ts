interface SpeechTranscribeInput {
  audioBase64: string; // raw base64 or data URL
  mimeType?: string; // e.g. audio/wav, audio/mpeg
  languageCode?: string; // e.g. en-US
  enablePunctuation?: boolean;
  testMode?: boolean;
}

interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

interface SpeechTranscribeOutput {
  segments: TranscriptSegment[];
  fullText: string;
  usedAI: boolean;
  languageCode?: string;
}

function isTestMode(i?: SpeechTranscribeInput) {
  return i?.testMode || process.env.NODE_ENV === 'test';
}

function extractPureBase64(data: string) {
  const commaIndex = data.indexOf(',');
  if (commaIndex !== -1) return data.slice(commaIndex + 1).trim();
  return data.trim();
}

function validateSize(base64: string) {
  const approxBytes = (base64.length * 3) / 4;
  return approxBytes <= 10 * 1024 * 1024; // 10MB max
}

export async function speechTranscribe(input: SpeechTranscribeInput): Promise<SpeechTranscribeOutput> {
  if (!input?.audioBase64) {
    return { segments: [], fullText: 'No audio provided', usedAI: false };
  }

  const pure = extractPureBase64(input.audioBase64);
  if (!validateSize(pure)) {
    return {
      segments: [
        { startSec: 0, endSec: 0, text: 'ERROR: audio too large (max 10MB base64)' },
      ],
      fullText: 'ERROR: audio too large (max 10MB base64)',
      usedAI: false,
    };
  }

  if (isTestMode(input)) {
    const segments = [
      { startSec: 0, endSec: 2.5, text: 'Hello there this is a stub transcript.' },
      { startSec: 2.5, endSec: 5.0, text: 'It simulates speech recognition output.' },
    ];
    return {
      segments,
      fullText: segments.map(s => s.text).join(' '),
      usedAI: false,
      languageCode: input.languageCode || 'en-US',
    };
  }

  // Real integration placeholder: requires Google Cloud Speech client
  // We intentionally avoid adding heavy dependency here. If env vars missing, return diagnostic.
  const hasCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GOOGLE_CLOUD_PROJECT;
  if (!hasCreds) {
    return {
      segments: [
        { startSec: 0, endSec: 0, text: 'ERROR: Missing Google Cloud Speech credentials' },
      ],
      fullText: 'ERROR: Missing Google Cloud Speech credentials',
      usedAI: false,
      languageCode: input.languageCode || 'en-US',
    };
  }

  // Placeholder passthrough: In a full implementation we would decode audio, send to Speech-to-Text API.
  // Provide a minimal optimistic response until dependency added.
  return {
    segments: [
      { startSec: 0, endSec: 3, text: 'Transcription integration pending implementation.' },
    ],
    fullText: 'Transcription integration pending implementation.',
    usedAI: false,
    languageCode: input.languageCode || 'en-US',
  };
}

export type { SpeechTranscribeInput, SpeechTranscribeOutput };