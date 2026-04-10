"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { INITIAL_THEME_COLOR } from "@/lib/helper";
import { ResumeDataType } from "@/types/resume.type";
import React, { FC } from "react";

interface PropsType {
  resumeInfo: ResumeDataType | undefined;
  isLoading: boolean;
}

const PersonalInfo: FC<PropsType> = ({ resumeInfo, isLoading }) => {
  const themeColor = resumeInfo?.themeColor || INITIAL_THEME_COLOR;

  if (isLoading) {
    return <SkeletonLoader />;
  }
  const fullName = `${resumeInfo?.personalInfo?.firstName || ""} ${resumeInfo?.personalInfo?.lastName || ""}`.trim() || "Your Name";
  const jobTitle = resumeInfo?.personalInfo?.jobTitle || "";
  const address = resumeInfo?.personalInfo?.address || "";
  const phone = resumeInfo?.personalInfo?.phone || "";
  const email = resumeInfo?.personalInfo?.email || "";

  return (
    <div className="w-full mb-6 pb-4 border-b-2 border-gray-800">
      <h1
        className="text-3xl font-bold mb-1 text-gray-900"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          letterSpacing: "0.5px",
        }}
      >
        {fullName}
      </h1>
      {jobTitle && (
        <p className="text-base font-medium text-gray-700 mb-1">
          {jobTitle}
        </p>
      )}
      {address && (
        <p className="text-sm text-gray-600 mb-2">
          {address}
      </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        {phone && <span>{phone}</span>}
        {email && (
          <span className="text-blue-600 underline hover:text-blue-800">
            {email}
          </span>
        )}
      </div>
    </div>
  );
};

const SkeletonLoader = () => {
  return (
    <div className="w-full min-h-14">
      <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
      <Skeleton className="h-6 w-1/4 mx-auto mb-2" />
      <Skeleton className="h-6 w-1/3 mx-auto mb-2" />
      <div className="flex justify-between pt-3">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-[1.5] w-full my-2" />
    </div>
  );
};

export default PersonalInfo;
