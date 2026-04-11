"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, Play, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const ContinueSection = () => {
  const trpc = useTRPC();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    ...trpc.user.getCreatedCourses.queryOptions(),
    retry: false,
  });

  const { data: pathways, isLoading: pathwaysLoading } = useQuery({
    ...trpc.user.getPathwayProgress.queryOptions(),
    retry: false,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    ...trpc.user.getDocuments.queryOptions(),
    retry: false,
  });

  const isLoading = coursesLoading || pathwaysLoading || documentsLoading;

  // Get most recent in-progress course
  const inProgressCourses = courses?.filter(c => c.progress > 0 && c.progress < 100) || [];
  const latestCourse = inProgressCourses[0]; // Get first in-progress course

  // Get most recent in-progress pathway
  const inProgressPathways = pathways?.filter(p => 
    p.pathway && p.completedSteps > 0 && p.completedSteps < p.pathway.steps.length
  ) || [];
  const latestPathway = inProgressPathways[0]; // Get first in-progress pathway

  // Get most recent document
  const latestDocument = documents?.[0];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-[#27272A] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const hasItems = latestCourse || latestPathway || latestDocument;

  if (!hasItems) {
    return null;
  }

  // Count how many items we have
  const itemCount = [latestCourse, latestPathway, latestDocument].filter(Boolean).length;
  
  // Use 2 columns when we have 2 items, 3 columns when we have 3 items
  const gridCols = itemCount === 2 
    ? "grid-cols-1 md:grid-cols-2" 
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <motion.div variants={itemVariants}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#E4E4E7] mb-2">
          Continue Your Journey
        </h2>
        <p className="text-base text-[#A1A1AA]">
          Pick up where you left off
        </p>
      </div>

      <div className={`grid ${gridCols} gap-6 auto-rows-fr`}>
        {latestCourse && (
          <ContinueCard
            type="course"
            title={(latestCourse.courseOutput as any)?.topic || latestCourse.courseName}
            progress={latestCourse.progress || 0}
            href={`/course/${latestCourse.courseId}`}
            icon={BookOpen}
          />
        )}

        {latestPathway?.pathway && (
          <ContinueCard
            type="pathway"
            title={latestPathway.pathway.title}
            progress={latestPathway.pathway.steps.length > 0
              ? Math.round((latestPathway.completedSteps / latestPathway.pathway.steps.length) * 100)
              : 0}
            href={`/path/path/${latestPathway.pathway.slug}`}
            icon={Target}
            subtitle={`${latestPathway.completedSteps} of ${latestPathway.pathway.steps.length} steps`}
          />
        )}

        {latestDocument && (
          <ContinueCard
            type="document"
            title={latestDocument.title}
            progress={latestDocument.status === "public" ? 100 : 50}
            href={`/dashboard/document/${latestDocument.documentId}/edit`}
            icon={FileText}
            subtitle={`Last updated ${new Date(latestDocument.updatedAt).toLocaleDateString()}`}
          />
        )}
      </div>
    </motion.div>
  );
};

const ContinueCard = ({
  type,
  title,
  progress,
  href,
  icon: Icon,
  subtitle,
}: {
  type: "course" | "pathway" | "document";
  title: string;
  progress: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className="border border-[#27272A] bg-[#0A0A0A] hover:bg-[#111111] transition-colors cursor-pointer h-full flex flex-col rounded-2xl">
        <Link href={href} className="flex-1 flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-md">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#A1A1AA]" />
            </div>

            <h3 className="text-lg font-semibold text-[#E4E4E7] mb-2 line-clamp-2">
              {title}
            </h3>

            {subtitle && (
              <p className="text-sm text-[#A1A1AA] mb-4">{subtitle}</p>
            )}

            <div className="mb-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#A1A1AA]">Progress</span>
                <span className="text-xs font-semibold text-[#E4E4E7]">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-[#27272A]" />
            </div>

            <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white" size="sm">
              <Play className="w-4 h-4" />
              Continue
            </Button>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
};
