"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, BookOpen } from "lucide-react"
import { useState, useTransition, useEffect } from "react"
import { updateUserProgress } from "../../../action"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface StepCompletionProps {
  stepIndex: number
  stepNumber: number
  isCompleted: boolean
  userId: string
  pathwayId: number
  totalSteps: number
  currentCompletedSteps: number
}

export default function StepCompletion({
  stepIndex,
  stepNumber,
  isCompleted,
  userId,
  pathwayId,
  totalSteps,
  currentCompletedSteps,
}: StepCompletionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localCompleted, setLocalCompleted] = useState(isCompleted)

  // Sync local state when props change (after refresh)
  useEffect(() => {
    setLocalCompleted(isCompleted)
  }, [isCompleted])

  const toggleCompletion = async () => {
    startTransition(async () => {
      try {
        let newCompletedSteps: number
        
        if (localCompleted) {
          // Unmarking: set to the step before this one
          // If this is step 1, set to 0
          newCompletedSteps = Math.max(0, stepIndex)
        } else {
          // Marking: set to this step number (ensures all previous steps are considered complete)
          // Only allow if this is the next step to complete or if user is catching up
          if (stepNumber > currentCompletedSteps + 1) {
            // User is trying to mark a future step - don't allow skipping
            toast.warning(`Please complete step ${currentCompletedSteps + 1} first`)
            return
          }
          newCompletedSteps = stepNumber
        }
        
        await updateUserProgress(userId, pathwayId, newCompletedSteps)
        
        setLocalCompleted(!localCompleted)
        
        // Show success toast
        if (!localCompleted) {
          toast.success("Step marked as complete! 🎉")
        } else {
          toast.info("Step unmarked")
        }
        
        // Refresh the page to show updated progress
        router.refresh()
      } catch (error) {
        console.error("Error updating progress:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        toast.error(`Failed to update progress: ${errorMessage}`)
      }
    })
  }

  const isActuallyCompleted = localCompleted

  return (
    <Button 
      onClick={toggleCompletion}
      disabled={isPending}
      variant={isActuallyCompleted ? "outline" : "default"} 
      className={`w-full h-12 text-base font-semibold rounded-xl transition-all duration-200 ${
        isActuallyCompleted 
          ? "border-2 border-green-600 text-green-400 bg-transparent hover:bg-[#072005]" 
          : "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white hover:shadow-lg"
      }`}
    >
      {isPending ? (
        <>
          <div className={`w-5 h-5 border-2 ${isActuallyCompleted ? 'border-green-400' : 'border-white'} border-t-transparent rounded-full animate-spin mr-3`} />
          <span>Updating...</span>
        </>
      ) : isActuallyCompleted ? (
        <>
          <CheckCircle className="mr-3 h-5 w-5 text-green-400" />
          <span>Step Completed</span>
        </>
      ) : (
        <>
          <BookOpen className="mr-3 h-5 w-5 text-white" />
          <span>Mark as Complete</span>
        </>
      )}
    </Button>
  )
}

