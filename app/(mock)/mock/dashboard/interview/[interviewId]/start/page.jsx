"use client"; // Ensure this is client-side

import React, { useEffect, useState } from "react";
import QuestionsSections from "./_compnents/QuestionsSections";
import RecordAnswerSection from "./_compnents/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";

// Import `usePathname` from next/navigation for routing in `app` directory
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";

function StartInterview({ params }) {
  const [interviewData, setInterviewData] = useState(null);
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Use the `usePathname` hook to get the current path
  const pathname = usePathname();

  useEffect(() => {
    if (params?.interviewId) {
      GetInterviewDetail();
    }
  }, [params?.interviewId]); // Ensure it runs only when interviewId changes

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up any resources when component unmounts
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const GetInterviewDetail = async () => {
    try {
      const response = await fetch(`/api/mock-interview/${params.interviewId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const raw = result.data?.jsonMockResp || "[]";
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = []; }
        // Normalize to an array of { question, answer }
        const questions = Array.isArray(parsed)
          ? parsed
          : (parsed?.interviewQuestions || []);

        setMockInterviewQuestion(questions);
        setInterviewData(result.data);
      } else {
        console.warn("No interview data found for ID:", params.interviewId);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
      // You might want to show an error message to the user here
    }
  };

  // Post message to the parent app after the path is determined
  useEffect(() => {
    if (pathname) {
      window.parent.postMessage(
        {
          action: "navigate",
          url: `https://gen-ed-jldi.vercel.app${pathname}`,
        },
        "*"
      );
    }
  }, [pathname]);

  // Don't render until we have the necessary data
  if (!mockInterviewQuestion || !interviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#3B82F6" }}>
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Loading Interview</h3>
          <p style={{ color: "#A1A1AA" }}>Preparing your questions...</p>
        </div>
      </div>
    );
  }

  const total = mockInterviewQuestion.length || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-8 md:py-12 max-w-screen-xl">
        {/* Header */}
        <div className="rounded-2xl border p-6 mb-8 shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: "#E4E4E7" }}>{interviewData.jobPosition}</h1>
              <p style={{ color: "#A1A1AA" }}>Mock Interview Session</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="text-sm mb-1" style={{ color: "#A1A1AA" }}>
                Question {activeQuestionIndex + 1} of {total}
              </div>
              <div className="w-full md:w-32 h-2 rounded-full" style={{ backgroundColor: "#27272A" }}>
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${total ? ((activeQuestionIndex + 1) / total) * 100 : 0}%`,
                    backgroundColor: "#3B82F6"
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <QuestionsSections
            activeQuestionIndex={activeQuestionIndex}
            mockInterViewQuestion={mockInterviewQuestion}
          />
          <RecordAnswerSection
            activeQuestionIndex={activeQuestionIndex}
            mockInterViewQuestion={mockInterviewQuestion}
            interviewData={interviewData}
          />
        </div>

        {/* Navigation */}
        <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="flex justify-between items-center">
            <div>
              {activeQuestionIndex > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                  className="rounded-xl transition-all duration-200 hover:opacity-90"
                  style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
                >
                  Previous Question
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              {total && activeQuestionIndex < total - 1 && (
                  <Button 
                    onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                    className="rounded-xl font-medium transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                  >
                    Next Question
                  </Button>
                )}

              {total && activeQuestionIndex === total - 1 && (
                  <Link href={`/mock/dashboard/interview/${interviewData?.mockId}/feedback`}>
                    <Button className="rounded-xl font-medium transition-all duration-200 hover:opacity-90" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>
                      Complete Interview
                    </Button>
                  </Link>
                )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default StartInterview;
