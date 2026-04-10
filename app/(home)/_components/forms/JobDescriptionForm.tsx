"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResumeContext } from "@/context/resume-info-provider";
import { FileText, Sparkles, Zap, Target, CheckCircle2, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import OptimizeResumeButton from "../OptimizeResumeButton";
import { Card, CardContent } from "@/components/ui/card";

interface JobDescriptionFormProps {
  handleNext?: () => void;
  onJobDescriptionChange?: (jobDescription: string) => void;
  initialValue?: string;
}

const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({ 
  handleNext,
  onJobDescriptionChange,
  initialValue 
}) => {
  const { resumeInfo, onUpdate } = useResumeContext();
  const [jobDescription, setJobDescription] = React.useState(
    initialValue || ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJobDescription(value);
    
    // Update context
    if (resumeInfo && onUpdate) {
      onUpdate({
        ...resumeInfo,
        jobDescription: value,
      } as any);
    }
    
    // Call external handler if provided
    if (onJobDescriptionChange) {
      onJobDescriptionChange(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleNext) {
      handleNext();
    }
  };

  const hasJobDescription = jobDescription.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feature Highlight Section */}
      <Card className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#1E1E1E", borderColor: "#3B82F6" }}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Sparkles className="w-6 h-6" style={{ color: "#3B82F6" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                <span>AI-Powered Resume Auto-Generation</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>
                  NEW
                </span>
              </h3>
              <p className="text-sm mb-4" style={{ color: "#A1A1AA" }}>
                Paste a job description below and our AI will automatically optimize your entire resume to match the role. 
                We&apos;ll enhance your summary, experience, skills, and more to maximize your chances of getting hired.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: "#A1A1AA" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                  <span>Auto-match keywords</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#A1A1AA" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                  <span>Optimize all sections</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#A1A1AA" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22C55E" }} />
                  <span>ATS-friendly format</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Input Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#27272A" }}>
              <FileText className="w-5 h-5" style={{ color: "#3B82F6" }} />
            </div>
            <Label htmlFor="jobDescription" className="text-lg font-semibold" style={{ color: "#E4E4E7" }}>
              Job Description
            </Label>
          </div>
          {hasJobDescription && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ backgroundColor: "#27272A" }}>
              <Target className="w-4 h-4" style={{ color: "#22C55E" }} />
              <span className="text-xs font-medium" style={{ color: "#22C55E" }}>
                Ready to Optimize
              </span>
            </div>
          )}
        </div>

        <p className="text-sm" style={{ color: "#A1A1AA" }}>
          Copy and paste the complete job posting from LinkedIn, Indeed, or any job board. 
          The more details you provide, the better our AI can tailor your resume.
        </p>

        <Textarea
          id="jobDescription"
          placeholder="Example: Software Engineer at Google...&#10;&#10;Responsibilities:&#10;- Develop scalable web applications&#10;- Collaborate with cross-functional teams&#10;&#10;Requirements:&#10;- 3+ years of experience in React&#10;- Strong problem-solving skills..."
          value={jobDescription}
          onChange={handleChange}
          rows={14}
          className="resize-none text-sm leading-relaxed"
          style={{
            backgroundColor: "#27272A",
            borderColor: hasJobDescription ? "#3B82F6" : "#3F3F46",
            color: "#E4E4E7",
            transition: "border-color 0.2s",
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "#A1A1AA" }}>
            {jobDescription.length} characters
            {jobDescription.length > 500 && (
              <span className="ml-2" style={{ color: "#22C55E" }}>✓ Good length</span>
            )}
          </p>
          {!hasJobDescription && (
            <p className="text-xs italic" style={{ color: "#6B7280" }}>
              Optional - You can skip this step
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="space-y-4 pt-4 border-t" style={{ borderColor: "#27272A" }}>
        {/* Optimize Button - Prominent when job description is provided */}
        {hasJobDescription && (
          <Card className="rounded-xl border overflow-hidden" style={{ 
            backgroundColor: "rgba(59, 130, 246, 0.1)", 
            borderColor: "#3B82F6" 
          }}>
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
                    <Zap className="w-5 h-5" style={{ color: "#FBBF24" }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold mb-1" style={{ color: "#E4E4E7" }}>
                      Auto-Generate Optimized Resume
                    </h4>
                    <p className="text-sm mb-4" style={{ color: "#A1A1AA" }}>
                      Our AI will analyze the job description and automatically optimize your resume sections 
                      (summary, experience, skills) to match the role perfectly.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <OptimizeResumeButton />
                      </div>
                      <div className="flex-1 text-xs leading-relaxed" style={{ color: "#A1A1AA" }}>
                        <span className="font-medium" style={{ color: "#E4E4E7" }}>What happens next:</span> 
                        {" "}You&apos;ll see a side-by-side comparison of your original resume vs. the AI-optimized version. 
                        Review and accept the changes you like.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue/Skip Button */}
        {handleNext && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm" style={{ color: "#A1A1AA" }}>
              {hasJobDescription 
                ? "You can optimize now or continue to fill your resume manually" 
                : "Skip this step to build your resume manually"}
            </p>
            <Button
              type="submit"
              variant={hasJobDescription ? "outline" : "default"}
              className="rounded-xl px-6 font-medium transition-all duration-200 hover:opacity-90"
              style={hasJobDescription ? {
                borderColor: "#27272A",
                backgroundColor: "#27272A",
                color: "#E4E4E7"
              } : {
                backgroundColor: "#3B82F6",
                color: "#FFFFFF"
              }}
            >
              {hasJobDescription ? (
                <>
                  Continue Manually
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Skip This Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

export default JobDescriptionForm;

