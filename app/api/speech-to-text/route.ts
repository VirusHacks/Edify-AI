import { NextRequest, NextResponse } from "next/server";
import { BaseEnvironment } from "@/configs/BaseEnvironment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const env = new BaseEnvironment();
    // Try to get Speech-to-Text API key from env, fallback to Gemini key for testing
    const apiKey = process.env.GOOGLE_SPEECH_TO_TEXT_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SPEECH_TO_TEXT_API_KEY || env.GOOGLE_GEMENI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Speech-to-Text API key not configured. Please set GOOGLE_SPEECH_TO_TEXT_API_KEY" },
        { status: 500 }
      );
    }
    
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    
    // Using Google Cloud Speech-to-Text REST API
    // Note: This requires Google Cloud Speech-to-Text API to be enabled
    // and proper API key or OAuth credentials
    const speechApiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    
    // Detect encoding from file type
    // Google Speech-to-Text supports: LINEAR16, FLAC, MULAW, AMR, AMR_WB, OGG_OPUS, SPEEX_WITH_HEADER_BYTE, WEBM_OPUS
    let encoding = "WEBM_OPUS";
    let sampleRate = 48000; // WebM Opus typically uses 48kHz
    
    if (audioFile.type.includes("mp4") || audioFile.type.includes("m4a")) {
      encoding = "MP4";
      sampleRate = 44100;
    } else if (audioFile.type.includes("flac")) {
      encoding = "FLAC";
      sampleRate = 44100;
    } else if (audioFile.type.includes("wav")) {
      encoding = "LINEAR16";
      sampleRate = 16000;
    } else if (audioFile.type.includes("webm")) {
      encoding = "WEBM_OPUS";
      sampleRate = 48000;
    }

    const requestBody = {
      config: {
        encoding: encoding as any,
        sampleRateHertz: sampleRate,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: "default", // or "phone_call", "command_and_search", etc.
      },
      audio: {
        content: audioBase64,
      },
    };
    
    console.log("Sending audio to Speech-to-Text:", {
      type: audioFile.type,
      size: audioFile.size,
      encoding,
      sampleRate,
    });

    const response = await fetch(speechApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error("Speech-to-Text API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      // Provide helpful error messages
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { 
            error: "Authentication failed. Please check your Google Cloud Speech-to-Text API key and ensure the API is enabled.",
            details: errorData.message || errorData.error?.message || "Invalid credentials"
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Speech-to-Text API failed", 
          details: errorData.message || errorData.error?.message || errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Speech-to-Text response:", JSON.stringify(data, null, 2));
    
    // Extract transcript from response
    const transcript = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join(" ")
      .trim() || "";

    if (!transcript) {
      console.warn("No transcript found in response:", data);
      return NextResponse.json(
        { error: "No transcript returned. Audio may be too short or unclear.", details: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("Speech-to-Text error:", error);
    return NextResponse.json(
      { error: "Failed to process speech", details: error.message },
      { status: 500 }
    );
  }
}

