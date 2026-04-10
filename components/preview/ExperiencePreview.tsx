import SkeletonLoader from "@/components/skeleton-loader";
import { INITIAL_THEME_COLOR } from "@/lib/helper";
import { ResumeDataType } from "@/types/resume.type";
import React, { FC } from "react";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

const ExperiencePreview: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  const themeColor = resumeInfo?.themeColor || INITIAL_THEME_COLOR;

  if (isLoading) {
    return <SkeletonLoader />;
  }
  if (!resumeInfo?.experiences || resumeInfo.experiences.length === 0) {
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
        Professional Experience
      </h2>

      <div className="flex flex-col gap-5">
        {resumeInfo.experiences.map((experience, index) => {
          const location = [
            experience?.companyName,
            experience?.city,
            experience?.state,
          ]
            .filter(Boolean)
            .join(", ");

          const dateRange = [
            experience?.startDate,
            experience?.currentlyWorking ? "Present" : experience?.endDate,
          ]
            .filter(Boolean)
            .join(" - ");

          return (
            <div key={index} className="mb-4">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-0.5">
                    {experience?.title || "Position Title"}
                  </h3>
                  <p className="text-sm font-medium text-gray-700">
                    {location || "Company, Location"}
                  </p>
                </div>
                {dateRange && (
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap ml-4">
                    {dateRange}
              </span>
                )}
            </div>
              {experience?.workSummary && (
                <div
                  className="text-sm leading-relaxed text-gray-700 mt-2"
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
              dangerouslySetInnerHTML={{
                    __html: experience.workSummary,
              }}
            />
              )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExperiencePreview;
