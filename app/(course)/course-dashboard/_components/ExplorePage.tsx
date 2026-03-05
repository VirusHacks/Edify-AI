"use client"

import type { CourseType } from "@/types/resume.type"
import { useEffect, useState } from "react"
import CourseCard from "./CourseCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"

const ExplorePage = () => {
  const [courseList, setCourseList] = useState<CourseType[] | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  const getAllCourses = async () => {
    try {
      const resp = await fetch(`/api/courses?page=${pageIndex}&limit=8`);
      const json = await resp.json();
      if (json?.success) {
        setCourseList(json.data as CourseType[]);
      } else {
        console.error('Failed to fetch courses', json?.error);
      }
    } catch (error) {
      console.error('Error fetching courses', error);
    }
  }

  useEffect(() => {
    getAllCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  return (
    <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      <CardHeader className="pb-4 space-y-1">
        <CardTitle className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Explore More Courses</CardTitle>
        <p className="text-sm" style={{ color: "#A1A1AA" }}>
          Discover courses built with AI by other users
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-fr">
          {courseList ? (
            courseList?.map((course) => (
              <CourseCard key={course.courseId} course={course} onRefresh={() => getAllCourses()} displayUser={true} />
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

        <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: "#27272A" }}>
          <Button 
            onClick={() => setPageIndex(pageIndex - 1)} 
            disabled={pageIndex === 0} 
            variant="outline"
            size="sm"
            className="rounded-lg"
            style={{ 
              borderColor: "#27272A",
              backgroundColor: pageIndex === 0 ? "#0A0A0A" : "#27272A",
              color: "#E4E4E7"
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Badge variant="secondary" className="text-sm rounded-lg px-3 py-1" style={{ backgroundColor: "#27272A", color: "#A1A1AA" }}>
            Page {pageIndex + 1}
          </Badge>
          <Button 
            onClick={() => setPageIndex(pageIndex + 1)} 
            disabled={courseList?.length !== 8} 
            variant="outline"
            size="sm"
            className="rounded-lg"
            style={{ 
              borderColor: "#27272A",
              backgroundColor: courseList?.length !== 8 ? "#0A0A0A" : "#27272A",
              color: "#E4E4E7"
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExplorePage

