"use client"

import type { CourseType } from "@/types/resume.type"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChapterList from "../../create-course/[courseId]/_components/ChapterList"
import CourseDetail from "../../create-course/[courseId]/_components/CourseDetail"
import CourseBasicInfo from "../../create-course/[courseId]/_components/CourseBasicInfo"
import Header from "../../course-dashboard/_components/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PageContainer from "@/components/layout/PageContainer"
import { MessageSquare, Sparkles, ArrowLeft } from "lucide-react"

type CourseParams = {
  params: {
    courseId: string
  }
}

const Course = ({ params }: CourseParams) => {
  const [course, setCourse] = useState<CourseType | null>(null)
  const router = useRouter()

  const getCourse = async () => {
    try {
      const resp = await fetch(`/api/courses/${encodeURIComponent(params.courseId)}`)
      const json = await resp.json()
      if (json?.success) {
        setCourse(json.data as CourseType)
      } else {
        console.error('Failed to fetch course', json?.error)
      }
    } catch (error) {
      console.error('Error fetching course', error)
    }
  }

  useEffect(() => {
    if (params?.courseId && !course) {
      getCourse()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.courseId])

  // Build job description from course data for mock interview
  const buildJobDescription = (course: CourseType): string => {
    const topic = course.courseOutput?.topic || course.courseName || ""
    const chapters = course.courseOutput?.chapters || []
    
    // Extract key skills/topics from chapter names and descriptions
    const skills = chapters.map(ch => ch.chapter_name).join(", ")
    const category = course.category || ""
    const level = course.courseOutput?.level || course.level || ""
    
    return `${topic} - ${category}. Key topics: ${skills}. Level: ${level}`
  }

  // Navigate to mock interview with pre-filled course data
  const handlePracticeInterview = () => {
    if (!course) return
    
    const jobPosition = course.courseOutput?.topic || course.courseName || "Developer"
    const jobDesc = buildJobDescription(course)
    // Set experience based on course level
    const levelMap: Record<string, string> = {
      "Beginner": "0",
      "Intermediate": "2", 
      "Advanced": "5"
    }
    const jobExperience = levelMap[course.courseOutput?.level || course.level] || "1"
    
    const params = new URLSearchParams({
      jobPosition,
      jobDesc,
      jobExperience,
      fromCourse: "true"
    })
    
    router.push(`/mock/dashboard?${params.toString()}`)
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <p className="text-lg" style={{ color: "#A1A1AA" }}>Loading course...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-4 sm:py-6 md:py-8 lg:py-12 space-y-4 sm:space-y-6 md:space-y-8 max-w-screen-xl">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
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
        
        <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <CourseBasicInfo courseInfo={course} onRefresh={() => console.log("Refreshing")} edit={false} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <CourseDetail courseDetail={course} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <ChapterList course={course} onRefresh={() => console.log("Refreshing")} edit={false} />
          </CardContent>
        </Card>

        {/* Practice Interview CTA */}
        <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#0A0A0A", borderColor: "#3B82F6" }}>
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#3B82F6" }}>
                  <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1" style={{ color: "#E4E4E7" }}>
                    Ready to Test Your Skills?
                  </h3>
                  <p className="text-xs md:text-sm" style={{ color: "#A1A1AA" }}>
                    Practice interview questions based on what you learned in this course
                  </p>
                </div>
              </div>
              <Button 
                onClick={handlePracticeInterview}
                className="rounded-xl px-5 py-2.5 md:px-6 md:py-3 font-medium transition-all duration-200 hover:opacity-90 flex items-center gap-2 w-full md:w-auto"
                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
              >
                <Sparkles className="w-4 h-4" />
                Practice Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  )
}

export default Course

