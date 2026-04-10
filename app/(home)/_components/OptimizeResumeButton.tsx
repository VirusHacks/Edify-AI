"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useResumeContext } from "@/context/resume-info-provider";
import { toast } from "@/hooks/use-toast";
import OptimizationComparison from "./OptimizationComparison";
import useUpdateDocument from "@/features/document/use-update-document";

const OptimizeResumeButton: React.FC = () => {
  const { resumeInfo, onUpdate } = useResumeContext();
  const { mutateAsync } = useUpdateDocument();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Get job description from resume context (stored in step 0)
  const jobDescription = (resumeInfo as any)?.jobDescription || "";

  const handleOptimize = async () => {
    if (!jobDescription || !jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please add a job description in step 1 to optimize your resume.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    setIsLoadingResume(true);
    try {
      // Fetch resume text from user profile
      const resumeResponse = await fetch("/api/user/resume?fullText=true");
      const resumeData = await resumeResponse.json();

      if (!resumeData.success || !resumeData.resumeText) {
        // Fallback: try to build from resumeInfo if profile doesn't have resume
        const fallbackText = buildResumeText(resumeInfo);
        if (!fallbackText || !fallbackText.trim()) {
          throw new Error(
            "No resume found in your profile. Please upload a resume to your profile first."
          );
        }
        
        // Use fallback text
        const response = await fetch("/api/optimizeResume", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText: fallbackText,
            jobDescription,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Optimization failed");
        }

        setOptimizationResult({
          optimization: data.data.optimization,
          resumeStructured: data.data.resumeStructured,
          original: data.data.original,
        });
        setShowComparison(true);
        toast({
          title: "Optimization Complete",
          description: "Review the optimized sections below.",
        });
        return;
      }

      // Use resume text from profile
      const resumeText = resumeData.resumeText;

      // Call optimization API
      const response = await fetch("/api/optimizeResume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Optimization failed");
      }

      setOptimizationResult({
        optimization: data.data.optimization,
        resumeStructured: data.data.resumeStructured,
        original: data.data.original,
      });
      setShowComparison(true);
      toast({
        title: "Optimization Complete",
        description: "Review the optimized sections below.",
      });
    } catch (error) {
      console.error("Optimization error:", error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
      setIsLoadingResume(false);
    }
  };

  const handleApply = async (acceptedSections: Record<string, any>) => {
    try {
      // Update resume with accepted sections
      if (resumeInfo) {
        const updatedResume = { ...resumeInfo };

        if (acceptedSections.summary) {
          updatedResume.summary = acceptedSections.summary;
        }

        if (acceptedSections.skills) {
          // Parse skills if needed
          updatedResume.skills = parseSkills(acceptedSections.skills);
        }

        // Update experience, projects, education similarly
        // This is a simplified version - you may need to parse the content properly

        onUpdate(updatedResume);

        // Save to database
        await mutateAsync({
          summary: acceptedSections.summary || resumeInfo.summary,
          // Add other fields as needed
        });

        toast({
          title: "Success",
          description: "Optimized sections applied to your resume.",
        });

        setShowComparison(false);
        setOptimizationResult(null);
      }
    } catch (error) {
      console.error("Apply error:", error);
      toast({
        title: "Error",
        description: "Failed to apply optimizations",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setShowComparison(false);
    setOptimizationResult(null);
  };

  return (
    <>
      <Button
        onClick={handleOptimize}
        disabled={isOptimizing || isLoadingResume || !jobDescription?.trim()}
        className="rounded-xl px-4"
        style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
      >
        {isOptimizing || isLoadingResume ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isLoadingResume ? "Loading Resume..." : "Optimizing..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Optimize for Job
          </>
        )}
      </Button>
      
      {showComparison && optimizationResult && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <div className="w-full min-h-full">
            <OptimizationComparison
              optimizationResult={optimizationResult.optimization}
              resumeStructured={optimizationResult.resumeStructured}
              originalData={optimizationResult.original}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to build resume text from resume data
function buildResumeText(resumeInfo: any): string {
  if (!resumeInfo) return "";

  let text = "";

  // Add summary
  if (resumeInfo.summary) {
    text += `SUMMARY\n${resumeInfo.summary}\n\n`;
  }

  // Add personal info
  if (resumeInfo.personalInfo) {
    const pi = resumeInfo.personalInfo;
    text += `CONTACT\n`;
    if (pi.firstName || pi.lastName) {
      text += `${pi.firstName || ""} ${pi.lastName || ""}\n`;
    }
    if (pi.email) text += `Email: ${pi.email}\n`;
    if (pi.phone) text += `Phone: ${pi.phone}\n`;
    text += `\n`;
  }

  // Add experience
  if (resumeInfo.experiences && resumeInfo.experiences.length > 0) {
    text += `EXPERIENCE\n`;
    resumeInfo.experiences.forEach((exp: any) => {
      text += `${exp.title || ""} at ${exp.companyName || ""}\n`;
      if (exp.workSummary) text += `${exp.workSummary}\n`;
      text += `\n`;
    });
  }

  // Add education
  if (resumeInfo.educations && resumeInfo.educations.length > 0) {
    text += `EDUCATION\n`;
    resumeInfo.educations.forEach((edu: any) => {
      text += `${edu.degree || ""} - ${edu.institution || ""}\n`;
      text += `\n`;
    });
  }

  // Add skills
  if (resumeInfo.skills && resumeInfo.skills.length > 0) {
    text += `SKILLS\n`;
    const skillNames = resumeInfo.skills.map((s: any) => 
      typeof s === "string" ? s : s.name || s.skill
    ).filter(Boolean);
    text += skillNames.join(", ") + "\n";
  }

  return text;
}

// Helper function to parse skills from text
function parseSkills(skillsText: string): any[] {
  // Simple parsing - split by comma and create skill objects
  return skillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export default OptimizeResumeButton;

