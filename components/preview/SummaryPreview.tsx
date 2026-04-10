import { Skeleton } from "@/components/ui/skeleton";
import { ResumeDataType } from "@/types/resume.type";
import React, { FC } from "react";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

const SummaryPreview: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="h-6 w-full" />;
  }

  const summary = resumeInfo?.summary;
  if (!summary) return null;

  return (
    <div className="w-full mb-6">
      <h2
        className="text-lg font-bold mb-3 text-gray-900 uppercase tracking-wide"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          borderBottom: "2px solid #1a1a1a",
          paddingBottom: "4px",
        }}
      >
        Professional Summary
      </h2>
      <p className="text-sm leading-relaxed text-gray-700">
        {summary}
        </p>
    </div>
  );
};

export default SummaryPreview;
