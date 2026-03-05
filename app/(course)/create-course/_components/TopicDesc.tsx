"use client"

import { UserInputContext } from "@/app/(course)/_context/UserInputContext"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import type { UserInputType } from "@/types/resume.type"
import { useContext } from "react"

const TopicDesc = () => {
  const { userInput, setUserInput } = useContext(UserInputContext)

  const handleInputChange = (fieldName: keyof UserInputType, value: string) => {
    setUserInput((prev) => ({ ...prev, [fieldName]: value }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 md:space-y-8">
      <div className="text-center space-y-1.5 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
          Course Details
        </h2>
        <p className="sm:text-sm" style={{ color: "#A1A1AA" }}>
          Provide information about your course topic and description
        </p>
      </div>

      <Card className="rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="space-y-2 sm:space-y-3">
            <Label 
              htmlFor="topic" 
              className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2"
              style={{ color: "#E4E4E7" }}
            >
              Course Topic
              <span className="sm:text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g., React Fundamentals, Machine Learning Basics"
              defaultValue={userInput?.topic}
              onChange={(e) => handleInputChange("topic", e.target.value)}
              className="rounded-xl h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
              style={{
                backgroundColor: "#27272A",
                borderColor: "#27272A",
                color: "#E4E4E7"
              }}
            />
            <p className="sm:text-xs" style={{ color: "#A1A1AA" }}>
              Enter a clear and concise topic for your course
            </p>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <Label 
              htmlFor="description" 
              className="sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2"
              style={{ color: "#E4E4E7" }}
            >
              Course Description
              <span className="sm:text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what students will learn in this course, the key concepts covered, and the learning outcomes..."
              defaultValue={userInput?.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={6}
              className="rounded-xl text-sm sm:text-base resize-none transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] min-h-[120px] sm:min-h-[144px]"
              style={{
                backgroundColor: "#27272A",
                borderColor: "#27272A",
                color: "#E4E4E7"
              }}
            />
            <p className="sm:text-xs" style={{ color: "#A1A1AA" }}>
              Provide a detailed description of your course content and objectives
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TopicDesc

