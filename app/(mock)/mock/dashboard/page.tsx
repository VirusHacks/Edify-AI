"use client";

import React, { Suspense } from "react";
import AddNewInterview from "./_components/AddNewInterview";
import Interviewlist from "./_components/Interviewlist";
import PageContainer from "@/components/layout/PageContainer";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Target, LoaderCircle } from "lucide-react";

function Dashboard() {
  const { user } = useKindeBrowserClient();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Header Section */}
      <PageContainer className="py-8 md:py-12 max-w-screen-xl">
        <div className="relative overflow-hidden rounded-2xl border p-8 mb-8" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                    <Target className="w-6 h-6" style={{ color: "#3B82F6" }} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
                    Interview Prep, {user?.given_name || "Candidate"}!
                  </h1>
                </div>
                
                <p className="text-lg md:text-xl mb-6 leading-relaxed" style={{ color: "#A1A1AA" }}>
                  Practice with AI-powered mock interviews and boost your confidence for real interviews.
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#A1A1AA" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>AI-Generated Questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>Real-time Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>Performance Analytics</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 md:ml-8 flex items-center gap-4 w-full md:w-auto">
                <Suspense fallback={<div className="flex items-center justify-center w-64 h-32"><LoaderCircle className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} /></div>}>
                  <AddNewInterview />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Interview History Section */}
      <PageContainer className="space-y-8 max-w-screen-xl">
        <div>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#E4E4E7" }}>Your Interview History</h2>
            <p style={{ color: "#A1A1AA" }}>Review your past interviews and track your progress</p>
          </div>
          
          <Interviewlist />
        </div>
      </PageContainer>
    </div>
  );
}

export default Dashboard;
