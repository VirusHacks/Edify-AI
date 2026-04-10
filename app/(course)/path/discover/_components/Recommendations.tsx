'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Target, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PathwayRecommendation {
  career: string
  matchScore: number
  reason: string
  keySkills: string[]
  estimatedTime: string
  marketDemand: 'high' | 'medium' | 'growing'
  description: string
}

interface RecommendationsProps {
  recommendations: PathwayRecommendation[]
  discoveryData: any
}

export default function Recommendations({ recommendations, discoveryData }: RecommendationsProps) {
  const router = useRouter()

  const handleSelectPathway = async (recommendation: PathwayRecommendation) => {
    // Build a comprehensive description from the recommendation
    const marketDemandText = recommendation.marketDemand === 'high' 
      ? 'High demand field with great opportunities' 
      : recommendation.marketDemand === 'growing' 
      ? 'Growing field with increasing opportunities' 
      : 'Stable field with consistent opportunities'
    
    const fullDescription = `${recommendation.description}

Key Skills to Learn: ${recommendation.keySkills.join(', ')}

Why this path matches you: ${recommendation.reason}

Estimated Time: ${recommendation.estimatedTime} to job-ready

Market Demand: ${marketDemandText}

This pathway is personalized based on your interests and preferences. You can customize the details below before generating your learning path.`

    // Store in sessionStorage for pathway creation page to read
    sessionStorage.setItem('suggestedPathway', JSON.stringify({
      career: recommendation.career,
      description: fullDescription,
      keySkills: recommendation.keySkills,
      matchScore: recommendation.matchScore,
      reason: recommendation.reason,
      estimatedTime: recommendation.estimatedTime,
      marketDemand: recommendation.marketDemand,
    }))

    // Navigate to pathway creation page with pre-filled data
    router.push(`/path/create?fromDiscovery=true&career=${encodeURIComponent(recommendation.career)}`)
  }

  const getMarketBadgeColor = (demand: string) => {
    switch (demand) {
      case 'high':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      case 'growing':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      default:
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block p-4 bg-gradient-to-r from-[#3B82F6] to-purple-500 rounded-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#E4E4E7]">
            Your Personalized Pathway Recommendations
          </h1>
          <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            Based on your interests, we&apos;ve found the perfect learning paths for you
          </p>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.career}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl overflow-hidden hover:border-[#3B82F6]/50 transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1">
                  {/* Match Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {rec.matchScore}%
                      </div>
                      <div>
                        <p className="text-xs text-[#A1A1AA]">Match</p>
                        <p className="text-sm font-semibold text-[#E4E4E7]">Perfect Fit</p>
                      </div>
                    </div>
                    <Badge className={getMarketBadgeColor(rec.marketDemand)}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {rec.marketDemand === 'high' ? 'High Demand' : rec.marketDemand === 'growing' ? 'Growing Field' : 'Stable'}
                    </Badge>
                  </div>

                  {/* Career Title */}
                  <h3 className="text-xl font-bold text-[#E4E4E7] mb-2">
                    {rec.career}
                  </h3>

                  {/* Reason */}
                  <p className="text-sm text-[#A1A1AA] mb-4 line-clamp-2">
                    {rec.reason}
                  </p>

                  {/* Key Skills */}
                  <div className="mb-4">
                    <p className="text-xs text-[#A1A1AA] mb-2">Key Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.keySkills.slice(0, 3).map((skill, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-[#27272A] border-[#3F3F46] text-[#A1A1AA] text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {rec.keySkills.length > 3 && (
                        <Badge
                          variant="outline"
                          className="bg-[#27272A] border-[#3F3F46] text-[#A1A1AA] text-xs"
                        >
                          +{rec.keySkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-[#A1A1AA]">
                    <Clock className="w-4 h-4" />
                    <span>{rec.estimatedTime} to job-ready</span>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPathway(rec)}
                    className="w-full bg-gradient-to-r from-[#3B82F6] to-purple-500 hover:from-[#3B82F6]/90 hover:to-purple-500/90 text-white font-semibold mt-auto"
                  >
                    Use This Suggestion
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Alternative Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-[#A1A1AA] mb-4">
            Don&apos;t see what you&apos;re looking for?
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/path/create')}
            className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]"
          >
            Create Custom Pathway
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

