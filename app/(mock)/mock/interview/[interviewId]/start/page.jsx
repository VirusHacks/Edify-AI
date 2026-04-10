"use client";  // Ensure this is client-side

import React, { useEffect, useState } from "react";
import QuestionsSections from "./_compnents/QuestionsSections";
import RecordAnswerSection from "./_compnents/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Import `usePathname` from next/navigation for routing in `app` directory
import { usePathname } from "next/navigation";

function StartInterview({ params }) {
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Use the `usePathname` hook to get the current path
  const pathname = usePathname();

  useEffect(() => {
    GetInterviewDetail();
  }, []);

  const GetInterviewDetail = async () => {
    try {
      const response = await fetch(`/api/mock-interview/${params.interviewId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const jsonMockResp = JSON.parse(result.data?.jsonMockResp || "[]");
        setMockInterviewQuestion(jsonMockResp);
        setInterviewData(result.data);
      } else {
        console.error("Failed to fetch interview:", result.error);
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
    }
  };

  // Post message to the parent app after the path is determined
  useEffect(() => {
    if (pathname) {
      window.parent.postMessage(
        {
          action: "navigate",
          url: `https://gen-ed-jldi.vercel.app/${pathname}`,
        },
        "*"
      );
    }
  }, [pathname]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Questions */}
        <QuestionsSections
          activeQuestionIndex={activeQuestionIndex}
          mockInterViewQuestion={mockInterviewQuestion}
        />
        {/* Video/ Audio Recording */}
        <RecordAnswerSection
          activeQuestionIndex={activeQuestionIndex}
          mockInterViewQuestion={mockInterviewQuestion}
          interviewData={interviewData}
        />
      </div>

      <div className="flex justify-end gap-6">
        {activeQuestionIndex > 0 && <Button disabled={activeQuestionIndex == 0} onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}>Previous Question</Button>}

        {activeQuestionIndex !== mockInterviewQuestion?.length - 1 && <Button onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}>Next Question</Button>}

        {activeQuestionIndex == mockInterviewQuestion?.length - 1 && (
          <Link href={`/dashboard/interview/${interviewData?.mockId}/feedback`}>
            <Button>End Interview</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default StartInterview;
