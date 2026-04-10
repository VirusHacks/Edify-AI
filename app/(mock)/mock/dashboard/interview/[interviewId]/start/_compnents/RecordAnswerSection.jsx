"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Eye, Brain, Smile } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/configs/ai-models";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useFaceAnalysis } from "@/hooks/useFaceAnalysis";

function RecordAnswerSection({ activeQuestionIndex, mockInterViewQuestion, interviewData }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const recognitionRef = useRef(null);
  const finalTextRef = useRef(""); // Accumulated text across all sessions
  const sessionTextRef = useRef(""); // Text from current recognition session
  const isRecordingRef = useRef(false);
  const webcamRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const { user } = useKindeBrowserClient();

  // Face analysis hook
  const {
    isModelLoaded,
    isAnalyzing,
    currentMetrics,
    loadModels,
    startAnalysis,
    stopAnalysis,
    getAggregatedMetrics,
    clearHistory,
  } = useFaceAnalysis({ analysisInterval: 500 });

  // Load face analysis models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Sync ref with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Initialize native Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      console.error("Speech recognition not supported");
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      // Configure for better accuracy
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("✓ Speech recognition started");
        // Reset session text on new start - previous session text is already in finalTextRef
        sessionTextRef.current = "";
        setIsRecording(true);
        isRecordingRef.current = true;
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let sessionFinalTranscript = "";

        // Process all results - build complete transcript from all final results in THIS session
        // Each session starts fresh, so we process from index 0
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            sessionFinalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Update session text with all final results from this recognition session
        if (sessionFinalTranscript.trim()) {
          sessionTextRef.current = sessionFinalTranscript.trim();
          console.log("Session text updated:", sessionTextRef.current);

          // Update display: accumulated (from previous sessions) + current session
          const fullText = finalTextRef.current
            ? finalTextRef.current + " " + sessionTextRef.current
            : sessionTextRef.current;
          setUserAnswer(fullText);
        }

        // Show interim results for real-time feedback
        if (interimTranscript) {
          setInterimText(interimTranscript);
        } else {
          setInterimText("");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        switch (event.error) {
          case 'not-allowed':
            toast.error("Microphone permission denied. Please allow microphone access.");
            setIsRecording(false);
            isRecordingRef.current = false;
            break;
          case 'no-speech':
            // This is normal, don't stop - just continue listening
            console.log("No speech detected, continuing...");
            break;
          case 'audio-capture':
            toast.error("No microphone found. Please connect a microphone.");
            setIsRecording(false);
            isRecordingRef.current = false;
            break;
          case 'network':
            toast.error("Network error. Please check your internet connection.");
            setIsRecording(false);
            isRecordingRef.current = false;
            break;
          case 'aborted':
            // Normal when stopping manually
            console.log("Recognition aborted");
            break;
          default:
            console.warn("Speech recognition warning:", event.error);
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended, should restart:", isRecordingRef.current);
        console.log("Session text to accumulate:", sessionTextRef.current);

        // IMPORTANT: Accumulate session text into finalTextRef BEFORE restart
        // This preserves text when recognition auto-restarts
        if (sessionTextRef.current) {
          finalTextRef.current = finalTextRef.current
            ? finalTextRef.current + " " + sessionTextRef.current
            : sessionTextRef.current;
          console.log("Accumulated total text:", finalTextRef.current);
          // Clear session text as it's now accumulated
          sessionTextRef.current = "";
          // Update display with accumulated text
          setUserAnswer(finalTextRef.current);
        }

        // Clear any existing restart timeout
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }

        // Auto-restart if still supposed to be recording
        if (isRecordingRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                console.log("Restarting recognition... Total accumulated:", finalTextRef.current.length, "chars");
                recognitionRef.current.start();
              } catch (e) {
                // May already be started
                if (!e.message?.includes('already')) {
                  console.error("Error restarting:", e);
                }
              }
            }
          }, 100);
        }
      };

      recognition.onsoundstart = () => {
        console.log("Sound detected");
      };

      recognition.onspeechstart = () => {
        console.log("Speech detected");
      };

      recognitionRef.current = recognition;
      setIsInitialized(true);
      console.log("✓ Speech recognition initialized successfully");

    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      toast.error("Failed to initialize speech recognition");
      setIsInitialized(false);
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Reset state when question changes
  useEffect(() => {
    setUserAnswer("");
    setInterimText("");
    finalTextRef.current = "";
    sessionTextRef.current = "";

    if (isRecording && recognitionRef.current) {
      try {
        isRecordingRef.current = false;
        setIsRecording(false);
        recognitionRef.current.abort();
      } catch (error) {
        console.error("Error stopping on question change:", error);
      }
    }
  }, [activeQuestionIndex]);

  const handleStart = async () => {
    try {
      if (typeof window === 'undefined') {
        toast.error("Not available in this environment");
        return;
      }

      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("✓ Microphone permission granted");
      } catch (permError) {
        console.error("Microphone permission denied:", permError);
        toast.error("Microphone access is required. Please allow microphone access and try again.");
        return;
      }

      // Reset state
      setUserAnswer("");
      setInterimText("");
      finalTextRef.current = "";
      sessionTextRef.current = "";

      if (!isInitialized || !recognitionRef.current) {
        toast.error("Speech recognition is still initializing. Please wait a moment and try again.");
        return;
      }

      console.log("Starting recording...");

      // Set recording state
      setIsRecording(true);
      isRecordingRef.current = true;

      // Start face analysis if webcam is available
      if (isModelLoaded && webcamRef.current?.video) {
        clearHistory();
        startAnalysis(webcamRef.current.video);
        console.log("✓ Face analysis started");
      }

      // Start speech recognition
      try {
        recognitionRef.current.start();
        toast.success("Recording started. Speak clearly!");
      } catch (startError) {
        if (startError.message?.includes('already')) {
          console.log("Recognition already running");
        } else {
          throw startError;
        }
      }

    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(`Failed to start recording: ${error.message}`);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const handleStop = () => {
    try {
      console.log("Stopping recording...");

      // Clear restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }

      // Set flags first to prevent restart
      isRecordingRef.current = false;
      setIsRecording(false);

      // Stop face analysis
      stopAnalysis();

      // Stop recognition - this will trigger onend which accumulates session text
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setInterimText("");

      // Small delay to let final results and onend accumulation complete
      setTimeout(() => {
        // Combine any remaining session text with accumulated text
        let finalAnswer = finalTextRef.current;
        if (sessionTextRef.current) {
          finalAnswer = finalAnswer
            ? finalAnswer + " " + sessionTextRef.current
            : sessionTextRef.current;
          finalTextRef.current = finalAnswer;
          sessionTextRef.current = "";
        }
        finalAnswer = finalAnswer.trim();

        console.log("Final complete answer:", finalAnswer);
        console.log("Answer length:", finalAnswer.length, "characters");

        if (finalAnswer.length >= 10) {
          setUserAnswer(finalAnswer);
          saveAnswer(finalAnswer);
        } else if (finalAnswer.length > 0) {
          toast.warning("Answer too short. Please provide a more detailed response.");
        } else {
          toast.warning("No speech detected. Please try again and speak clearly into your microphone.");
        }
      }, 500);

    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const saveAnswer = async (answerText) => {
    const finalText = answerText || userAnswer.trim();
    if (loading) return;

    if (finalText.length < 10) {
      toast.warning("Answer too short, please try again.");
      return;
    }

    const currentQuestion = Array.isArray(mockInterViewQuestion)
      ? mockInterViewQuestion[activeQuestionIndex]
      : undefined;

    if (!currentQuestion) {
      toast.error("Error: Question data not available");
      return;
    }

    // Get aggregated face metrics
    const faceMetrics = getAggregatedMetrics();
    console.log("Face metrics:", faceMetrics);

    try {
      setLoading(true);

      const feedbackPrompt = `Question: ${currentQuestion.question}\nUser Answer: ${finalText}\nProvide JSON only: {"rating": <1-10>, "feedback": "3-5 lines of improvements"}`;
      const result = await chatSession.sendMessage(feedbackPrompt);
      const mockJsonResp = result.response.text().replace("```json", "").replace("```", "");

      let JsonFeedbackResp;
      try {
        JsonFeedbackResp = JSON.parse(mockJsonResp);
      } catch {
        JsonFeedbackResp = { rating: "", feedback: mockJsonResp };
      }

      const apiResponse = await fetch(`/api/mock-interview/${interviewData?.mockId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          correctAns: currentQuestion.answer,
          userAns: finalText,
          feedback: JsonFeedbackResp?.feedback,
          rating: JsonFeedbackResp?.rating,
          eyeContactScore: faceMetrics?.eyeContactPercentage || null,
          engagementScore: faceMetrics?.engagementScore || null,
          confidenceScore: faceMetrics?.avgConfidence || null,
          dominantExpression: faceMetrics?.dominantExpression || null,
          bodyLanguageMetrics: faceMetrics || null,
        }),
      });

      const apiResult = await apiResponse.json();

      if (apiResult.success) {
        toast.success("Answer saved successfully!");
        setUserAnswer("");
        finalTextRef.current = "";
        sessionTextRef.current = "";
        clearHistory();
      } else {
        throw new Error(apiResult.error || 'Failed to save answer');
      }
    } catch (e) {
      console.error("Error saving user answer:", e);
      toast.error("Error saving your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border shadow-sm p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#E4E4E7" }}>Your Response</h3>

      <div className="relative mb-4">
        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: "#27272A" }}>
          <Image
            src="/webcam.png"
            width={200}
            height={200}
            className="absolute inset-0 m-auto z-0 opacity-20"
            alt="Webcam overlay"
          />
          <Webcam
            ref={webcamRef}
            mirrored={true}
            className="w-full h-64 object-cover rounded-2xl"
            style={{ zIndex: 10 }}
          />
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Recording
            </div>
          )}
          {isModelLoaded && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: isAnalyzing ? "#22C55E" : "#27272A", color: "#FFFFFF" }}>
              <Brain className="w-3 h-3" />
              {isAnalyzing ? "Analyzing" : "Ready"}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Face Metrics */}
      {isRecording && currentMetrics && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#27272A" }}>
            <Eye className="w-4 h-4 mx-auto mb-1" style={{ color: currentMetrics.eyeContact ? "#22C55E" : "#EF4444" }} />
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Eye Contact</p>
            <p className="text-sm font-medium" style={{ color: currentMetrics.eyeContact ? "#22C55E" : "#EF4444" }}>
              {currentMetrics.eyeContact ? "Good" : "Look at camera"}
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#27272A" }}>
            <Smile className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Expression</p>
            <p className="text-sm font-medium capitalize" style={{ color: "#E4E4E7" }}>
              {currentMetrics.expressions ? Object.entries(currentMetrics.expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'neutral'}
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "#27272A" }}>
            <Brain className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Confidence</p>
            <p className="text-sm font-medium" style={{ color: "#E4E4E7" }}>
              {Math.round((currentMetrics.confidence || 0) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Live transcript preview */}
      <div className="rounded-xl p-3 text-sm mb-4 min-h-16" style={{ backgroundColor: "#27272A", color: "#E4E4E7" }}>
        {userAnswer || interimText || "Your speech will appear here..."}
        {interimText && userAnswer && (
          <span className="italic ml-1" style={{ color: "#A1A1AA" }}>{interimText}</span>
        )}
        {isRecording && !userAnswer && !interimText && (
          <span className="italic" style={{ color: "#A1A1AA" }}> (listening...)</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <Button
            disabled={loading || !isInitialized}
            onClick={handleStart}
            className="px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
          >
            <Mic className="w-5 h-5 mr-2" /> {isInitialized ? "Start Recording" : "Initializing..."}
          </Button>
        ) : (
          <Button
            disabled={loading}
            onClick={handleStop}
            className="px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
          >
            <StopCircle className="w-5 h-5 mr-2" /> Stop Recording
          </Button>
        )}
      </div>

      {loading && (
        <div className="mt-3 text-center text-sm" style={{ color: "#A1A1AA" }}>
          Processing your answer...
        </div>
      )}

      <div className="mt-4 text-xs text-center" style={{ color: "#A1A1AA" }}>
        💡 Tip: Speak clearly and at a normal pace. Click Stop when finished.
        {isModelLoaded && " Your body language is being analyzed."}
      </div>
    </div>
  );
}

export default RecordAnswerSection;
