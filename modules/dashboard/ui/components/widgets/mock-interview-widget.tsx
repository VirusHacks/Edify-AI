"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";

export const MockInterviewWidget = () => {
  // TODO: Add TRPC query for mock interviews when available
  const hasInterviews = false;
  const interviews: any[] = [];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="rounded-2xl border border-[#27272A] bg-[#0A0A0A] hover:bg-[#111111] transition-colors w-full flex flex-col h-[420px] overflow-hidden">
        <CardHeader className="pb-3 px-6 pt-6 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold text-[#E4E4E7]">
                <Mic className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                Mock Interviews
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Practice and improve your skills
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/mock/dashboard">
                <Plus className="w-4 h-4" />
                <span className="text-xs md:text-sm">Start</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col justify-center px-6 pb-6 min-h-0">
          {hasInterviews ? (
            <div className="space-y-2.5">
              {/* Interview list would go here */}
            </div>
          ) : (
            <div className="text-center py-6">
              <Mic className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[#A1A1AA] mb-2.5" />
              <h3 className="text-sm md:text-base font-semibold text-[#E4E4E7] mb-1">No Interviews Yet</h3>
              <p className="text-xs text-[#A1A1AA] mb-3">Start practicing with AI-powered mock interviews</p>
              <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Link href="/mock/dashboard">
                  <Plus className="w-4 h-4" />
                  Start Interview
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
