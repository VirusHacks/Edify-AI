import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useResumeContext } from "@/context/resume-info-provider";
import useUpdateDocument from "@/features/document/use-update-document";
import useOrigin from "@/hooks/use-origin";
import { toast } from "@/hooks/use-toast";
import { StatusType } from "@/types/resume.type";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  Loader,
  ShareIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useState } from "react";

const Share = () => {
  const param = useParams();
  const documentId = param?.documentId || "";

  const { resumeInfo, onUpdate, isLoading } = useResumeContext();
  const { mutateAsync, isPending } = useUpdateDocument();

  const origin = useOrigin();

  const [copied, setCopied] = useState(false);

  const url = `${origin}/preview/${documentId}/resume`;

  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleClick = useCallback(
    async (status: StatusType) => {
      if (!resumeInfo) return;
      await mutateAsync(
        {
          status: status,
        },
        {
          onSuccess: () => {
            onUpdate({
              ...resumeInfo,
              status: status,
            });
            toast({
              title: "Success",
              description: `Status set to ${status} successfully`,
            });
          },
          onError() {
            toast({
              title: "Error",
              description: "Failed to update status",
              variant: "destructive",
            });
          },
        }
      );
    },
    [mutateAsync, onUpdate, resumeInfo]
  );

  return (
    <Popover>
      <PopoverTrigger
        disabled={resumeInfo?.status === "archived" ? true : false}
        asChild
      >
        <Button
          disabled={
            isLoading || resumeInfo?.status === "archived" ? true : false
          }
          variant="secondary"
          className="rounded-lg gap-1 !p-2 lg:w-auto lg:p-4 transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: "#27272A",
            borderColor: "#27272A",
            color: "#E4E4E7"
          }}
        >
          <div className="flex items-center gap-1">
            <ShareIcon size="18px" />
            <span className="flex px-1 text-md">Share</span>
          </div>
          <ChevronDown size="16px" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="rounded-xl border"
        align="end"
        alignOffset={0}
        forceMount
        style={{
          backgroundColor: "#0A0A0A",
          borderColor: "#27272A"
        }}
      >
        {resumeInfo?.status === "public" ? (
          <div className="space-y-3">
            <div className="flex gap-x-2 items-center">
              <Globe size="15px" style={{ color: "#3B82F6" }} className="animate-pulse" />
              <p className="text-base font-semibold" style={{ color: "#3B82F6" }}>
                This resume is shareable, copy the link!
              </p>
            </div>
            <div className="flex items-center w-full">
              <input
                className="flex-1 px-3 py-2 text-sm border rounded-l-lg h-9 truncate"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
                value={url}
                readOnly
              />
              <Button
                className="h-9 rounded-l-none rounded-r-lg"
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFFFFF"
                }}
                disabled={copied}
                onClick={onCopy}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            <hr style={{ borderColor: "#27272A" }} className="!mb-0" />
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-lg text-sm font-semibold"
              style={{
                borderColor: "#27272A",
                backgroundColor: "#27272A",
                color: "#E4E4E7"
              }}
              onClick={() => handleClick("private")}
              disabled={isPending}
            >
              {isPending && <Loader size="15px" className="animate-spin" />}
              Private
            </Button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2 items-center justify-center">
            <Globe size="40px" style={{ color: "#3B82F6" }} />
            <div className="text-center mb-1">
              <h5 className="font-semibold text-sm" style={{ color: "#E4E4E7" }}>Set to Public</h5>
              <p className="text-xs" style={{ color: "#A1A1AA" }}>
                To share it with others, you need to make it public.
              </p>
            </div>
            <Button
              className="w-full h-8 rounded-lg text-xs gap-1 font-semibold transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF"
              }}
              type="button"
              onClick={() => handleClick("public")}
            >
              {isPending && <Loader size="15px" className="animate-spin" />}
              Public
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Share;
