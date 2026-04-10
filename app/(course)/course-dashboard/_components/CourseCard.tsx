"use client"

import { CourseType } from "@/types/resume.type";
import Image from "next/image";
import { BookOpen, MoreVertical } from "lucide-react";
import DropDownOptions from "./DropDownOptions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type CourseCardProps = {
  course: CourseType;
  onRefresh: () => void;
  displayUser?: boolean;
};

const CourseCard = ({
  course,
  onRefresh,
  displayUser = false,
}: CourseCardProps) => {
  const handleOnDelete = async () => {
    try {
      const resp = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' });
      const json = await resp.json();
      if (json?.success) {
        onRefresh();
      } else {
        console.error('Failed to delete course', json?.error);
      }
    } catch (error) {
      console.error('Error deleting course', error);
    }
  };

  // Generate gradient based on category - adjusted for dark mode
  const getCategoryGradient = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('coding') || categoryLower.includes('development')) {
      return 'from-blue-600/30 via-purple-600/30 to-indigo-600/30';
    } else if (categoryLower.includes('design') || categoryLower.includes('ui') || categoryLower.includes('ux')) {
      return 'from-pink-600/30 via-rose-600/30 to-red-600/30';
    } else if (categoryLower.includes('business') || categoryLower.includes('marketing') || categoryLower.includes('management')) {
      return 'from-emerald-600/30 via-teal-600/30 to-cyan-600/30';
    } else if (categoryLower.includes('data') || categoryLower.includes('analytics') || categoryLower.includes('science')) {
      return 'from-orange-600/30 via-amber-600/30 to-yellow-600/30';
    } else if (categoryLower.includes('ai') || categoryLower.includes('machine learning') || categoryLower.includes('ml')) {
      return 'from-violet-600/30 via-purple-600/30 to-fuchsia-600/30';
    } else {
      return 'from-slate-600/30 via-gray-600/30 to-slate-600/30';
    }
  };

  const gradientClass = getCategoryGradient(course.category);
  const courseInitial = course.courseOutput?.topic?.charAt(0).toUpperCase() || 'C';
  const courseBannerUrl = course.courseBanner;

  return (
    <Card className="group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      <Link href={`/course/${course.courseId}`} className="block">
        <div className="relative overflow-hidden h-40 md:h-48 bg-gradient-to-br" style={{ backgroundColor: "#27272A" }}>
          {courseBannerUrl ? (
            <Image
              src={courseBannerUrl}
              alt={course?.courseName ?? "AI Course Generator"}
              width={400}
              height={240}
              priority
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center relative`}>
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:24px_24px]"></div>
              </div>
              {/* Course Initial */}
              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: "#27272A", borderColor: "#3B82F6" }}>
                  <span className="text-3xl md:text-4xl font-bold" style={{ color: "#E4E4E7" }}>
                    {courseInitial}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Course Level Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="text-xs font-medium rounded-lg px-2.5 py-1" style={{ backgroundColor: "#27272A", color: "#E4E4E7", borderColor: "#27272A" }}>
              {course.level} Level
            </Badge>
          </div>
          
          {/* Category Badge on Image */}
          <div className="absolute top-3 right-3">
            <Badge className="text-xs font-medium rounded-lg px-2.5 py-1 capitalize" style={{ backgroundColor: "#27272A", color: "#E4E4E7", borderColor: "#27272A" }}>
              {course.category}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 md:p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-sm md:text-base lg:text-lg line-clamp-2 flex-1" style={{ color: "#E4E4E7" }}>
            {course.courseOutput.topic}
          </h3>
          {!displayUser && (
            <DropDownOptions handleDeleteCourse={() => handleOnDelete()}>
              <button className="ml-2 p-1.5 rounded-lg transition-colors" style={{ color: "#A1A1AA" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#27272A"; e.currentTarget.style.color = "#E4E4E7"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#A1A1AA"; }}>
                <MoreVertical size={18} />
              </button>
            </DropDownOptions>
          )}
        </div>

        {/* Progress bar for user's own courses */}
        {!displayUser && course.progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-medium" style={{ color: "#A1A1AA" }}>Progress</span>
              <span className="font-semibold" style={{ color: "#E4E4E7" }}>{Math.round(course.progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#27272A" }}>
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${course.progress}%`,
                  backgroundColor: "#3B82F6"
                }}
              />
            </div>
          </div>
        )}

        {/* Chapters and action */}
        <div className="flex items-center justify-between pt-3 border-t mt-auto" style={{ borderColor: "#27272A" }}>
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "#27272A", color: "#A1A1AA" }}>
            <BookOpen className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="text-xs">{course?.courseOutput?.chapters?.length || 0} Chapters</span>
          </div>
          
          <Link href={`/course/${course.courseId}`}>
            <Button 
              size="sm" 
              className="rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 px-3 md:px-4"
              style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            >
              {course.progress > 0 ? (
                <>
                  <Play className="w-3 h-3 mr-1.5" />
                  Continue
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1.5" />
                  Start
                </>
              )}
            </Button>
          </Link>
        </div>

        {/* User info for explore section */}
        {displayUser && (
          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t" style={{ borderColor: "#27272A" }}>
            <Image
              src={course?.userprofileimage || "/userProfile.png"}
              alt={course?.username || "User"}
              width={28}
              height={28}
              className="rounded-full ring-2"
              style={{ borderColor: "#27272A" }}
            />
            <span className="text-xs font-medium truncate" style={{ color: "#A1A1AA" }}>
              {course.username || "Anonymous"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;
