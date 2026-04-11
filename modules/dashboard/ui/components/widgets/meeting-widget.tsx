"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Plus, Clock, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const MeetingWidget = () => {
  const trpc = useTRPC();

  const { data: meetingsData, isLoading } = useQuery({
    ...trpc.meetings.getMany.queryOptions({
      page: 1,
      pageSize: 5,
    }),
    retry: false,
  });

  const meetings = meetingsData?.items || [];
  const displayMeetings = meetings.slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      upcoming: { label: "Upcoming", className: "bg-[#27272A] text-[#E4E4E7] border-[#27272A]" },
      active: { label: "Active", className: "bg-[#27272A] text-[#E4E4E7] border-[#27272A]" },
      completed: { label: "Completed", className: "bg-[#27272A] text-[#E4E4E7] border-[#27272A]" },
      cancelled: { label: "Cancelled", className: "bg-[#27272A] text-[#E4E4E7] border-[#27272A]" },
    };
    return statusMap[status.toLowerCase()] || statusMap.completed;
  };

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
                <Video className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                Agentic Meetings
                {meetings.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-[#27272A] text-[#E4E4E7] border-[#27272A]">
                    {meetings.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Schedule and manage your meetings
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#27272A]">
              <Link href="/meeting-home">
                <Plus className="w-4 h-4" />
                <span className="text-xs md:text-sm">New</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto flex flex-col px-6 pb-6 min-h-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full bg-[#27272A]" />
              <Skeleton className="h-14 w-full bg-[#27272A]" />
              <Skeleton className="h-14 w-full bg-[#27272A]" />
            </div>
          ) : displayMeetings.length > 0 ? (
            <div className="space-y-2 pr-1">
              {displayMeetings.map((meeting) => {
                const statusInfo = getStatusBadge(meeting.status);
                const getMeetingTime = () => {
                  if (meeting.status === "upcoming" && meeting.createdAt) {
                    const date = new Date(meeting.createdAt);
                    const now = new Date();
                    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return "Today";
                    if (diffDays === 1) return "Tomorrow";
                    if (diffDays < 7) return `${diffDays}d`;
                    return date.toLocaleDateString();
                  }
                  if (meeting.status === "completed" && meeting.duration) {
                    return `${Math.round(meeting.duration / 60)}m`;
                  }
                  return null;
                };

                return (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="p-3 rounded-lg bg-[#27272A] border border-[#27272A] hover:border-[#3B82F6]/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#E4E4E7] text-sm line-clamp-1">
                              {meeting.name}
                            </h4>
                            <Badge className={`text-xs ${statusInfo.className}`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                            {meeting.agent && (
                              <>
                                <span>with {meeting.agent.name}</span>
                                <span>•</span>
                              </>
                            )}
                            {getMeetingTime() && <span>{getMeetingTime()}</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
              {meetings.length > 5 && (
                <Button asChild variant="ghost" className="w-full text-xs md:text-sm text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A]" size="sm">
                  <Link href="/meetings" className="flex items-center justify-center">
                    View All {meetings.length} Meetings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Video className="w-10 h-10 md:w-12 md:h-12 mx-auto text-[#A1A1AA] mb-2.5" />
              <h3 className="text-sm md:text-base font-semibold text-[#E4E4E7] mb-1">No Meetings Yet</h3>
              <p className="text-xs text-[#A1A1AA] mb-3">Schedule your first agentic meeting</p>
              <Button asChild size="default" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Link href="/meeting-home">
                  <Plus className="w-4 h-4" />
                  Schedule Meeting
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
