"use client"

import { UserInputContext } from "@/app/(course)/_context/UserInputContext"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import type { UserInputType } from "@/types/resume.type"
import { useContext } from "react"
import { GraduationCap, Clock, Video, FileText } from "lucide-react"

const SelectOption = () => {
  const { userInput, setUserInput } = useContext(UserInputContext)

  const handleInputChange = (fieldName: keyof UserInputType, value: string | number) => {
    setUserInput((prev) => ({ ...prev, [fieldName]: value }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
          Course Configuration
        </h2>
        <p className="text-sm" style={{ color: "#A1A1AA" }}>
          Configure the settings and structure for your course
        </p>
      </div>

      <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label 
                htmlFor="difficulty" 
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "#E4E4E7" }}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                  <GraduationCap className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
                Difficulty Level
                <span className="text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
              </Label>
              <Select
                onValueChange={(value) => handleInputChange("difficulty", value)}
                defaultValue={userInput?.difficulty}
              >
                <SelectTrigger 
                  id="difficulty"
                  className="rounded-xl h-12 text-base transition-all duration-200"
                  style={{
                    backgroundColor: "#27272A",
                    borderColor: "#27272A",
                    color: "#E4E4E7"
                  }}
                >
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent 
                  className="rounded-xl"
                  style={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "#27272A"
                  }}
                >
                  <SelectItem value="Beginner" style={{ color: "#E4E4E7" }}>Beginner</SelectItem>
                  <SelectItem value="Intermediate" style={{ color: "#E4E4E7" }}>Intermediate</SelectItem>
                  <SelectItem value="Advanced" style={{ color: "#E4E4E7" }}>Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label 
                htmlFor="duration" 
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "#E4E4E7" }}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                  <Clock className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
                Course Duration
                <span className="text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
              </Label>
              <Select 
                onValueChange={(value) => handleInputChange("duration", value)} 
                defaultValue={userInput?.duration}
              >
                <SelectTrigger 
                  id="duration"
                  className="rounded-xl h-12 text-base transition-all duration-200"
                  style={{
                    backgroundColor: "#27272A",
                    borderColor: "#27272A",
                    color: "#E4E4E7"
                  }}
                >
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent 
                  className="rounded-xl"
                  style={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "#27272A"
                  }}
                >
                  <SelectItem value="1 Hour" style={{ color: "#E4E4E7" }}>1 Hour</SelectItem>
                  <SelectItem value="2 Hours" style={{ color: "#E4E4E7" }}>2 Hours</SelectItem>
                  <SelectItem value="More than 3 Hours" style={{ color: "#E4E4E7" }}>More than 3 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label 
                htmlFor="video" 
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "#E4E4E7" }}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                  <Video className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
                Include Videos
                <span className="text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
              </Label>
              <Select 
                onValueChange={(value) => handleInputChange("video", value)} 
                defaultValue={userInput?.video}
              >
                <SelectTrigger 
                  id="video"
                  className="rounded-xl h-12 text-base transition-all duration-200"
                  style={{
                    backgroundColor: "#27272A",
                    borderColor: "#27272A",
                    color: "#E4E4E7"
                  }}
                >
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent 
                  className="rounded-xl"
                  style={{
                    backgroundColor: "#0A0A0A",
                    borderColor: "#27272A"
                  }}
                >
                  <SelectItem value="Yes" style={{ color: "#E4E4E7" }}>Yes</SelectItem>
                  <SelectItem value="No" style={{ color: "#E4E4E7" }}>No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label 
                htmlFor="totalChapters" 
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "#E4E4E7" }}
              >
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                  <FileText className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
                Number of Chapters
                <span className="text-xs font-normal" style={{ color: "#A1A1AA" }}>(Required)</span>
              </Label>
              <Input
                id="totalChapters"
                type="number"
                min="1"
                max="50"
                onChange={(e) => handleInputChange("totalChapters", parseInt(e.target.value) || 0)}
                defaultValue={userInput?.totalChapters}
                placeholder="e.g., 5"
                className="rounded-xl h-12 text-base transition-all duration-200"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
              <p className="text-xs" style={{ color: "#A1A1AA" }}>
                Specify how many chapters your course should have
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SelectOption

