"use client";

import { motion } from "framer-motion";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Award, Rocket, Plus, BookOpen, FileText, Video, MessageCircle } from "lucide-react";
import Link from "next/link";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const DashboardHero = () => {
  const { user } = useKindeBrowserClient();
  const trpc = useTRPC();

  const { data: courses } = useQuery({
    ...trpc.user.getCreatedCourses.queryOptions(),
    retry: false,
  });

  const { data: pathways } = useQuery({
    ...trpc.user.getPathwayProgress.queryOptions(),
    retry: false,
  });

  // Calculate stats
  const completedCourses = courses?.filter(c => c.progress === 100) || [];
  const inProgressCourses = courses?.filter(c => c.progress > 0 && c.progress < 100) || [];
  const totalHours = Math.floor(courses?.reduce((acc, c) => acc + (c.progress || 0) / 10, 0) || 0);
  const completionRate = courses && courses.length > 0
    ? Math.round((completedCourses.length / courses.length) * 100)
    : 0;
  const activeStreak = 7; // TODO: Calculate from backend

  const userName = user?.given_name || "Learner";
  const greeting = getGreeting();

  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden rounded-2xl border border-[#27272A] bg-[#0A0A0A] p-6 md:p-10">
        <div className="relative z-10">
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-[#E4E4E7]">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-base md:text-lg text-[#A1A1AA] max-w-2xl">
              Welcome to your learning hub. Continue your journey and explore new opportunities.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <Link href="/course-dashboard">
                <BookOpen className="w-4 h-4" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/path/create">
                <Rocket className="w-4 h-4" />
                New Pathway
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/dashboard">
                <FileText className="w-4 h-4" />
                Create Resume
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/meeting-home">
                <Video className="w-4 h-4" />
                Start Meeting
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/chat">
                <MessageCircle className="w-4 h-4" />
                Chat Assistant
              </Link>
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <StatCard
              icon={Flame}
              label="🔥 Streak"
              value={activeStreak}
              subtitle="days in a row"
            />
            <StatCard
              icon={Clock}
              label="⏱️ Hours"
              value={totalHours}
              subtitle="learning time"
            />
            <StatCard
              icon={Award}
              label="✨ Completion"
              value={`${completionRate}%`}
              subtitle="courses finished"
            />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle: string;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="border border-[#27272A] bg-[#0A0A0A] hover:bg-[#111111] transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#A1A1AA] mb-2">{label}</p>
              <p className="text-3xl md:text-4xl font-bold text-[#E4E4E7] mb-2">{value}</p>
              <p className="text-xs text-[#A1A1AA]">{subtitle}</p>
            </div>
            <Icon className="w-12 h-12 text-[#3B82F6] flex-shrink-0 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
