import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResumeContext } from "@/context/resume-info-provider";
import { Eye, FileText } from "lucide-react";
import React from "react";
import ResumePreview from "./ResumePreview";

const PreviewModal = () => {
  const { resumeInfo, isLoading } = useResumeContext();

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={
              isLoading || resumeInfo?.status === "archived" ? true : false
            }
            variant="secondary"
            className="rounded-lg gap-1 !p-2 w-9 lg:w-auto lg:p-4 transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#27272A",
              borderColor: "#27272A",
              color: "#E4E4E7"
            }}
          >
            <div className="flex items-center gap-1">
              <Eye size="18px" />
              <span className="hidden lg:flex text-md px-1">Preview</span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-6xl p-0 w-full max-h-[90vh] lg:max-h-[95vh] overflow-y-auto rounded-2xl border"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#27272A"
          }}
        >
          <DialogHeader
            className="!pb-0 !m-0 sticky top-0 z-10 backdrop-blur-sm border-b"
            style={{
              backgroundColor: "#0A0A0A",
              borderColor: "#27272A"
            }}
          >
            <DialogTitle
              className="flex items-center gap-1 text-xl pt-2 px-3 font-semibold opacity-100"
              style={{ color: "#E4E4E7" }}
            >
              <FileText
                size="20px"
                style={{ color: "#3B82F6" }}
              />
              {resumeInfo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-full px-2 pb-4">
            <ResumePreview />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreviewModal;
