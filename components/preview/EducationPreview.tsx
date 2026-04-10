import React, { FC } from "react";
import SkeletonLoader from "@/components/skeleton-loader";
import { INITIAL_THEME_COLOR } from "@/lib/helper";
import { ResumeDataType } from "@/types/resume.type";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

const EducationPreview: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  const themeColor = resumeInfo?.themeColor || INITIAL_THEME_COLOR;

  if (isLoading) {
    return <SkeletonLoader />;
  }
  if (!resumeInfo?.educations || resumeInfo.educations.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      <h2
        className="text-lg font-bold mb-4 text-gray-900 uppercase tracking-wide"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          borderBottom: "2px solid #1a1a1a",
          paddingBottom: "4px",
        }}
      >
        Education
      </h2>

      <div className="flex flex-col gap-4">
        {resumeInfo.educations.map((education, index) => {
          const degree = [
            education?.degree,
            education?.major && `in ${education.major}`,
          ]
            .filter(Boolean)
            .join(" ");

          const dateRange = [
            education?.startDate,
            education?.endDate,
          ]
            .filter(Boolean)
            .join(" - ");

          return (
            <div key={index} className="mb-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-0.5">
                    {education?.universityName || "Institution Name"}
                  </h3>
                  {degree && (
                    <p className="text-sm font-medium text-gray-700">
                      {degree}
                    </p>
                  )}
                </div>
                {dateRange && (
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap ml-4">
                    {dateRange}
              </span>
                )}
              </div>
              {education?.description && (
                <p className="text-sm leading-relaxed text-gray-700 mt-2">
                  {education.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EducationPreview;
