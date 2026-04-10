"use client";
import { useResumeContext } from "@/context/resume-info-provider";
import { AlertCircle } from "lucide-react";
import React, { useCallback } from "react";
import ResumeTitle from "./ResumeTitle";
import useUpdateDocument from "@/features/document/use-update-document";
import { toast } from "@/hooks/use-toast";
import ThemeColor from "./ThemeColor";
import PreviewModal from "../PreviewModal";
import Download from "./Download";
import Share from "./Share";
import MoreOption from "./MoreOption";
import OptimizeResumeButton from "../OptimizeResumeButton";

const TopSection = () => {
  const { resumeInfo, isLoading, onUpdate } = useResumeContext();
  const { mutateAsync, isPending } = useUpdateDocument();

  const handleTitle = useCallback(
    (title: string) => {
      if (title === "Untitled Resume" && !title) return;

      if (resumeInfo) {
        onUpdate({
          ...resumeInfo,
          title: title,
        });
      }

      mutateAsync(
        {
          title: title,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Title updated successfully",
            });
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update the title",
              variant: "destructive",
            });
          },
        }
      );
    },
    [resumeInfo, onUpdate]
  );
  return (
    <div className="relative">
      {resumeInfo?.status === "archived" && (
        <div className="sticky top-0 z-10 text-center py-3 rounded-xl mb-6 flex items-center justify-center gap-2 font-medium shadow-lg" style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}>
          <AlertCircle className="w-5 h-5" />
          This resume is in the trash bin
        </div>
      )}
      
      <div className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <ResumeTitle
              isLoading={isLoading || isPending}
              initialTitle={resumeInfo?.title || ""}
              status={resumeInfo?.status}
              onSave={(value) => handleTitle(value)}
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <OptimizeResumeButton />
            <ThemeColor />
            <PreviewModal />
            <Download
              title={resumeInfo?.title || "Untitled Resume"}
              status={resumeInfo?.status}
              isLoading={isLoading}
            />
            <Share />
            <MoreOption />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSection;
