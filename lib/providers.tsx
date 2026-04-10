"use client"

import { useState, type ReactNode } from "react"
import { ThemeProvider } from "@/context/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import QueryProvider from "@/context/query-provider"
import StreamVideoProvider from "@/lib/streamClientProvider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { UserInputContext } from "@/app/(course)/_context/UserInputContext"
import { UserCourseListContext } from "@/app/(course)/_context/UserCourseList.context"
import type { CourseType, UserInputType } from "@/types/resume.type"

export function AllProviders({ children }: { children: ReactNode }) {
  // Course contexts state
  const [userInput, setUserInput] = useState<UserInputType>({})
  const [userCourseList, setUserCourseList] = useState<CourseType[]>([])

  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <StreamVideoProvider>
          <SidebarProvider>
            <UserInputContext.Provider value={{ userInput, setUserInput }}>
              <UserCourseListContext.Provider value={{ userCourseList, setUserCourseList }}>
                {children}
                <Toaster />
                <SonnerToaster />
              </UserCourseListContext.Provider>
            </UserInputContext.Provider>
          </SidebarProvider>
        </StreamVideoProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}

