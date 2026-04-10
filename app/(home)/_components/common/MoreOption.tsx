import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResumeContext } from "@/context/resume-info-provider";
import useUpdateDocument from "@/features/document/use-update-document";
import { toast } from "@/hooks/use-toast";
import { Loader, MoreHorizontal, Redo, Trash2 } from "lucide-react";
import { StatusType } from "@/types/resume.type";

const MoreOption = () => {
  const router = useRouter();
  const { resumeInfo, isLoading, onUpdate } = useResumeContext();

  const { mutateAsync, isPending } = useUpdateDocument();

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
            router.replace(`/dashboard/`);
            toast({
              title: "Success",
              description: `Moved to trash successfully`,
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
    [mutateAsync, onUpdate, resumeInfo, router]
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-lg"
            style={{
              backgroundColor: "#27272A",
              borderColor: "#27272A",
              color: "#E4E4E7"
            }}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="rounded-lg border"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#27272A"
          }}
        >
          <DropdownMenuItem asChild>
            {resumeInfo?.status === "archived" ? (
              <Button
                variant="ghost"
                className="gap-1 !py-6 !cursor-pointer rounded-md w-full justify-start"
                style={{ color: "#E4E4E7" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#27272A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                disabled={isPending}
                onClick={() => handleClick("private")}
              >
                <Redo size="15px" />
                Restore resume
                {isPending && <Loader size="15px" className="animate-spin" />}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="gap-1 text-md !py-2 !px-4 !cursor-pointer rounded-md w-full justify-start"
                style={{ color: "#E4E4E7" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#27272A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                disabled={isPending}
                onClick={() => handleClick("archived")}
              >
                <Trash2 size="16px" style={{ color: "#EF4444" }} />
                Move to Trash
                {isPending && <Loader size="15px" className="animate-spin" />}
              </Button>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MoreOption;
