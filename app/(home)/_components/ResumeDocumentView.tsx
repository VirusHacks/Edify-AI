"use client";
import React from "react";
import { cn } from "@/lib/utils";
import PersonalInfo from "@/components/preview/PersonalInfo";
import SummaryPreview from "@/components/preview/SummaryPreview";
import ExperiencePreview from "@/components/preview/ExperiencePreview";
import EducationPreview from "@/components/preview/EducationPreview";
import SkillPreview from "@/components/preview/SkillPreview";
import ProjectsPreview from "@/components/preview/ProjectsPreview";
import { ResumeDataType } from "@/types/resume.type";

interface ResumeDocumentViewProps {
  resumeInfo: ResumeDataType;
  label?: string;
  labelColor?: string;
}

const ResumeDocumentView: React.FC<ResumeDocumentViewProps> = ({
  resumeInfo,
  label,
  labelColor = "#3B82F6",
}) => {
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Label */}
      {label && (
        <div className="mb-3 flex items-center justify-center">
          <div
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: labelColor === "#EF4444" ? "#1F1F1F" : "#1E3A2E",
              color: labelColor === "#EF4444" ? "#EF4444" : "#22C55E",
              border: `1px solid ${labelColor}`,
            }}
          >
            {label}
          </div>
        </div>
      )}

      {/* Document */}
      <div
        id="resume-document-view"
        className={cn(`
          w-full flex-1 min-h-[600px]
          p-10 rounded-lg shadow-lg
          !bg-white !text-black
          overflow-y-auto
          `)}
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          lineHeight: "1.6",
          maxHeight: "calc(100vh - 400px)",
        }}
      >
        {/* Personal Info */}
        <PersonalInfo isLoading={false} resumeInfo={resumeInfo} />

        {/* Summary */}
        <SummaryPreview isLoading={false} resumeInfo={resumeInfo} />

        {/* Professional Experience */}
        <ExperiencePreview isLoading={false} resumeInfo={resumeInfo} />

        {/* Educational Info */}
        <EducationPreview isLoading={false} resumeInfo={resumeInfo} />

        {/* Projects */}
        <ProjectsPreview isLoading={false} resumeInfo={resumeInfo} />

        {/* Skills */}
        <SkillPreview isLoading={false} resumeInfo={resumeInfo} />
      </div>
    </div>
  );
};

export default ResumeDocumentView;

