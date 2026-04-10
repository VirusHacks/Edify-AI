"use client";
import React, { useState } from "react";
import { useResumeContext } from "@/context/resume-info-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PersonalInfoForm from "./forms/PersonalInfoForm";
import SummaryForm from "./forms/SummaryForm";
import ExperienceForm from "./forms/ExperienceForm";
import EducationForm from "./forms/EducationForm";
import SkillsForm from "./forms/SkillsForm";
import JobDescriptionForm from "./forms/JobDescriptionForm";

const ResumeForm = () => {
  const { resumeInfo } = useResumeContext();
  const [activeFormIndex, setActiveFormIndex] = useState(0); // Start at 0 for job description

  const handleNext = () => {
    const newIndex = activeFormIndex + 1;
    setActiveFormIndex(newIndex);
  };
  
  const handlePrevious = () => {
    if (activeFormIndex > 0) {
      setActiveFormIndex(activeFormIndex - 1);
    }
  };
  return (
    <div className="sticky top-6">
      <div className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow duration-300" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b gap-4" style={{ borderColor: "#27272A" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className="w-2 h-2 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor: step <= activeFormIndex ? "#3B82F6" : "#27272A"
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>
              Step {activeFormIndex + 1} of 6
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {activeFormIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                style={{
                  borderColor: "#27272A",
                  backgroundColor: "#27272A",
                  color: "#E4E4E7"
                }}
                onClick={handlePrevious}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            {activeFormIndex < 5 && (
            <Button
              size="sm"
              className="rounded-xl font-medium transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF"
              }}
                disabled={resumeInfo?.status === "archived"}
              onClick={handleNext}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {activeFormIndex === 0 && <JobDescriptionForm handleNext={handleNext} />}
          {activeFormIndex === 1 && <PersonalInfoForm handleNext={handleNext} />}
          {activeFormIndex === 2 && <SummaryForm handleNext={handleNext} />}
          {activeFormIndex === 3 && <ExperienceForm handleNext={handleNext} />}
          {activeFormIndex === 4 && <EducationForm handleNext={handleNext} />}
          {activeFormIndex === 5 && <SkillsForm />}
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;
