"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TopSection from "./common/TopSection";
import ResumeForm from "./ResumeForm";
import ResumePreview from "./ResumePreview";
import PageContainer from "@/components/layout/PageContainer";
import OptimizeResumeButton from "./OptimizeResumeButton";

const EditResume = () => {
  const [showOptimization, setShowOptimization] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-4 sm:py-6 md:py-8 max-w-screen-xl">
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

        <TopSection />
        <div className="mt-4 sm:mt-6 md:mt-8">
          {/* Optimization Panel - shown when optimizing */}
          {showOptimization && (
            <div className="mb-4 sm:mb-6 md:mb-8">
              <OptimizeResumeButton />
            </div>
          )}
          
          <div className="flex flex-col xl:flex-row items-start gap-4 sm:gap-6 md:gap-8">
            {/* Form Section */}
            <div className="flex-1 w-full">
              <ResumeForm />
            </div>
            {/* Preview Section */}
            <div className="flex-1 w-full xl:sticky xl:top-4 xl:self-start">
              <ResumePreview />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default EditResume;
