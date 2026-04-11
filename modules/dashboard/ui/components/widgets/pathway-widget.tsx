"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const PathwayWidget = () => {
  const trpc = useTRPC();

  const { data: pathways, isLoading } = useQuery({
    ...trpc.user.getPathwayProgress.queryOptions(),
    retry: false,
  });

  const activePathways = pathways?.filter(p => 
    p.pathway && p.completedSteps > 0 && p.completedSteps < p.pathway.steps.length
  ) || [];
  const displayPathways = activePathways.slice(0, 5);

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
                <Target className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                Learning Pathways
                {activePathways.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-[#27272A] text-[#E4E4E7] border-[#27272A]">
                    {activePathways.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Track your structured learning
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/path/create">
                <Plus className="w-4 h-4" />
                <span className="text-xs md:text-sm">Create</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col px-6 pb-6 min-h-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full bg-[#27272A]" />
              <Skeleton className="h-16 w-full bg-[#27272A]" />
              <Skeleton className="h-16 w-full bg-[#27272A]" />
            </div>
          ) : displayPathways.length > 0 ? (
            <div className="space-y-2 pr-1">
              {displayPathways.map((progressRecord) => {
                if (!progressRecord.pathway) return null;
                
                const pathway = progressRecord.pathway;
                const progressPercent = pathway.steps.length > 0
                  ? Math.round((progressRecord.completedSteps / pathway.steps.length) * 100)
                  : 0;

                return (
                  <Link
                    key={progressRecord.id}
                    href={`/path/path/${pathway.slug}`}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="p-3 rounded-lg bg-[#27272A] border border-[#27272A] hover:border-[#3B82F6]/50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Target className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#E4E4E7] text-sm line-clamp-1">
                              {pathway.title}
                            </h4>
                            <Badge className="text-xs bg-[#27272A] text-[#E4E4E7] border-[#27272A]">
                              {progressPercent}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                            <span>Step {progressRecord.completedSteps}/{pathway.steps.length}</span>
                            <span>•</span>
                            <span className="line-clamp-1">{pathway.description}</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={progressPercent} className="h-1 mt-1.5 bg-[#27272A]" />
                    </motion.div>
                  </Link>
                );
              })}
              {activePathways.length > 5 && (
                <Button asChild variant="ghost" className="w-full text-xs md:text-sm text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A]" size="sm">
                  <Link href="/path" className="flex items-center justify-center">
                    View All {activePathways.length} Pathways
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[#A1A1AA] mb-2.5" />
              <h3 className="text-sm md:text-base font-semibold text-[#E4E4E7] mb-1">No Pathways Started</h3>
              <p className="text-xs text-[#A1A1AA] mb-3">Begin your structured learning journey</p>
              <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Link href="/path/create">
                  <Plus className="w-4 h-4" />
                  Create Pathway
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
