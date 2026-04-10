import { ChapterType } from "@/types/resume.type";
import React from "react";
import { Clock, MessageCircle } from "lucide-react";

type ChapterListCardProps = {
  chapter: ChapterType;
  index: number;
};

const ChapterListCard = ({ chapter, index }: ChapterListCardProps) => {
  const isForumLink = chapter.chapter_name === "Discussion Forum";
  
  return (
    <div className="flex items-center gap-3">
      {/* Chapter Number/Icon */}
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
        style={{
          backgroundColor: "#3B82F6",
          color: "#FFFFFF"
        }}
      >
        {isForumLink ? (
          <MessageCircle className="w-4 h-4" />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>
      
      {/* Chapter Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate transition-colors" style={{ color: "#E4E4E7" }}>
          {chapter.chapter_name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3" style={{ color: "#A1A1AA" }} />
          <span className="text-xs" style={{ color: "#A1A1AA" }}>
            {isForumLink ? "Community" : chapter.duration}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChapterListCard;
