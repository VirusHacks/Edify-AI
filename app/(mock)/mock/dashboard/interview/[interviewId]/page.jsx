"use client";
import { Button } from "@/components/ui/button";
import { Lightbulb, WebcamIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import PageContainer from "@/components/layout/PageContainer";

function Interview({ params }) {
  const [interviewData, setInterviewData] = useState();
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  useEffect(() => {
    GetInterviewDetail();
  }, []);

  /**
   * Used to Get Interview Details by MockId/Interview Id
   */

  const GetInterviewDetail = async () => {
    try {
      const response = await fetch(`/api/mock-interview/${params.interviewId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setInterviewData(result.data);
      } else {
        console.error("Failed to fetch interview:", result.error);
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
    }
  };
  return (
    <div className="my-10 min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-8 md:py-12 max-w-screen-xl">
        <h2 className="font-bold text-2xl mb-8" style={{ color: "#E4E4E7" }}>Let&apos;s Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="flex flex-col my-5 gap-5">
            <div className="flex flex-col p-6 rounded-2xl border gap-5" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <h2 className="text-base" style={{ color: "#E4E4E7" }}>
                <strong style={{ color: "#3B82F6" }}>Job Role/Job Position:</strong> <span style={{ color: "#A1A1AA" }}>{interviewData?.jobPosition}</span>
              </h2>
              <h2 className="text-base" style={{ color: "#E4E4E7" }}>
                <strong style={{ color: "#3B82F6" }}>Job Description:</strong> <span style={{ color: "#A1A1AA" }}>{interviewData?.jobDesc}</span>
              </h2>
              <h2 className="text-base" style={{ color: "#E4E4E7" }}>
                <strong style={{ color: "#3B82F6" }}>Years of Experience:</strong> <span style={{ color: "#A1A1AA" }}>{interviewData?.jobExperience}</span>
              </h2>
            </div>
            <div className="p-5 border rounded-2xl" style={{ borderColor: "#F59E0B", backgroundColor: "#27272A" }}>
              <h2 className="flex gap-2 items-center mb-3" style={{ color: "#F59E0B" }}><Lightbulb /> <strong>Information</strong> </h2>
              <h2 className="mt-3 text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{process.env.NEXT_PUBLIC_INFORMATION}</h2>
            </div>
          </div>
          <div>
            {webCamEnabled ? (
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#27272A" }}>
                <Webcam
                  mirrored={true}
                  style={{ height: 300, width: "100%" }}
                  onUserMedia={() => setWebCamEnabled(true)}
                  onUserMediaError={() => setWebCamEnabled(false)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="h-72 w-full rounded-2xl border flex items-center justify-center" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                  <WebcamIcon className="h-20 w-20" style={{ color: "#A1A1AA" }} />
                </div>
                <Button variant="outline" onClick={() => setWebCamEnabled(true)} className="rounded-xl transition-all duration-200 hover:opacity-90" style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}>
                  Enable Web Cam and Microphone
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end items-end mt-8">
          <Link href={`/mock/dashboard/interview/${params.interviewId}/start`}>
            <Button className="rounded-xl font-medium transition-all duration-200 hover:opacity-90" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>Start Interview</Button>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}

export default Interview;
