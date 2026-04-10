import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, BookOpen, GraduationCap, ExternalLink, Star, Target, TrendingUp, Calendar } from 'lucide-react'
import Link from "next/link"
import { getPathway, getUserProgress } from "../../action"
import PageContainer from "@/components/layout/PageContainer"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import StepCompletion from "./_components/StepCompletion"
import ReadMoreText from "./_components/ReadMoreText"
import ProgressTimeline from "./_components/ProgressTimeline"
import CollapsibleResources from "./_components/CollapsibleResources"
import BuildCourseButton from "./_components/BuildCourseButton"
import CreatePathwayCourseButton from "./_components/CreatePathwayCourseButton"
import MobileBackButton from "./_components/MobileBackButton"

export default async function PathPage({ params }: { params: { slug: string } }) {
  type PathStep = {
    title: string;
    description: string;
    resources?: { title: string; url: string }[];
    estimatedTime?: string;
  }

  type Pathway = {
    id: number;
    slug: string;
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: string;
    prerequisites: string[];
    steps: PathStep[];
  }
  const { isAuthenticated, getUser } = getKindeServerSession()
  
  if (!(await isAuthenticated())) {
    redirect("/sign-in")
  }

  const user = await getUser()
  const userId = user?.id || ''
  const pathway = (await getPathway(params.slug)) as Pathway;
  const completedSteps = await getUserProgress(userId, pathway.id)

  const progressPercent = pathway.steps.length > 0 
    ? Math.round((completedSteps / pathway.steps.length) * 100) 
    : 0

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7]">
      {/* Compact Header with Back Button */}
      <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 py-3 sm:py-4 md:py-6">
        {/* Mobile Back Button */}
        <MobileBackButton />
        
        {/* Desktop Back Button */}
        <div className="hidden md:block mb-3 md:mb-4">
          <Button variant="ghost" asChild className="text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A]">
            <Link href="/path" className="flex items-center gap-2 text-sm md:text-base">
              <ArrowLeft className="h-4 w-4" />
              Back to learning paths
            </Link>
          </Button>
        </div>

        {/* Pathway Header */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#E4E4E7] leading-tight">
              {pathway.title}
            </h1>
            <div className="mt-2 md:mt-0">
              <CreatePathwayCourseButton
                pathwayTitle={pathway.title}
                pathwayDescription={pathway.description}
                pathwayDifficulty={pathway.difficulty}
                pathwayEstimatedTime={pathway.estimatedTime}
                steps={pathway.steps.map(s => ({
                  title: s.title,
                  description: s.description,
                  estimatedTime: s.estimatedTime,
                }))}
              />
            </div>
          </div>
          <p className="text-[#A1A1AA] text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-relaxed">
            {pathway.description}
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
            <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA] bg-transparent px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-[#3B82F6]" />
              {pathway.estimatedTime}
            </Badge>
            <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA] bg-transparent px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
              <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-[#3B82F6]" />
              {pathway.difficulty}
            </Badge>
            <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA] bg-transparent px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
              <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-[#3B82F6]" />
              {pathway.steps.length} Steps
            </Badge>
          </div>
        </div>
      </div>

      <PageContainer>
        <div className="max-w-screen-xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6">
          {/* Enhanced Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Main Progress Card */}
            <Card className="lg:col-span-2 bg-transparent rounded-xl sm:rounded-2xl border border-[#27272A] shadow-sm transition-shadow duration-200">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#E4E4E7] flex items-center gap-1.5 sm:gap-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" />
                    Your Progress
                  </h3>
                  <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium">
                    {completedSteps} of {pathway.steps.length} steps completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-2">
                  <div className="relative w-full h-3 bg-[#121212] rounded-full overflow-hidden border border-[#27272A]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-[#A1A1AA]">{progressPercent}% complete</p>
                    {progressPercent > 0 && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
                        <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" />
                        <span>Great progress!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[#27272A]">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-[#E4E4E7]">{completedSteps}</div>
                    <div className="text-[10px] sm:text-xs text-[#A1A1AA] mt-0.5 sm:mt-1">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-[#3B82F6]">{pathway.steps.length - completedSteps}</div>
                    <div className="text-[10px] sm:text-xs text-[#A1A1AA] mt-0.5 sm:mt-1">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-[#E4E4E7]">{pathway.steps.length}</div>
                    <div className="text-[10px] sm:text-xs text-[#A1A1AA] mt-0.5 sm:mt-1">Total Steps</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Timeline Card */}
            <Card className="bg-transparent rounded-xl sm:rounded-2xl border border-[#27272A] shadow-sm transition-shadow duration-200">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-[#E4E4E7] flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3B82F6]" />
                  Timeline
                </h3>
              </CardHeader>
              <CardContent className="pb-2 p-3 sm:p-6 pt-0 sm:pt-0">
                <ProgressTimeline totalSteps={pathway.steps.length} completedSteps={completedSteps} />
              </CardContent>
            </Card>
          </div>

          {/* Prerequisites Section */}
          {pathway.prerequisites && pathway.prerequisites.length > 0 && (
            <Card className="bg-transparent rounded-xl sm:rounded-2xl border border-[#27272A] shadow-sm transition-shadow duration-200">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#E4E4E7] flex items-center gap-1.5 sm:gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" />
                  Prerequisites
                </h3>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-1.5 sm:space-y-2">
                  {pathway.prerequisites.map((prereq: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-transparent rounded-lg hover:bg-[#0f0f0f] transition-colors border border-[#27272A]">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#3B82F6] mt-1.5 sm:mt-2 flex-shrink-0"></div>
                      <span className="text-[#E4E4E7] font-medium text-xs sm:text-sm leading-relaxed">{prereq}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Steps */}
          <div className="space-y-3 sm:space-y-4">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#E4E4E7] mb-1.5 sm:mb-2">Learning Journey</h2>
              <p className="text-[#A1A1AA] text-xs sm:text-sm">Follow these steps to master your learning path</p>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
              {pathway.steps.map((step: PathStep, index: number) => {
                const stepNumber = index + 1
                const isCompleted = stepNumber <= completedSteps
                const isCurrentStep = stepNumber === completedSteps + 1
                
                return (
                  <Card 
                    key={index} 
                    id={`step-${stepNumber}`}
                    className={`bg-transparent rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                      isCompleted 
                        ? 'border-green-600 bg-[#052e0f]/10 shadow-sm' 
                        : isCurrentStep
                        ? 'border-[#3B82F6] shadow-md ring-2 ring-[#3B82F6]/10 hover:ring-[#3B82F6]/20'
                        : 'border-[#27272A] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                        {/* Step Number Badge with Timeline Connector */}
                        <div className="relative flex flex-col items-center">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl shadow-md flex-shrink-0 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : isCurrentStep
                              ? 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] scale-105'
                              : 'bg-[#1f1f1f]'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                            ) : (
                              <span className={isCurrentStep ? 'animate-pulse' : ''}>{stepNumber}</span>
                            )}
                          </div>
                          {/* Timeline line to next step */}
                          {index < pathway.steps.length - 1 && (
                            <div className={`absolute top-10 sm:top-12 md:top-14 left-1/2 transform -translate-x-1/2 w-0.5 h-4 sm:h-6 md:h-8 ${
                              isCompleted ? 'bg-gradient-to-b from-green-500 to-green-300' : 'bg-slate-200'
                            }`}></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className={`text-base sm:text-lg md:text-xl mb-1.5 sm:mb-2 leading-tight ${
                            isCompleted ? 'text-green-400' : isCurrentStep ? 'text-[#3B82F6]' : 'text-[#E4E4E7]'
                          }`}>
                            {stepNumber}. {step.title}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap mb-1.5 sm:mb-2">
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] sm:text-xs ${
                                isCompleted 
                                  ? 'border-green-600 text-green-400 bg-transparent'
                                  : isCurrentStep
                                  ? 'border-[#3B82F6]/30 text-[#3B82F6] bg-transparent'
                                  : 'border-[#27272A] text-[#A1A1AA] bg-transparent'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              {step.estimatedTime}
                            </Badge>
                            <span className="text-[10px] sm:text-xs text-gray-500">Step {stepNumber} of {pathway.steps.length}</span>
                            {isCompleted && (
                              <Badge className="bg-transparent text-green-400 border-green-600 text-[10px] sm:text-xs">
                                ✓ Completed
                              </Badge>
                            )}
                            {isCurrentStep && (
                              <Badge className="bg-transparent text-[#3B82F6] border-[#3B82F6]/20 text-[10px] sm:text-xs">
                                Current Step
                              </Badge>
                            )}
                          </div>
                          
                          {/* Description with Read More */}
                          <div className="mt-1">
                            <ReadMoreText 
                              text={step.description} 
                              maxLength={250}
                              className="text-[#A1A1AA] text-sm sm:text-base leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                      {/* Learning Resources - Collapsible */}
                      {step.resources && step.resources.length > 0 && (
                        <CollapsibleResources 
                          resources={step.resources} 
                          defaultOpen={isCurrentStep || isCompleted}
                        />
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 sm:pt-3 border-t border-[#27272A]">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                          <div className="flex-1 sm:flex-initial">
                            <StepCompletion 
                              stepIndex={index} 
                              stepNumber={stepNumber}
                              isCompleted={isCompleted}
                              userId={userId}
                              pathwayId={pathway.id}
                              totalSteps={pathway.steps.length}
                              currentCompletedSteps={completedSteps}
                            />
                          </div>
                          
                          {/* Build Course Button */}
                          <div className="flex-1 sm:flex-initial">
                            <BuildCourseButton
                              pathwayTitle={pathway.title}
                              pathwayDifficulty={pathway.difficulty}
                              stepTitle={step.title}
                              stepDescription={step.description}
                              stepResources={step.resources}
                              estimatedTime={step.estimatedTime}
                              variant="compact"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  )
}
