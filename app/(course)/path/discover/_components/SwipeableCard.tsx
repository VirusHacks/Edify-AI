'use client'

import { motion, PanInfo } from 'framer-motion'
import { useState } from 'react'
import { X, Heart, ArrowUp } from 'lucide-react'

interface SwipeableCardProps {
  card: {
    id: string
    text: string
    category: string
  }
  onSwipe: (direction: 'left' | 'right' | 'up') => void
  index: number
  total: number
}

export default function SwipeableCard({ card, onSwipe, index, total }: SwipeableCardProps) {
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | 'up' | null>(null)

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    const velocity = 10

    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocity) {
      if (info.offset.x > 0) {
        onSwipe('right')
      } else {
        onSwipe('left')
      }
    } else if (info.offset.y < -threshold || info.velocity.y < -velocity) {
      onSwipe('up')
    }
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      setDragDirection(info.offset.x > 0 ? 'right' : 'left')
    } else if (info.offset.y < 0) {
      setDragDirection('up')
    } else {
      setDragDirection(null)
    }
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background hints */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {dragDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-20 text-green-500 text-6xl font-bold"
          >
            ✓
          </motion.div>
        )}
        {dragDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-20 text-red-500 text-6xl font-bold"
          >
            ✗
          </motion.div>
        )}
        {dragDirection === 'up' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-20 text-purple-500 text-6xl font-bold"
          >
            ⭐
          </motion.div>
        )}
      </div>

      {/* Main card */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        className="w-full max-w-md mx-auto cursor-grab active:cursor-grabbing"
        style={{
          rotate: dragDirection === 'right' ? 15 : dragDirection === 'left' ? -15 : 0,
        }}
      >
        <motion.div
          className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-3xl p-8 border-2 border-[#27272A] shadow-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
          animate={{
            scale: dragDirection ? 1.05 : 1,
            borderColor: dragDirection === 'right' 
              ? '#10B981' 
              : dragDirection === 'left' 
              ? '#EF4444' 
              : dragDirection === 'up'
              ? '#A855F7'
              : '#27272A',
          }}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 via-transparent to-purple-500/5" />
          
          {/* Category badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-[#27272A] text-[#A1A1AA] text-xs font-medium">
              {card.category}
            </span>
          </div>

          {/* Card number */}
          <div className="absolute top-4 left-4 text-[#A1A1AA] text-sm font-medium">
            {index + 1} / {total}
          </div>

          {/* Card content */}
          <div className="relative z-10 text-center space-y-6">
            <div className="text-6xl mb-4">
              {card.category === 'Technical Interest' && '🤖'}
              {card.category === 'Activity' && '⚡'}
              {card.category === 'Skill' && '💡'}
              {card.category === 'Work Style' && '👥'}
            </div>
            <h2 className="text-3xl font-bold text-[#E4E4E7] leading-tight">
              {card.text}
            </h2>
          </div>

          {/* Swipe hints */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 text-[#A1A1AA] text-sm">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Not interested</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Interested</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4" />
              <span className="hidden sm:inline">Very interested</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

