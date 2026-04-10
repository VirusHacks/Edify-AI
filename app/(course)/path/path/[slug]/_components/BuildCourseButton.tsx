"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BuildCourseButtonProps {
  pathwayTitle: string;
  pathwayDifficulty: string;
  stepTitle: string;
  stepDescription: string;
  stepResources?: { title: string; url?: string | null }[];
  estimatedTime?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "compact";
}

interface CourseOutline {
  category: string;
  topic: string;
  description: string;
  level: string;
  duration: string;
  chapters: { chapter_name: string; description: string; duration: string }[];
  suggestedChapterCount: number;
}

export default function BuildCourseButton({
  pathwayTitle,
  pathwayDifficulty,
  stepTitle,
  stepDescription,
  stepResources,
  estimatedTime,
  className,
  variant = "default",
}: BuildCourseButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/pathway/generate-course-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathwayTitle,
          stepTitle,
          stepDescription,
          stepResources: stepResources?.map(r => ({ title: r.title, url: r.url })),
          estimatedTime,
          difficulty: pathwayDifficulty,
        }),
      });

      const json = await response.json();
      
      if (json.success && json.data) {
        setCourseOutline(json.data);
        setShowPreview(true);
      } else {
        setError(json.error || "Failed to generate course outline");
      }
    } catch (err) {
      console.error("Error generating course outline:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedToCourseCreation = () => {
    if (!courseOutline) return;

    // Build URL params for prefilling the course creation page
    const params = new URLSearchParams({
      prefill: "true",
      category: courseOutline.category,
      topic: courseOutline.topic,
      description: courseOutline.description,
      difficulty: courseOutline.level,
      duration: courseOutline.duration,
      chapters: String(courseOutline.suggestedChapterCount),
      fromPathway: pathwayTitle,
      stepTitle: stepTitle,
    });

    // Store the full outline in sessionStorage for the course creation page
    sessionStorage.setItem("pathwayCourseOutline", JSON.stringify(courseOutline));

    router.push(`/create-course?${params.toString()}`);
  };

  const buttonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      );
    }
    
    if (variant === "compact") {
      return (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          Build Course
        </>
      );
    }

    return (
      <>
        <BookOpen className="w-4 h-4 mr-2" />
        Build Course from Step
      </>
    );
  };

  const getButtonClasses = () => {
    const base = className || "";
    
    switch (variant) {
      case "outline":
        return `${base} border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]`;
      case "ghost":
        return `${base} text-[#3B82F6] hover:bg-[#3B82F6]/10`;
      case "compact":
        return `${base} h-8 px-3 text-xs gap-1.5 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:opacity-90`;
      default:
        return `${base} bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:opacity-90`;
    }
  };

  return (
    <>
      <Button
        onClick={handleGenerateOutline}
        disabled={isGenerating}
        variant={variant === "outline" ? "outline" : variant === "ghost" ? "ghost" : "default"}
        className={getButtonClasses()}
      >
        {buttonContent()}
      </Button>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="absolute top-1 right-2 text-white/70 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Course Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl bg-[#0A0A0A] border-[#27272A] text-[#E4E4E7]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#3B82F6]" />
              Course Outline Generated
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Review the AI-generated course outline based on your pathway step
            </DialogDescription>
          </DialogHeader>

          {courseOutline && (
            <div className="space-y-4 my-4">
              {/* Course Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30">
                    {courseOutline.category}
                  </Badge>
                  <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA]">
                    {courseOutline.level}
                  </Badge>
                  <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA]">
                    {courseOutline.duration}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-[#E4E4E7]">{courseOutline.topic}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{courseOutline.description}</p>
              </div>

              {/* Chapters Preview */}
              <div className="border-t border-[#27272A] pt-4">
                <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">
                  Suggested Chapters ({courseOutline.chapters.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {courseOutline.chapters.map((chapter, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 bg-[#121212] rounded-lg border border-[#27272A] hover:border-[#3B82F6]/30 transition-colors"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-medium flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#E4E4E7] truncate">{chapter.chapter_name}</p>
                        <p className="text-xs text-[#A1A1AA] mt-0.5">{chapter.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Info */}
              <div className="text-xs text-[#71717A] bg-[#121212] p-3 rounded-lg border border-[#27272A]">
                <span className="text-[#A1A1AA]">Generated from:</span>{" "}
                <span className="text-[#3B82F6]">{pathwayTitle}</span> → {stepTitle}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A] hover:text-[#E4E4E7]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToCourseCreation}
              className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:opacity-90 gap-2"
            >
              Proceed to Create Course
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
