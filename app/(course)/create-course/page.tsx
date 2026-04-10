"use client"

import { useContext, useEffect, useState } from "react"
import { stepperOptions } from "./_constants/stepperOptions"
import { Button } from "@/components/ui/button"
import SelectCategory from "./_components/SelectCategory"
import TopicDesc from "./_components/TopicDesc"
import SelectOption from "./_components/SelectOption"
import { UserInputContext } from "../_context/UserInputContext"
import { Sparkles, ArrowLeft, Zap } from "lucide-react"
import { generateCourseLayout } from "@/configs/ai-models"
import LoadingDialog from "./_components/LoadingDialog"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import uuid4 from "uuid4"
import { useRouter, useSearchParams } from "next/navigation"
// server-side operations moved to API endpoints to avoid bundling server packages in client
import type { CourseType } from "@/types/resume.type"
import { UserCourseListContext } from "../_context/UserCourseList.context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageContainer from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const CreateCoursePage = () => {
  const [step, setStep] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const { userInput, setUserInput } = useContext(UserInputContext)
  const { userCourseList, setUserCourseList } = useContext(UserCourseListContext)
  const { user } = useKindeBrowserClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if we have prefill data from a pathway
  const isPrefilled = searchParams?.get("prefill") === "true"
  const fromPathway = searchParams?.get("fromPathway")
  const stepTitle = searchParams?.get("stepTitle")

  // Load prefill data from URL params and sessionStorage
  useEffect(() => {
    if (isPrefilled && searchParams) {
      const category = searchParams.get("category")
      const topic = searchParams.get("topic")
      const description = searchParams.get("description")
      const difficulty = searchParams.get("difficulty")
      const duration = searchParams.get("duration")
      const chapters = searchParams.get("chapters")

      // Try to get full outline from sessionStorage
      const storedOutline = sessionStorage.getItem("pathwayCourseOutline")
      let parsedOutline = null
      if (storedOutline) {
        try {
          parsedOutline = JSON.parse(storedOutline)
          // Clear after reading to avoid stale data
          sessionStorage.removeItem("pathwayCourseOutline")
        } catch (e) {
          console.error("Error parsing stored outline:", e)
        }
      }

      // Prefill the context with pathway data
      setUserInput(prev => ({
        ...prev,
        category: category || parsedOutline?.category || prev.category,
        topic: topic || parsedOutline?.topic || prev.topic,
        description: description || parsedOutline?.description || prev.description,
        difficulty: difficulty || parsedOutline?.level || prev.difficulty,
        duration: normalizeDuration(duration || parsedOutline?.duration) || prev.duration,
        totalChapters: chapters ? parseInt(chapters, 10) : parsedOutline?.suggestedChapterCount || prev.totalChapters,
      }))

      // If we have all the data, skip to step 2 (options)
      if (category && topic && description) {
        setStep(2)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrefilled])

  // Helper to normalize duration values to match dropdown options
  function normalizeDuration(duration?: string | null): string | undefined {
    if (!duration) return undefined
    const d = duration.toLowerCase()
    if (d.includes("1") && d.includes("hour")) return "1 Hour"
    if (d.includes("2") && d.includes("hour")) return "2 Hours"
    return "More than 3 Hours"
  }

  const getUserCourses = async () => {
    if (!user?.email) return
    try {
      const resp = await fetch(`/api/courses/user?email=${encodeURIComponent(user.email)}`)
      const json = await resp.json()
      if (json?.success) {
        setUserCourseList(json.data as CourseType[])
      }
    } catch (e) {
      console.error('Error fetching user courses', e)
    }
  }

  useEffect(() => {
    if (user?.email) {
      getUserCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const allowNextStep = () => {
    if (step === 0) return !!(userInput?.category && userInput.category.length > 0)
    if (step === 1) return !!userInput?.topic && !!userInput?.description
    if (step === 2)
      return !!userInput?.difficulty && !!userInput?.duration && !!userInput?.video && !!userInput?.totalChapters
    return false
  }

  const generateCourse = async () => {
    const BASIC_PROMPT = `Generate a course tutorial on following details with field name, description, along with the chapter name about and duration: Category '${userInput?.category}' Topic '${userInput?.topic}' Description '${userInput.description}' Level '${userInput?.difficulty}' Duration '${userInput?.duration}' chapters '${userInput?.totalChapters}' in JSON format.\n`
    setLoading(true)
    try {
      const id = uuid4()
      const result = await generateCourseLayout.sendMessage(BASIC_PROMPT)
      const data = JSON.parse(result.response.text())

      // Send generated course to server to persist
      try {
        const resp = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, userInput, data, user }),
        })
        const json = await resp.json()
        if (json?.success) {
          router.replace(`/create-course/${id}`)
        } else {
          console.error('Failed to save course', json?.error)
        }
      } catch (e) {
        console.error('Error saving course', e)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-8 md:py-12 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pathway Source Banner */}
        {isPrefilled && fromPathway && (
          <Card className="mb-8 rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                    <Zap className="w-5 h-5" style={{ color: "#3B82F6" }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium" style={{ color: "#A1A1AA" }}>Creating course from pathway</p>
                    <p className="text-base font-semibold" style={{ color: "#E4E4E7" }}>
                      {fromPathway} {stepTitle && <span className="font-normal" style={{ color: "#A1A1AA" }}>→ {stepTitle}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className="rounded-lg px-3 py-1"
                    style={{ 
                      borderColor: "#3B82F6", 
                      backgroundColor: "#3B82F6/10", 
                      color: "#3B82F6" 
                    }}
                  >
                    Pre-filled
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="rounded-xl"
                    style={{ color: "#A1A1AA" }}
                  >
                    <Link href="/path">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Pathways
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardHeader className="pb-6 md:pb-8 pt-6 md:pt-8 px-4 sm:px-6 md:px-8 lg:px-12">
            {/* Back Button - Mobile Only */}
            <div className="mb-4 md:hidden">
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
            
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
                {isPrefilled ? "Customize Your Course" : "Create AI Course"}
              </CardTitle>
              <p className="text-sm md:text-base px-2" style={{ color: "#A1A1AA" }}>
                {isPrefilled 
                  ? "Review and customize the pre-filled course details from your pathway"
                  : "Build your personalized learning experience with AI-powered course generation"
                }
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 md:space-y-12 px-4 sm:px-6 md:px-8 lg:px-12 pb-8 md:pb-12">
            {/* Enhanced Stepper */}
            <div className="flex justify-center items-start w-full overflow-hidden">
              <div className="flex items-center w-full max-w-2xl">
                {stepperOptions.map((option, index) => (
                  <div key={index} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (index <= step || (isPrefilled && index <= 2)) {
                            setStep(index)
                          }
                        }}
                        disabled={index > step && !isPrefilled}
                        className={`
                          relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full 
                          transition-all duration-200 font-medium flex-shrink-0
                          ${index <= step || (isPrefilled && index <= 2) 
                            ? 'cursor-pointer hover:scale-105' 
                            : 'cursor-not-allowed opacity-50'
                          }
                        `}
                        style={{
                          backgroundColor: step >= index ? "#3B82F6" : "#27272A",
                          color: step >= index ? "#FFFFFF" : "#A1A1AA",
                          border: step === index ? "2px solid #3B82F6" : "2px solid transparent"
                        }}
                      >
                        <option.icon className="w-4 h-4 md:w-5 md:h-5" />
                        {step > index && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#22C55E" }}>
                            <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#FFFFFF" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                      <p 
                        className="mt-2 md:mt-3 text-[10px] md:text-xs lg:text-sm font-medium text-center leading-tight w-full"
                        style={{ color: step >= index ? "#E4E4E7" : "#A1A1AA" }}
                      >
                        {option.name}
                      </p>
                    </div>
                    {index !== stepperOptions.length - 1 && (
                      <div 
                        className="flex-1 h-0.5 mx-1.5 md:mx-4 rounded-full transition-all duration-300 min-w-[20px]"
                        style={{
                          backgroundColor: step > index ? "#3B82F6" : "#27272A"
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {step === 0 ? <SelectCategory /> : step === 1 ? <TopicDesc /> : <SelectOption />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "#27272A" }}>
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)} 
                disabled={step === 0}
                size="lg"
                className="rounded-xl px-8 font-medium transition-all duration-200"
                style={{
                  borderColor: "#27272A",
                  backgroundColor: step === 0 ? "#0A0A0A" : "#27272A",
                  color: "#E4E4E7"
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {stepperOptions.length - 1 === step ? (
                <Button 
                  onClick={generateCourse} 
                  disabled={!allowNextStep() || loading} 
                  size="lg"
                  className="gap-2 rounded-xl px-8 font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#3B82F6",
                    color: "#FFFFFF"
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Generating..." : "Generate Course"}
                </Button>
              ) : (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={!allowNextStep()}
                  size="lg"
                  className="rounded-xl px-8 font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#3B82F6",
                    color: "#FFFFFF"
                  }}
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <LoadingDialog loading={loading} />
      </PageContainer>
    </div>
  )
}

export default CreateCoursePage

