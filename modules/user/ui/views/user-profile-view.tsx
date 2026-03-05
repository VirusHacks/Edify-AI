"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { UserProfileForm } from "../components/user-profile-form";
import { UserActivity } from "../components/user-activity";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, Sparkles, Brain, TrendingUp, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";

export const UserProfileView = () => {
  const trpc = useTRPC();

  const { data, isLoading, error } = useSuspenseQuery(
    trpc.user.getOne.queryOptions(),
  );

  if (isLoading) {
    return <LoadingState title="Loading Profile" description="Please wait while we fetch your profile data." />;
  }

  if (error) {
    return <ErrorState title="Error Loading Profile" description="An error occurred while fetching your profile data." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-8 md:py-12 space-y-8 md:space-y-12 max-w-screen-xl">
        {/* AI Career Roadmap Hero Section */}
        <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                    <Brain className="w-5 h-5" style={{ color: "#3B82F6" }} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
                    AI-Powered Career Roadmap
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "#27272A", color: "#A78BFA" }}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    New
                  </span>
                </div>
                
                <p className="text-base md:text-lg leading-relaxed" style={{ color: "#A1A1AA" }}>
                  Get a personalized career path built specifically for you. Our AI analyzes your profile, real-time job market trends, and 2030 industry forecasts.
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#A1A1AA" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#A78BFA" }}></div>
                    <span>Real-time market data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span>Skill gap analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22D3EE" }}></div>
                    <span>Future-proof skills</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Link href="/path/personalized">
                  <Button 
                    size="lg" 
                    className="rounded-xl px-8 py-6 text-base font-medium transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Roadmap
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Section Header */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Your Profile</h2>
          <p className="text-sm" style={{ color: "#A1A1AA" }}>Manage your professional identity and track your learning journey</p>
        </div>

        {/* Profile Form Card */}
        <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <CardContent className="p-0">
            <UserProfileForm />
          </CardContent>
        </Card>

        {/* Quick Stats Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Quick Stats</h2>
            <p className="text-sm" style={{ color: "#A1A1AA" }}>Track your progress and achievements</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                      <BookOpen className="w-5 h-5" style={{ color: "#3B82F6" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>Courses</span>
                  </div>
                  <span className="text-3xl font-bold" style={{ color: "#E4E4E7" }}>0</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>Completed</span>
                  </div>
                  <span className="text-3xl font-bold" style={{ color: "#E4E4E7" }}>0</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                      <Clock className="w-5 h-5" style={{ color: "#F59E0B" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>In Progress</span>
                  </div>
                  <span className="text-3xl font-bold" style={{ color: "#E4E4E7" }}>0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Dashboard */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Learning Dashboard</h2>
            <p className="text-sm" style={{ color: "#A1A1AA" }}>Track your progress and continue learning</p>
          </div>
          <UserActivity />
        </div>
      </PageContainer>
    </div>
  );
};

export const UserProfileViewLoading = () => <LoadingState title="Loading Profile" description="Please wait while we fetch your profile data." />;
export const UserProfileViewError = () => <ErrorState title="Error Loading Profile" description="An error occurred while fetching your profile data." />;

