'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react'

export default function ProcessingScreen() {
  const phases = [
    { icon: Brain, text: 'Analyzing your interests...' },
    { icon: Target, text: 'Matching to tech pathways...' },
    { icon: TrendingUp, text: 'Checking market demand...' },
    { icon: Sparkles, text: 'Generating recommendations...' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-purple-500 flex items-center justify-center mx-auto"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#E4E4E7]">
            Finding Your Perfect Path
          </h2>
          <p className="text-[#A1A1AA]">
            We&apos;re analyzing your interests to suggest the best tech pathways for you
          </p>
        </motion.div>

        <div className="space-y-3">
          {phases.map((phase, index) => {
            const Icon = phase.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3, repeat: Infinity, repeatDelay: 1.5 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#27272A]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <span className="text-sm text-[#E4E4E7]">{phase.text}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

