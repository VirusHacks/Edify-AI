"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { useState, useEffect } from "react"

const LoadingDialog = ({ loading }: { loading: boolean }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <AlertDialog open={loading}>
      <AlertDialogContent 
        className="rounded-2xl border max-w-md" 
        style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
      >
        <AlertDialogHeader className="flex flex-col items-center space-y-4 p-6">
          <div className="relative">
            <Image 
              src="/rocket.gif" 
              alt="loading" 
              width={120} 
              height={120} 
              priority 
              className="rounded-xl"
            />
          </div>
          <AlertDialogTitle 
            className="text-xl md:text-2xl font-bold text-center tracking-tight" 
            style={{ color: "#E4E4E7" }}
          >
            Generating Your Course
          </AlertDialogTitle>
          <AlertDialogDescription 
            className="text-center text-sm leading-relaxed max-w-sm"
            style={{ color: "#A1A1AA" }}
          >
            Our AI is crafting a personalized course structure tailored to your requirements. This may take a few moments...
          </AlertDialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#3B82F6" }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse delay-75" style={{ backgroundColor: "#3B82F6" }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: "#3B82F6" }}></div>
          </div>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LoadingDialog

