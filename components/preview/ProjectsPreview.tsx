import React, { FC } from "react";
import SkeletonLoader from "@/components/skeleton-loader";
import { ResumeDataType } from "@/types/resume.type";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

const ProjectsPreview: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Check if projects exist in resumeInfo (might be in different format)
  const projects = (resumeInfo as any)?.projects || [];

  if (!projects || projects.length === 0) {
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
        Projects
      </h2>

      <div className="flex flex-col gap-5">
        {projects.map((project: any, index: number) => {
          const projectName = project?.name || project?.title || `Project ${index + 1}`;
          const description = project?.description || project?.summary || "";
          const technologies = project?.technologies || project?.tech_stack || [];
          const impact = project?.impact || "";

          return (
            <div key={index} className="mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {projectName}
              </h3>
              {description && (
                <div
                  className="text-sm leading-relaxed text-gray-700 mt-2"
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                />
              )}
              {technologies.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Technologies: </span>
                  {technologies.join(", ")}
                </p>
              )}
              {impact && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Impact: </span>
                  {impact}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsPreview;

