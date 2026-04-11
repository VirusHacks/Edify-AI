"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, MessageSquare } from "lucide-react";
import Link from "next/link";

export const TutorWidget = () => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="rounded-2xl border border-[#27272A] bg-[#0A0A0A] hover:bg-[#111111] transition-colors w-full flex flex-col h-[420px] overflow-hidden">
        <CardHeader className="pb-3 px-6 pt-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold text-[#E4E4E7]">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                AI Tutor
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Get instant help with any question
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col justify-center px-6 pb-6 min-h-0">
          <div className="text-center py-5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-base font-semibold text-[#E4E4E7] mb-2">Ask Anything</h3>
            <p className="text-xs text-[#A1A1AA] mb-6">
              Get instant answers to your questions with our AI-powered tutor
            </p>
            <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <Link href="/tutor">
                <MessageSquare className="w-4 h-4" />
                Chat with Tutor
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
