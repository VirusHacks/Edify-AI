"use client"

import { CheckCircle, Circle } from "lucide-react"

interface ProgressTimelineProps {
  totalSteps: number
  completedSteps: number
}

export default function ProgressTimeline({ totalSteps, completedSteps }: ProgressTimelineProps) {
  const maxVisibleSteps = Math.min(totalSteps, 10) // Show max 10 steps in timeline for readability
  
  return (
    <div className="relative py-2">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#27272A]"></div>
      <div 
        className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] transition-all duration-500"
        style={{ height: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
      ></div>
      
      <div className="relative space-y-4">
        {Array.from({ length: maxVisibleSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber <= completedSteps
          const isCurrent = stepNumber === completedSteps + 1
          
          return (
            <div key={index} className="relative flex items-center gap-3">
              <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-700/30' 
                  : isCurrent
                  ? 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] shadow-md shadow-[#3B82F6]/30 ring-2 ring-[#3B82F6]/20'
                  : 'bg-[#0A0A0A] border-2 border-[#27272A]'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Circle className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#A1A1AA]'}`} fill="currentColor" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium truncate ${
                  isCompleted ? 'text-green-400' : isCurrent ? 'text-[#3B82F6]' : 'text-[#A1A1AA]'
                }`}>
                  Step {stepNumber}
                </div>
              </div>
            </div>
          )
        })}
        {totalSteps > maxVisibleSteps && (
          <div className="text-xs text-[#A1A1AA] text-center pt-2">
            +{totalSteps - maxVisibleSteps} more steps
          </div>
        )}
      </div>
    </div>
  )
}

