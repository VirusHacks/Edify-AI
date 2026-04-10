"use client"

import type { ChapterContentType, ChapterType, CourseType } from "@/types/resume.type"
import { useEffect, useState } from "react"
import ChapterListCard from "./_components/ChapterListCard"
import ChapterContent from "./_components/ChapterContent"
import Image from "next/image"
import UserToolTip from "./_components/UserToolTip"
import ScrollProgress from "@/components/ui/scroll-progress"
import QuizModal from "./_components/QuizModal"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Clock, ArrowLeft, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Dynamic import to avoid SSR issues with react-speech-recognition
const ChatbotModal = dynamic(() => import("./_components/Chatbot"), {
  ssr: false,
  loading: () => null,
})

type CourseStartProps = {
  params: { courseId: string }
}

const CourseStart = ({ params }: CourseStartProps) => {
  const [course, setCourse] = useState<CourseType | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<ChapterType | null>(null)
  const [chapterContent, setChapterContent] = useState<ChapterContentType | null>(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    if (params?.courseId && !course) {
      getCourse()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.courseId])

  const getChapterContent = async (chapterId: number) => {
    try {
      if (!course) return
      // Request detailed chapter content from server by chapter index
      const resp = await fetch(`/api/courses/${encodeURIComponent(course.courseId)}/chapters/${chapterId}`)
      const json = await resp.json()
      if (json?.success) {
        setChapterContent(json.data as ChapterContentType)
      } else {
        console.error('Failed to fetch chapter content', json?.error)
      }
    } catch (e) {
      console.error('Error fetching chapter content', e)
    }
  }

  const handleNext = () => {
    if (chapterContent?.quiz) {
      setIsQuizOpen(true)
    } else {
      // Handle next chapter logic here
    }
  }

  if (!course)
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: "#0A0A0A" }}>
        <p className="text-lg" style={{ color: "#A1A1AA" }}>Loading course...</p>
      </div>
    )

  const SidebarContent = () => (
    <>
      {/* Course Header */}
      <div className="p-4 md:p-6 border-b" style={{ borderColor: "#27272A" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#3B82F6" }}>
            <span className="text-white font-semibold text-sm">
              {course?.courseOutput.topic.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base md:text-lg line-clamp-2" style={{ color: "#E4E4E7" }}>
              {course?.courseOutput.topic}
            </h1>
            <p className="text-xs md:text-sm" style={{ color: "#A1A1AA" }}>{course?.courseOutput.chapters.length} chapters</p>
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-2">
          {course?.courseOutput.chapters.map((chapter, index) => (
            <div
              key={index}
              className={`group cursor-pointer rounded-xl p-3 md:p-4 transition-all duration-200 ${
                selectedChapter?.chapter_name === chapter.chapter_name
                  ? "border"
                  : "border border-transparent"
              }`}
              style={{
                backgroundColor: selectedChapter?.chapter_name === chapter.chapter_name ? "#27272A" : "transparent",
                borderColor: selectedChapter?.chapter_name === chapter.chapter_name ? "#3B82F6" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (selectedChapter?.chapter_name !== chapter.chapter_name) {
                  e.currentTarget.style.backgroundColor = "#27272A"
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChapter?.chapter_name !== chapter.chapter_name) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
              onClick={() => {
                setSelectedChapter(chapter)
                getChapterContent(index)
                setIsMobileMenuOpen(false)
              }}
            >
              <ChapterListCard chapter={chapter} index={index} />
            </div>
          ))}
          
          {/* Forum Link */}
          <div
            className="group cursor-pointer rounded-xl p-3 md:p-4 transition-all duration-200 border border-transparent"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#27272A"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            onClick={() => {
              router.push(`/forum/${course.id}`)
              setIsMobileMenuOpen(false)
            }}
          >
            <ChapterListCard
              chapter={{
                chapter_name: "Discussion Forum",
                description: "Connect with other learners",
                duration: "∞",
              }}
              index={course.courseOutput.chapters.length}
            />
          </div>

          {/* Practice Interview Link */}
          <div
            className="group cursor-pointer rounded-xl p-3 md:p-4 transition-all duration-200 border border-transparent"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#27272A"
              e.currentTarget.style.borderColor = "#3B82F6"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.borderColor = "transparent"
            }}
            onClick={() => {
              // Build job description from course data
              const topic = course.courseOutput?.topic || course.courseName || ""
              const chapters = course.courseOutput?.chapters || []
              const skills = chapters.map(ch => ch.chapter_name).join(", ")
              const category = course.category || ""
              const level = course.courseOutput?.level || course.level || ""
              const jobDesc = `${topic} - ${category}. Key topics: ${skills}. Level: ${level}`
              
              const levelMap: Record<string, string> = {
                "Beginner": "0",
                "Intermediate": "2", 
                "Advanced": "5"
              }
              const jobExperience = levelMap[level] || "1"
              
              const params = new URLSearchParams({
                jobPosition: topic,
                jobDesc,
                jobExperience,
                fromCourse: "true"
              })
              
              router.push(`/mock/dashboard?${params.toString()}`)
              setIsMobileMenuOpen(false)
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate transition-colors text-sm md:text-base" style={{ color: "#E4E4E7" }}>
                  Practice Interview
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3" style={{ color: "#A1A1AA" }} />
                  <span className="text-xs" style={{ color: "#A1A1AA" }}>
                    AI Mock Interview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row h-screen">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: "#27272A" }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="rounded-xl transition-all duration-200 hover:opacity-90 flex-shrink-0"
              style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sm line-clamp-1" style={{ color: "#E4E4E7" }}>
                {course?.courseOutput.topic}
              </h1>
            </div>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl transition-all duration-200 hover:opacity-90 flex-shrink-0"
                style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] overflow-y-auto p-0"
              style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
            >
              <SheetHeader className="p-4 border-b" style={{ borderColor: "#27272A" }}>
                <SheetTitle className="text-left" style={{ color: "#E4E4E7" }}>Chapters</SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 h-full border-r flex-col" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto relative" style={{ backgroundColor: "#0A0A0A" }}>
          {selectedChapter ? (
            <div>
              <ChapterContent
                course={course}
                chapter={selectedChapter}
                content={chapterContent}
                handleNext={handleNext}
              />
              {isQuizOpen && chapterContent?.quiz && (
                <QuizModal
                  isOpen={isQuizOpen}
                  onClose={() => setIsQuizOpen(false)}
                  questions={chapterContent.quiz}
                  courseId={course.courseId}
                  totalChapters={course.courseOutput.chapters.length}
                />
              )}
              <ScrollProgress />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-8 md:p-12">
              <div className="max-w-2xl text-center w-full">
                {/* Course Banner */}
                <div className="mb-6 md:mb-8">
                  <div className="relative inline-block">
                    <Image
                      src={course.courseBanner || "/thumbnail.png"}
                      alt={course.courseName || "AI Course Generator"}
                      width={400}
                      height={240}
                      priority
                      className="rounded-xl md:rounded-2xl hover:scale-105 transition-transform duration-500 cursor-pointer opacity-90 w-full max-w-[400px] h-auto"
                    />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="mb-6 md:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4" style={{ color: "#E4E4E7" }}>
                    Welcome to {course.courseOutput.topic}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg leading-relaxed px-4" style={{ color: "#A1A1AA" }}>
                    Ready to start your learning journey? Select a chapter from the sidebar to begin exploring this course.
                  </p>
                </div>

                {/* Course Stats */}
                <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 mb-6 md:mb-8">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#E4E4E7" }}>{course.courseOutput.chapters.length}</div>
                    <div className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>Chapters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#E4E4E7" }}>{course.level}</div>
                    <div className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#E4E4E7" }}>{course.category}</div>
                    <div className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>Category</div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="mt-6 md:mt-8">
                  <UserToolTip
                    username={course.username || "AI Course Generator"}
                    userProfileImage={course.userprofileimage || "/userProfile.png"}
                  />
                </div>
              </div>
            </div>
          )}
          <ChatbotModal course={course} />
        </div>
      </div>
    </div>
  )
}

export default CourseStart

