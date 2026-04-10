import React, { FC, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Dot, EllipsisVertical, FileText, Globe, Lock } from "lucide-react";
import Image from "next/image";

interface PropType {
  documentId: string;
  title: string;
  status: "archived" | "private" | "public";
  themeColor: string | null;
  thumbnail: string | null;
  updatedAt: string;
}

const ResumeItem: FC<PropType> = ({
  documentId,
  status,
  title,
  themeColor,
  thumbnail,
  updatedAt,
}) => {
  const router = useRouter();

  const docDate = useMemo(() => {
    if (!updatedAt) return null;
    const formattedDate = format(updatedAt, "MMM dd,yyyy");
    return formattedDate;
  }, [updatedAt]);

  const gotoDoc = useCallback(() => {
    router.push(`/dashboard/document/${documentId}/edit`);
  }, [router, documentId]);

  return (
    <div
      role="button"
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      onClick={gotoDoc}
    >
      <div className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 h-80 flex flex-col overflow-hidden" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        {/* Thumbnail Section */}
        <div className="flex-1 relative overflow-hidden">
          {thumbnail ? (
            <div className="relative w-full h-full">
              <Image
                fill
                src={thumbnail}
                alt={title}
                className="object-cover object-top transition-transform duration-500 group-hover:scale-110 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
                <FileText className="w-8 h-8" style={{ color: "#A1A1AA" }} />
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm"
              style={{
                backgroundColor: status === "private" ? "#27272A" : "#10B981",
                color: "#FFFFFF"
              }}
            >
              {status === "private" ? (
                <>
                  <Lock className="w-3 h-3" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  Public
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 border-t" style={{ borderColor: "#27272A" }}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg line-clamp-1 flex-1 transition-colors" style={{ color: "#E4E4E7" }}>
              {title}
            </h3>
            <button 
              className="ml-2 p-1 rounded-lg transition-colors"
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
              <EllipsisVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#A1A1AA" }}>
              Updated {docDate}
            </span>
            {themeColor && (
              <div 
                className="w-4 h-4 rounded-full border-2 shadow-sm"
                style={{ 
                  backgroundColor: themeColor,
                  borderColor: "#27272A"
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeItem;
