'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SwipeableCard from './_components/SwipeableCard'
import ProcessingScreen from './_components/ProcessingScreen'
import Recommendations from './_components/Recommendations'
import { Button } from '@/components/ui/button'

type DiscoveryPhase = 'welcome' | 'cards' | 'processing' | 'results'

interface Card {
  id: string
  text: string
  category: 'Technical Interest' | 'Activity' | 'Skill' | 'Work Style'
  domain: string[]
}

interface DiscoveryData {
  likedItems: { text: string; score: number; category: string }[]
  dislikedItems: string[]
  totalSwipes: number
}

// Card database - tech-oriented interests
const DISCOVERY_CARDS: Card[] = [
  // Technical Interests
  { id: '1', text: 'Interested in artificial intelligence', category: 'Technical Interest', domain: ['ai', 'ml', 'data-science'] },
  { id: '2', text: 'Fascinated by data and analytics', category: 'Technical Interest', domain: ['data-science', 'analytics', 'business-intelligence'] },
  { id: '3', text: 'Love building websites and apps', category: 'Technical Interest', domain: ['web-development', 'frontend', 'fullstack'] },
  { id: '4', text: 'Curious about cybersecurity', category: 'Technical Interest', domain: ['cybersecurity', 'security', 'ethical-hacking'] },
  { id: '5', text: 'Interested in cloud computing', category: 'Technical Interest', domain: ['cloud', 'devops', 'infrastructure'] },
  
  // Activities
  { id: '6', text: 'Enjoy solving complex puzzles', category: 'Activity', domain: ['software-engineering', 'algorithms', 'problem-solving'] },
  { id: '7', text: 'Like creating visual designs', category: 'Activity', domain: ['ui-ux', 'design', 'frontend'] },
  { id: '8', text: 'Love working with numbers', category: 'Activity', domain: ['data-science', 'analytics', 'finance-tech'] },
  { id: '9', text: 'Prefer hands-on building', category: 'Activity', domain: ['web-development', 'mobile-development', 'fullstack'] },
  { id: '10', text: 'Enjoy analyzing patterns in data', category: 'Activity', domain: ['data-science', 'analytics', 'machine-learning'] },
  
  // Skills
  { id: '11', text: 'Good at logical thinking', category: 'Skill', domain: ['software-engineering', 'algorithms', 'backend'] },
  { id: '12', text: 'Strong in mathematics', category: 'Skill', domain: ['data-science', 'machine-learning', 'quantitative'] },
  { id: '13', text: 'Creative problem solver', category: 'Skill', domain: ['ui-ux', 'frontend', 'product-development'] },
  { id: '14', text: 'Detail-oriented person', category: 'Skill', domain: ['cybersecurity', 'qa', 'backend'] },
  
  // Work Style
  { id: '15', text: 'Prefer working independently', category: 'Work Style', domain: ['freelance', 'remote', 'solo-projects'] },
  { id: '16', text: 'Enjoy collaborative projects', category: 'Work Style', domain: ['team-work', 'agile', 'product-development'] },
]

export default function DiscoverPathway() {
  const router = useRouter()
  const [phase, setPhase] = useState<DiscoveryPhase>('welcome')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    likedItems: [],
    dislikedItems: [],
    totalSwipes: 0,
  })
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [shuffledCards, setShuffledCards] = useState<Card[]>([])

  // Shuffle cards on mount
  useEffect(() => {
    const shuffled = [...DISCOVERY_CARDS].sort(() => Math.random() - 0.5).slice(0, 12)
    setShuffledCards(shuffled)
  }, [])

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const currentCard = shuffledCards[currentCardIndex]
    
    if (direction === 'right') {
      setDiscoveryData(prev => ({
        ...prev,
        likedItems: [...prev.likedItems, { text: currentCard.text, score: 1, category: currentCard.category }],
        totalSwipes: prev.totalSwipes + 1,
      }))
    } else if (direction === 'up') {
      setDiscoveryData(prev => ({
        ...prev,
        likedItems: [...prev.likedItems, { text: currentCard.text, score: 2, category: currentCard.category }],
        totalSwipes: prev.totalSwipes + 1,
      }))
    } else if (direction === 'left') {
      setDiscoveryData(prev => ({
        ...prev,
        dislikedItems: [...prev.dislikedItems, currentCard.text],
        totalSwipes: prev.totalSwipes + 1,
      }))
    }

    // Move to next card
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    } else {
      // All cards swiped, generate recommendations
      setPhase('processing')
      generateRecommendations()
    }
  }

  const generateRecommendations = async () => {
    try {
      const response = await fetch('/api/pathway/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discoveryData),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
      setPhase('results')
    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Fallback to manual pathway creation
      router.push('/path/create')
    }
  }

  const handleSkip = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    } else {
      setPhase('processing')
      generateRecommendations()
    }
  }

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full space-y-8 text-center"
        >
          <div className="inline-block p-6 bg-gradient-to-r from-[#3B82F6] to-purple-500 rounded-3xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#E4E4E7]">
            Discover Your Tech Pathway
          </h1>
          <p className="text-lg text-[#A1A1AA] max-w-xl mx-auto">
            Swipe through cards to tell us what interests you. We&apos;ll suggest the perfect tech career path in just 30 seconds.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-8 text-sm text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <span className="text-red-500">←</span>
                <span>Not interested</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">→</span>
                <span>Interested</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">↑</span>
                <span>Very interested</span>
              </div>
            </div>
            <Button
              onClick={() => setPhase('cards')}
              className="bg-gradient-to-r from-[#3B82F6] to-purple-500 hover:from-[#3B82F6]/90 hover:to-purple-500/90 text-white font-semibold px-8 py-6 text-lg"
            >
              Start Discovering
            </Button>
          </div>
          <Link
            href="/path"
            className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to pathways
          </Link>
        </motion.div>
      </div>
    )
  }

  if (phase === 'processing') {
    return <ProcessingScreen />
  }

  if (phase === 'results') {
    return <Recommendations recommendations={recommendations} discoveryData={discoveryData} />
  }

  // Cards phase
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-sm text-[#A1A1AA] mb-4">
          <span>Card {currentCardIndex + 1} of {shuffledCards.length}</span>
          <span>{Math.round(((currentCardIndex + 1) / shuffledCards.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#3B82F6] to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentCardIndex + 1) / shuffledCards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Card */}
        {shuffledCards[currentCardIndex] && (
          <SwipeableCard
            card={shuffledCards[currentCardIndex]}
            onSwipe={handleSwipe}
            index={currentCardIndex}
            total={shuffledCards.length}
          />
        )}

        {/* Skip button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-[#A1A1AA] hover:text-[#E4E4E7]"
          >
            Skip this card
          </Button>
        </div>
      </div>
    </div>
  )
}

