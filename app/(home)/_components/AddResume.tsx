"use client";
import useCreateDocument from "@/features/document/use-create-document";
import { FileText, Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";

const AddResume = () => {
  const router = useRouter();
  const { isPending, mutate } = useCreateDocument();
  const onCreate = useCallback(() => {
    mutate(
      {
        title: "Untitled Resume",
      },
      {
        onSuccess: (response) => {
          // response can be a success or error shape. Guard before accessing data.
          if (response && typeof response === "object" && "data" in response) {
            const documentId = (response as any).data?.documentId;
            if (documentId) {
              router.push(`/dashboard/document/${documentId}/edit`);
            }
          }
        },
      }
    );
  }, [mutate, router]);
  return (
    <>
      <div
        role="button"
        className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        onClick={onCreate}
      >
        <div 
          className="rounded-2xl border-2 border-dashed transition-all duration-300 h-80 flex flex-col items-center justify-center p-6 hover:shadow-lg group-hover:border-opacity-100"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#27272A",
            borderStyle: "dashed"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3B82F6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#27272A";
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: "#3B82F6" }}>
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Create New Resume</h3>
          <p className="text-sm text-center leading-relaxed" style={{ color: "#A1A1AA" }}>
            Start with a blank template and build your professional resume
          </p>
        </div>
      </div>
      
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl p-8 shadow-2xl border flex flex-col items-center gap-4" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1" style={{ color: "#E4E4E7" }}>Creating Resume</h3>
              <p className="text-sm" style={{ color: "#A1A1AA" }}>Setting up your new document...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddResume;
