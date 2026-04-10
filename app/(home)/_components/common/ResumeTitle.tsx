"use client";

import { cn } from "@/lib/utils";
import { FileText, Lock, Globe, Trash2 } from "lucide-react";
import React, { FC, useEffect, useState } from "react";

interface ResumeTitleProps {
  initialTitle: string;
  isLoading: boolean;
  status?: "archived" | "private" | "public" | null;
  onSave?: (newTitle: string) => void;
}

const ResumeTitle: FC<ResumeTitleProps> = ({
  initialTitle,
  isLoading,
  status,
  onSave,
}) => {
  const [title, setTitle] = useState("Untitled Resume");

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
  }, [initialTitle]);

  const handleBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const newTitle = e.target.innerText;
    setTitle(newTitle);
    if (onSave && typeof onSave === "function") {
      onSave(newTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-1 pr-4">
      <FileText size="24px" style={{ color: "#3B82F6" }} />
      <h5
        className={cn(
          "text-2xl px-1 font-semibold opacity-100 focus:outline-none",
          {
            "!opacity-70 !pointer-events-none":
              isLoading === true || status === "archived",
          }
        )}
        style={{ color: "#E4E4E7" }}
        contentEditable={isLoading || status === "archived" ? false : true}
        suppressContentEditableWarning={true}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      >
        {title}
      </h5>
      <span>
        {status === "private" ? (
          <Lock size="20px" style={{ color: "#A1A1AA" }} />
        ) : status === "public" ? (
          <Globe size="20px" style={{ color: "#A1A1AA" }} />
        ) : status === "archived" ? (
          <Trash2 size="20px" style={{ color: "#A1A1AA" }} />
        ) : null}
      </span>
    </div>
  );
};

export default ResumeTitle;
