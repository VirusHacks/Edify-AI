"use client";
import {
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import { and, eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import CourseBasicInfo from "./_components/CourseBasicInfo";
import CourseDetail from "./_components/CourseDetail";
import ChapterList from "./_components/ChapterList";
import { Button } from "@/components/ui/button";
import { generateCourseContent } from "./_utils/generateCourseContent";
import LoadingDialog from "../_components/LoadingDialog";
import { useRouter, useParams } from "next/navigation";
import { CourseType } from "@/types/resume.type";
import { ArrowLeft } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";

const CoursePageLayout = () => {
  const params = useParams();
  const { user } = useKindeBrowserClient();
  const [course, setCourse] = useState<CourseType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUserLoaded, setIsUserLoaded] = useState<boolean>(false);
  const courseId = params?.courseId as string;

  const router = useRouter();

  // Monitor user loading state
  useEffect(() => {
    if (user?.email) {
      setIsUserLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (courseId && isUserLoaded) {
      getCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isUserLoaded]);

  const getCourse = async () => {
    if (!user?.email || !courseId) {
      console.error("User email or courseId is not available");
      return;
    }
    try {
      const resp = await fetch(`/api/courses/${encodeURIComponent(courseId)}`)
      const json = await resp.json()
      if (json?.success) {
        setCourse(json.data as CourseType)
      } else {
        console.error('Failed to fetch course', json?.error)
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  const handleGenerateCourseContent = async () => {
    if (!courseId) return;
    if (loading) return; // Prevent double-clicks
    
    try {
      if (!course) {
        console.warn("No course available to generate content for");
        return;
      }
      
      setLoading(true); // Show loading dialog
      console.log("[Course Page] Starting content generation for:", courseId);
      
      // Trigger server-side generation of course chapters
      const resp = await fetch(`/api/courses/${encodeURIComponent(courseId)}/generate`, { method: 'POST' })
      const json = await resp.json()
      
      if (json?.success) {
        console.log("[Course Page] Content generation successful, redirecting...");
        router.replace(`/create-course/${courseId}/finish`)
      } else {
        console.error('Failed to generate course content', json?.error)
        alert('Failed to generate course content. Please try again.')
      }
    } catch (error) {
      console.error("[Course Page] Error:", error);
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-4 sm:py-6 md:py-8 lg:py-12 max-w-screen-xl">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4 px-4 sm:px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="px-4 sm:px-6 md:px-7 lg:px-20 xl:px-44">
          <h2 className="font-bold text-center text-xl sm:text-2xl mb-6 md:mb-8" style={{ color: "#E4E4E7" }}>Course Layout</h2>

          <LoadingDialog loading={loading} />

          {/* Basic Info */}
          <CourseBasicInfo courseInfo={course} onRefresh={() => getCourse()} />

          {/* Course Details */}
          <CourseDetail courseDetail={course} />

          {/* List Of Lessons */}
          <ChapterList course={course} onRefresh={() => getCourse()} />

          <Button 
            className="my-6 md:my-10 w-full sm:w-auto bg-blue-500 text-white " 
            onClick={handleGenerateCourseContent}
            disabled={loading}
          >
            {loading ? "Generating Content..." : "Generate Course Content"}
          </Button>
        </div>
      </PageContainer>
    </div>
  );
};

export default CoursePageLayout;
