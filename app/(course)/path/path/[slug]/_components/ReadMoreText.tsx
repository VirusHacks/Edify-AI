"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReadMoreTextProps {
  text: string
  maxLength?: number
  className?: string
}

export default function ReadMoreText({ text, maxLength = 200, className = "" }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const shouldTruncate = text.length > maxLength
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, maxLength)}...` : text

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>
  }

  return (
    <div className={className}>
      <p className="mb-2 text-[#A1A1AA]">{displayText}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#3B82F6] hover:text-[#60A5FA] hover:bg-[#1f2937] p-0 h-auto font-medium text-sm"
      >
        {isExpanded ? (
          <>
            Read less <ChevronUp className="w-4 h-4 ml-1 inline" />
          </>
        ) : (
          <>
            Read more <ChevronDown className="w-4 h-4 ml-1 inline" />
          </>
        )}
      </Button>
    </div>
  )
}

