"use client"

import type { CourseType } from "@/types/resume.type"
import { useContext, useEffect, useState } from "react"
import CourseCard from "./CourseCard"
import { UserCourseListContext } from "@/app/(course)/_context/UserCourseList.context"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from "lucide-react"

const UserCourseList = () => {
  const { user } = useKindeBrowserClient()
  const [courses, setCourses] = useState<CourseType[] | null>(null)
  const { setUserCourseList } = useContext(UserCourseListContext)

  useEffect(() => {
    if (user && courses === null) {
      getUserCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getUserCourses = async () => {
    try {
      if (!user?.email) return;
      const resp = await fetch(`/api/courses/user?email=${encodeURIComponent(user.email)}`);
      const json = await resp.json();
      if (json?.success) {
        setCourses(json.data as CourseType[]);
        setUserCourseList(json.data as CourseType[]);
      } else {
        console.error('Failed to fetch user courses', json?.error);
      }
    } catch (error) {
      console.error('Error fetching user courses', error);
    }
  }

  if (courses?.length === 0) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Your Courses</h2>
          <p className="text-sm" style={{ color: "#A1A1AA" }}>Create your first AI-powered course to get started</p>
        </div>
        
        <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="text-center py-12 px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
              <BookOpen className="w-7 h-7" style={{ color: "#A1A1AA" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>No courses yet</h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "#A1A1AA" }}>Start your learning journey by creating your first AI-powered course</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  const inProgressCourses = courses?.filter(c => c.progress > 0 && c.progress < 100) || [];
  const otherCourses = courses?.filter(c => c.progress === 0 || c.progress >= 100) || [];

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Your Courses</h2>
        <p className="text-sm" style={{ color: "#A1A1AA" }}>Continue learning with your personalized courses</p>
      </div>
      
      {/* Separate in-progress courses */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold" style={{ color: "#E4E4E7" }}>In Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
            {inProgressCourses.map((course, index) => (
              <CourseCard key={`in-progress-${index}`} course={course} onRefresh={() => getUserCourses()} />
            ))}
          </div>
        </div>
      )}
      
      {/* All courses */}
      <div className="space-y-4">
        {otherCourses.length > 0 && inProgressCourses.length > 0 && (
          <h3 className="text-base font-semibold" style={{ color: "#E4E4E7" }}>All Courses</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
          {courses ? (
            otherCourses.map((course, index) => (
              <CourseCard key={`all-${index}`} course={course} onRefresh={() => getUserCourses()} />
            ))
          ) : (
            <>
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="rounded-2xl border overflow-hidden h-full flex flex-col" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                  <Skeleton className="h-48 w-full" style={{ backgroundColor: "#27272A" }} />
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <Skeleton className="h-4 w-3/4 mb-2" style={{ backgroundColor: "#27272A" }} />
                    <Skeleton className="h-3 w-1/3 mb-3" style={{ backgroundColor: "#27272A" }} />
                    <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: "#27272A" }}>
                      <Skeleton className="h-6 w-20" style={{ backgroundColor: "#27272A" }} />
                      <Skeleton className="h-6 w-16 ml-auto" style={{ backgroundColor: "#27272A" }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default UserCourseList

