"use client";

import { motion } from "framer-motion";
import { DashboardHero } from "../components/dashboard-hero";
import { ContinueSection } from "../components/continue-section";
import { DashboardWidgets } from "../components/dashboard-widgets";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const UnifiedDashboardView = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12 md:space-y-16"
        >
          {/* Hero Section */}
          <DashboardHero />

          {/* Continue Section */}
          <ContinueSection />

          {/* Main Widgets Grid */}
          <DashboardWidgets />
        </motion.div>
      </div>
    </div>
  );
};

export const UnifiedDashboardViewLoading = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="space-y-12 md:space-y-16">
          <div className="h-40 md:h-48 bg-[#27272A] rounded-2xl animate-pulse" />
          <div className="h-52 md:h-64 bg-[#27272A] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-[#27272A] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
