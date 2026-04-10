"use client"
import { UserCourseListContext } from "@/app/(course)/_context/UserCourseList.context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useContext } from "react"
import { Sparkles, Rocket } from "lucide-react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"

const AddCourse = () => {
  const { userCourseList } = useContext(UserCourseListContext)
  const { isAuthenticated, user } = useKindeBrowserClient()

  if (!isAuthenticated) {
    return null
  }

  return (
    <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      <CardContent className="p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                <Rocket className="w-5 h-5" style={{ color: "#3B82F6" }} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
                Welcome back, {user?.given_name || "Creator"}!
              </h1>
            </div>
            
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "#A1A1AA" }}>
              Ready to create something amazing? Build personalized AI-powered courses in minutes.
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#A1A1AA" }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                <span>AI-Generated Content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                <span>Interactive Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                <span>Personalized Experience</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Link href="/create-course">
              <Button 
                size="lg" 
                className="rounded-xl px-8 py-6 text-base font-medium transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create AI Course
              </Button>
            </Link>
          </div>
        </div>

        {userCourseList.length > 0 && (
          <div className="mt-8 p-4 rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
            <p className="text-sm" style={{ color: "#A1A1AA" }}>
              You have <span className="font-medium" style={{ color: "#E4E4E7" }}>{userCourseList.length}</span> course{userCourseList.length !== 1 ? 's' : ''} in progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AddCourse

