"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Plus, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const AgentWidget = () => {
  const trpc = useTRPC();

  const { data: agentsData, isLoading } = useQuery({
    ...trpc.agents.getMany.queryOptions({
      page: 1,
      pageSize: 5,
    }),
    retry: false,
  });

  const agents = agentsData?.items || [];
  const displayAgents = agents.slice(0, 5);

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
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                AI Agents
                {agents.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-[#27272A] text-[#E4E4E7] border-[#27272A]">
                    {agents.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Your intelligent assistants
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/agents">
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
          ) : displayAgents.length > 0 ? (
            <div className="space-y-2 pr-1">
              {displayAgents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="block"
                >
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="p-3 rounded-lg bg-[#27272A] border border-[#27272A] hover:border-[#3B82F6]/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                          <h4 className="font-semibold text-[#E4E4E7] text-sm line-clamp-1">
                            {agent.name}
                          </h4>
                            {agent.meetingCount !== undefined && agent.meetingCount > 0 && (
                            <Badge variant="secondary" className="text-xs bg-[#27272A] text-[#E4E4E7] border-[#27272A]">
                              {agent.meetingCount} meetings
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#A1A1AA] line-clamp-1">
                          {agent.instructions?.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
              {agents.length > 5 && (
                <Button asChild variant="ghost" className="w-full text-xs md:text-sm text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A]" size="sm">
                  <Link href="/agents" className="flex items-center justify-center">
                    View All {agents.length} Agents
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Bot className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[#A1A1AA] mb-2.5" />
              <h3 className="text-sm md:text-base font-semibold text-[#E4E4E7] mb-1">No Agents Yet</h3>
              <p className="text-xs text-[#A1A1AA] mb-3">Create your first AI agent</p>
              <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Link href="/agents">
                  <Plus className="w-4 h-4" />
                  Create Agent
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
