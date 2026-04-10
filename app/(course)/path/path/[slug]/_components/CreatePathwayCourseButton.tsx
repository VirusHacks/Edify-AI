"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Sparkles, ArrowRight, GraduationCap } from "lucide-react";
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

interface CreatePathwayCourseButtonProps {
  pathwayTitle: string;
  pathwayDescription: string;
  pathwayDifficulty: string;
  pathwayEstimatedTime: string;
  steps: {
    title: string;
    description: string;
    estimatedTime?: string;
  }[];
  className?: string;
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

export default function CreatePathwayCourseButton({
  pathwayTitle,
  pathwayDescription,
  pathwayDifficulty,
  pathwayEstimatedTime,
  steps,
  className,
}: CreatePathwayCourseButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create a comprehensive description from all steps
      const stepsOverview = steps
        .map((s, i) => `${i + 1}. ${s.title}: ${s.description}`)
        .join("\n");

      const response = await fetch("/api/pathway/generate-course-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathwayTitle,
          stepTitle: `Complete ${pathwayTitle} Masterclass`,
          stepDescription: `${pathwayDescription}\n\nThis comprehensive course covers:\n${stepsOverview}`,
          estimatedTime: pathwayEstimatedTime,
          difficulty: pathwayDifficulty,
        }),
      });

      const json = await response.json();
      
      if (json.success && json.data) {
        // Adjust the outline to be more comprehensive
        const outline = json.data;
        outline.topic = `Complete ${pathwayTitle} Course`;
        outline.suggestedChapterCount = Math.max(outline.suggestedChapterCount, steps.length);
        setCourseOutline(outline);
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

    const params = new URLSearchParams({
      prefill: "true",
      category: courseOutline.category,
      topic: courseOutline.topic,
      description: courseOutline.description,
      difficulty: courseOutline.level,
      duration: courseOutline.duration,
      chapters: String(courseOutline.suggestedChapterCount),
      fromPathway: pathwayTitle,
      stepTitle: "Full Pathway Course",
    });

    sessionStorage.setItem("pathwayCourseOutline", JSON.stringify(courseOutline));
    router.push(`/create-course?${params.toString()}`);
  };

  return (
    <>
      <Button
        onClick={handleGenerateOutline}
        disabled={isGenerating}
        className={`${className} bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:opacity-90 gap-2`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <GraduationCap className="w-4 h-4" />
            Create Full Course
          </>
        )}
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
              Full Pathway Course Generated
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              A comprehensive course covering all {steps.length} steps of your pathway
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
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {steps.length} Pathway Steps
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
                <span className="text-[#3B82F6]">{pathwayTitle}</span> (Complete Pathway)
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
