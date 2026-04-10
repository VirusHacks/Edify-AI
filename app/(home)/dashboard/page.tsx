"use client"
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import AddResume from "../_components/AddResume";
// import ResumeList from "../_components/ResumeList";
import AddATSAnalysis from "../_components/AddATSAnalysis";
import ATSReportsList from "../_components/ATSReportsList";
import TrackedJobsList from "../_components/TrackedJobsList";
import TrashListBox from "../_components/TrashListBox";
import PageContainer from "@/components/layout/PageContainer";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { FileText, Sparkles, MessageCircle, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Page = () => {
  const { user } = useKindeBrowserClient();
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-4 sm:py-6 md:py-8 lg:py-12 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12 max-w-screen-xl">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header Section */}
        <Card className="rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
              <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0" style={{ backgroundColor: "#27272A" }}>
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#3B82F6" }} />
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
                    Welcome back, {user?.given_name || "Professional"}!
                  </h1>
                </div>
                
                <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: "#A1A1AA" }}>
                  Create stunning, AI-powered resumes that help you stand out from the crowd.
                </p>
                
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>AI-Enhanced Content</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>Professional Templates</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>Export Ready</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col items-stretch sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Link href="/chat" className="flex-1 sm:flex-initial">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="rounded-xl px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-medium transition-all duration-200 hover:opacity-90 w-full sm:w-auto"
                      style={{ 
                        borderColor: "#27272A",
                        backgroundColor: "#27272A",
                        color: "#E4E4E7"
                      }}
                    >
                      <MessageCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Chat Assistant</span>
                      <span className="sm:hidden">Chat</span>
                    </Button>
                  </Link>
                  <Link href="/ats" className="flex-1 sm:flex-initial">
                    <Button 
                      size="lg" 
                      className="rounded-xl px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-sm sm:text-base font-medium transition-all duration-200 hover:opacity-90 w-full sm:w-auto"
                      style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                    >
                      <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Improve ATS Score</span>
                      <span className="sm:hidden">ATS</span>
                    </Button>
                  </Link>
                </div>
                <div className="w-full sm:w-auto">
                  <TrashListBox />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume Section - Hidden */}
        {/* <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Your Resumes</h2>
            <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>Create and manage your professional resumes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <AddResume />
            <ResumeList />
          </div>
        </div> */}

        {/* ATS Reports Section */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Your ATS Reports</h2>
            <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>View and manage your resume analysis reports</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <AddATSAnalysis />
            <ATSReportsList />
          </div>
        </div>

        {/* Track Your Internship/Jobs Section */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: "#27272A" }}>
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#3B82F6" }} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Track Your Internship</h2>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
              Jobs you&apos;ve tracked from job application pages. Use the extension to add jobs while browsing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <TrackedJobsList />
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default Page;
