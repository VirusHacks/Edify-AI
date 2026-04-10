"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import useGetDocuments from "@/features/document/use-get-document";
import useRestoreDocument from "@/features/document/use-restore-document";
import { format } from "date-fns";
import { Dot, FileText, Undo, Loader, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const TrashListBox = () => {
  const router = useRouter();
  const { data, isLoading } = useGetDocuments(true);
  const { mutateAsync, isPending } = useRestoreDocument();

  const resumes = data?.data ?? [];
  const [search, setSearch] = useState("");

  const filteredDocuments = resumes?.filter((doc) => {
    return doc.title?.toLowerCase()?.includes(search?.toLowerCase());
  });

  const onClick = (docId: string) => {
    router.push(`/dashboard/document/${docId}/edit`);
  };

  const onRestore = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    docId: string,
    status: string
  ) => {
    event.stopPropagation();
    mutateAsync(
      {
        documentId: docId,
        status: status,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Restore document successfully`,
          });
        },
      }
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>
          <Button
            className="text-[15px] gap-[2px] items-center rounded-lg"
            variant="outline"
            style={{
              borderColor: "#27272A",
              backgroundColor: "#27272A",
              color: "#E4E4E7"
            }}
          >
            <Trash2 size="15px" />
            <span>All Trash</span>
          </Button>
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-[22rem] !px-2 rounded-xl border"
        align="end"
        alignOffset={0}
        forceMount
        style={{
          backgroundColor: "#0A0A0A",
          borderColor: "#27272A"
        }}
      >
        {isLoading ? (
          <div className="w-full flex flex-col gap-2 pt-3">
            <Skeleton className="h-6" style={{ backgroundColor: "#27272A" }} />
            <Skeleton className="h-6" style={{ backgroundColor: "#27272A" }} />
            <Skeleton className="h-6" style={{ backgroundColor: "#27272A" }} />
          </div>
        ) : (
          <div className="text-sm">
            <div className="flex items-center gap-x-1 p-2">
              <Search className="w-4 h-4" style={{ color: "#A1A1AA" }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 px-2 rounded-lg"
                placeholder="Filter by resume title"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div className="mt-2 px-1 pb-1">
              <p className="hidden last:block text-xs text-center" style={{ color: "#A1A1AA" }}>
                No documents found
              </p>
              {filteredDocuments?.map((doc) => (
                <div
                  key={doc.id}
                  role="button"
                  onClick={() => onClick(doc.documentId)}
                  className="text-sm rounded-md w-full flex items-center justify-between py-1 px-1 transition-colors"
                  style={{ color: "#E4E4E7" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#27272A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex items-start gap-1">
                    <FileText size="15px" className="mt-[3px]" style={{ color: "#A1A1AA" }} />
                    <div className="flex flex-col">
                      <h5 className="font-semibold text-sm truncate block w-[200px]" style={{ color: "#E4E4E7" }}>
                        {doc.title}
                      </h5>
                      <div className="flex items-center !text-[12px]" style={{ color: "#A1A1AA" }}>
                        <span className="flex items-center capitalize gap-[2px]">
                          {doc.status}
                        </span>
                        <Dot size="15px" />
                        <span className="items-center">
                          {doc.updatedAt && format(doc.updatedAt, "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      role="button"
                      onClick={(e) => onRestore(e, doc.documentId, doc.status)}
                      className="rounded-sm w-6 h-6 flex items-center justify-center transition-colors"
                      style={{ color: "#A1A1AA" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#27272A";
                        e.currentTarget.style.color = "#E4E4E7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#A1A1AA";
                      }}
                    >
                      {isPending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Undo className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TrashListBox;
