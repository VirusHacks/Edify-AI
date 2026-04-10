import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Calendar, Clock, Briefcase, BarChart3 } from 'lucide-react'

function InterviewItemCard({interviewInfo}) {
   const router=useRouter()
    const onStart=()=>{
       router.push(`/mock/dashboard/interview/${interviewInfo?.mockId}`)
    }
    const onFeedback=()=>{
        router.push(`/mock/dashboard/interview/${interviewInfo.mockId}/feedback`)
    }

  return (
    <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group h-80 flex flex-col" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1 transition-colors" style={{ color: "#E4E4E7" }}>
                {interviewInfo?.jobPosition}
              </h3>
            </div>
          </div>
          <Badge className="rounded-lg" style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#A1A1AA" }}>
            Mock Interview
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: "#27272A" }}>
            <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: "#A1A1AA" }}>
              {interviewInfo.jobDesc}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3" style={{ color: "#A1A1AA" }}>
              <Clock className="w-4 h-4" style={{ color: "#3B82F6" }} />
              <span className="text-sm">{interviewInfo?.jobExperience} Years Experience</span>
            </div>
            <div className="flex items-center gap-3" style={{ color: "#A1A1AA" }}>
              <Calendar className="w-4 h-4" style={{ color: "#3B82F6" }} />
              <span className="text-sm">Created {interviewInfo.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onFeedback}
            className="flex-1 rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Feedback
          </Button>
          <Button 
            onClick={onStart}
            className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-90 font-medium"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
          >
            Start Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default InterviewItemCard