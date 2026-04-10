"use client";
import useGetDocuments from "@/features/document/use-get-document";
import { FileText, Loader, RotateCw } from "lucide-react";
import React, { Fragment } from "react";
import ResumeItem from "./common/ResumeItem";

const ResumeList = () => {
  const { data, isLoading, isError, refetch } = useGetDocuments();
  const resumes = data?.data ?? [];
  return (
    <Fragment>
      {isLoading ? (
        <>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="rounded-2xl border h-80 animate-pulse" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <div className="p-6">
                <div className="h-48 rounded-xl mb-4" style={{ backgroundColor: "#27272A" }}></div>
                <div className="h-4 rounded mb-2" style={{ backgroundColor: "#27272A" }}></div>
                <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#27272A" }}></div>
              </div>
            </div>
          ))}
        </>
      ) : isError ? (
        <div className="rounded-2xl border h-80 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#27272A" }}>
            <RotateCw className="w-6 h-6" style={{ color: "#EF4444" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Failed to load</h3>
          <p className="text-sm mb-4 text-center" style={{ color: "#A1A1AA" }}>There was an error loading your resumes</p>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-90 font-medium"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            onClick={() => refetch()}
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed h-80 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", borderStyle: "dashed" }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#27272A" }}>
            <FileText className="w-8 h-8" style={{ color: "#A1A1AA" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>No resumes yet</h3>
          <p className="text-sm text-center" style={{ color: "#A1A1AA" }}>Create your first resume to get started</p>
        </div>
      ) : (
        <>
          {resumes?.map((resume) => (
            <ResumeItem
              key={resume.documentId}
              documentId={resume.documentId}
              title={resume.title}
              status={resume.status}
              updatedAt={resume.updatedAt}
              themeColor={resume.themeColor}
              thumbnail={resume.thumbnail}
            />
          ))}
        </>
      )}
    </Fragment>
  );
};

export default ResumeList;
