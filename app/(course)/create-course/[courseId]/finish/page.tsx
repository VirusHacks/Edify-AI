"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import CourseBasicInfo from "../_components/CourseBasicInfo"
import { IoCopyOutline } from "react-icons/io5"
import type { CourseType } from "@/types/resume.type"
import Link from "next/link"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const FinishScreen = () => {
  const params = useParams()
  const { user } = useKindeBrowserClient()
  const [course, setCourse] = useState<CourseType | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const courseId = params?.courseId as string
  
  // Get base URL from browser origin (works in both local and production)
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    // Fallback for SSR (shouldn't happen in client component, but just in case)
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_HOST_URL || "http://localhost:3000"
  }
  
  // Compute course link reactively based on course state
  const COURSE_LINK = useMemo(() => {
    if (!course?.courseId) return ""
    return `${getBaseUrl()}/course/${course.courseId}/start`
  }, [course?.courseId])

  useEffect(() => {
    if (courseId && user?.email && !course) {
      getCourse()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.email])

  const getCourse = async () => {
    if (!courseId || !user?.email) return
    try {
      const resp = await fetch(`/api/courses/${encodeURIComponent(courseId)}`)
      const json = await resp.json()
      if (json?.success) setCourse(json.data as CourseType)
    } catch (error) {
      console.error("Error fetching course:", error)
    }
  }

  const handleCopyLink = async () => {
    if (!COURSE_LINK) {
      toast({
        title: "Course link not available",
        description: "Please wait for the course to load",
        variant: "destructive"
      })
      return
    }
    
    try {
      await navigator.clipboard.writeText(COURSE_LINK)
      toast({
        title: "Link copied!",
        description: "Course link has been copied to your clipboard",
      })
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#3B82F6" }}>
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Loading Course</h3>
          <p style={{ color: "#A1A1AA" }}>Preparing your course details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Card className="rounded-2xl border shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardHeader className="pb-6 pt-8 px-8 md:px-12">
            <CardTitle className="text-3xl md:text-4xl font-bold text-center tracking-tight" style={{ color: "#E4E4E7" }}>
              🎉 Congratulations! Your course is ready
            </CardTitle>
            <p className="text-center mt-2 text-base" style={{ color: "#A1A1AA" }}>
              Your AI-generated course has been created successfully
            </p>
          </CardHeader>
          <CardContent className="space-y-8 px-8 md:px-12 pb-12">
            <CourseBasicInfo courseInfo={course} onRefresh={getCourse} />
            
            <div className="space-y-4 pt-6 border-t" style={{ borderColor: "#27272A" }}>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                  Course URL
                </h2>
                <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                  <Link 
                    href={COURSE_LINK} 
                    className="flex-1 text-sm md:text-base truncate transition-all duration-200 hover:opacity-80"
                    style={{ color: "#3B82F6" }}
                  >
                    {COURSE_LINK}
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopyLink}
                    className="rounded-lg flex-shrink-0 transition-all duration-200 hover:opacity-80"
                    style={{ 
                      color: "#A1A1AA",
                      backgroundColor: "transparent"
                    }}
                  >
                    <IoCopyOutline className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs" style={{ color: "#A1A1AA" }}>
                  Share this link with students or use it to access your course
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FinishScreen

