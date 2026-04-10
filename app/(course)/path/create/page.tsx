'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Wand2, Sparkles, BookOpen, CheckCircle2, Target, Zap } from 'lucide-react'
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { createPathway } from "../action"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

function CreatePathContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [career, setCareer] = useState("")
  const [description, setDescription] = useState("")
  const [isFromDiscovery, setIsFromDiscovery] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if coming from discovery and pre-fill form
  useEffect(() => {
    const fromDiscovery = searchParams?.get("fromDiscovery") === "true"
    const careerParam = searchParams?.get("career")
    
    if (fromDiscovery) {
      setIsFromDiscovery(true)
      
      // Try to get suggested pathway from sessionStorage
      const suggestedPathwayStr = sessionStorage.getItem('suggestedPathway')
      if (suggestedPathwayStr) {
        try {
          const suggested = JSON.parse(suggestedPathwayStr)
          setCareer(suggested.career || careerParam || "")
          // Format description nicely
          const formattedDesc = suggested.description || ""
          setDescription(formattedDesc)
          // Clear after reading
          sessionStorage.removeItem('suggestedPathway')
        } catch (e) {
          console.error('Error parsing suggested pathway:', e)
          // Fallback to URL param
          if (careerParam) {
            setCareer(decodeURIComponent(careerParam))
          }
        }
      } else if (careerParam) {
        // Fallback to URL param if no sessionStorage
        setCareer(decodeURIComponent(careerParam))
      }
    } else if (careerParam) {
      // Just career param without discovery flag
      setCareer(decodeURIComponent(careerParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGenerating(true)
    try {
      const pathway = await createPathway(career, description)
      router.push(`/path/path/${pathway.slug}`)
    } catch (error) {
      console.error('Failed to generate pathway:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              variant="ghost" 
              asChild 
              className="text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A] -ml-2 h-8 px-2"
            >
              <Link href="/path" className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Back to pathways</span>
              </Link>
            </Button>
          </motion.div>

          {/* Header Section - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center space-y-2"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#27272A] border border-[#3F3F46]">
              <Sparkles className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E4E4E7]">
              {isFromDiscovery ? 'Review & Create Your Pathway' : 'Create Custom Learning Path'}
            </h1>
            <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto">
              {isFromDiscovery 
                ? "We&apos;ve pre-filled this form based on your interests. Feel free to edit and customize before generating your pathway."
                : "Describe your desired career path and we&apos;ll generate a personalized learning journey for you."}
            </p>
            {isFromDiscovery && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Suggested for you
                </Badge>
              </div>
            )}
          </motion.div>

          {/* Form Card - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl shadow-lg">
              <CardHeader className="space-y-1 pb-4 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#27272A] border border-[#3F3F46] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-[#E4E4E7]">
                    Path Details
                  </CardTitle>
                </div>
                <CardDescription className="text-[#A1A1AA] text-sm pt-1">
                  {isFromDiscovery 
                    ? "Review the suggested pathway details below. You can edit any field to customize it to your preferences."
                    : "Provide details about your career goals to create a tailored learning experience."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="career" className="text-sm font-medium text-[#E4E4E7]">
                      Career Title
                    </Label>
                    <Input
                      id="career"
                      value={career}
                      onChange={(e) => setCareer(e.target.value)}
                      placeholder="e.g., Machine Learning Engineer, Data Scientist, Frontend Developer"
                      className="h-10 bg-[#0A0A0A] border-[#27272A] text-[#E4E4E7] placeholder:text-[#A1A1AA] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-sm font-medium text-[#E4E4E7]">
                      Career Description & Goals
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your career goals, specific areas you'd like to focus on, current skill level, and any particular technologies or domains you're interested in..."
                      className="min-h-[100px] bg-[#0A0A0A] border-[#27272A] text-[#E4E4E7] placeholder:text-[#A1A1AA] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20 rounded-xl resize-none text-sm"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-10 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-semibold rounded-xl shadow-lg shadow-[#3B82F6]/20 transition-all duration-200 text-sm mt-2"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                        <span>Generating your personalized path...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        <span>Generate Learning Path</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Section - Compact, Optional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="grid grid-cols-3 gap-2 pt-2"
          >
            <div className="text-center p-3 rounded-xl bg-[#0A0A0A] border border-[#27272A] hover:border-[#3B82F6]/30 transition-colors">
              <BookOpen className="w-4 h-4 text-[#3B82F6] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">Personalized</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#0A0A0A] border border-[#27272A] hover:border-[#3B82F6]/30 transition-colors">
              <Sparkles className="w-4 h-4 text-[#3B82F6] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">AI-Powered</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#0A0A0A] border border-[#27272A] hover:border-[#3B82F6]/30 transition-colors">
              <Target className="w-4 h-4 text-[#3B82F6] mx-auto mb-1.5" />
              <p className="text-xs text-[#A1A1AA]">Step-by-Step</p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

export default function CreatePath() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3B82F6] border-t-transparent mx-auto" />
          <p className="text-[#A1A1AA] text-sm">Loading...</p>
        </div>
      </main>
    }>
      <CreatePathContent />
    </Suspense>
  )
}
