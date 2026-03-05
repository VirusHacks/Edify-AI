"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle, TrendingUp, Target, FileText, Plus, ArrowRight, Flame, Award, Play } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const UserActivity = () => {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const completedCourses = courses?.filter(course => course.progress === 100) || [];
  const inProgressCourses = courses?.filter(course => course.progress > 0 && course.progress < 100) || [];
  const completedPathways = pathways?.filter(p => p.pathway && p.completedSteps >= (p.pathway.steps.length)) || [];
  const inProgressPathways = pathways?.filter(p => p.pathway && p.completedSteps > 0 && p.completedSteps < p.pathway.steps.length) || [];

  const hasNoActivity = 
    (courses?.length === 0 || courses === undefined) && 
    (pathways?.length === 0 || pathways === undefined) &&
    (documents?.length === 0 || documents === undefined);

  // Calculate insights
  const totalHours = Math.floor(courses?.reduce((acc, c) => acc + (c.progress || 0) / 10, 0) || 0);
  const completionRate = courses && courses.length > 0 
    ? Math.round((completedCourses.length / courses.length) * 100) 
    : 0;
  const activeStreak = 7; // Mock data - would come from backend

  return (
    <div className="space-y-8">
      {/* Learning Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-500/5 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1 text-zinc-500">🔥 Streak</p>
                <p className="text-3xl md:text-4xl font-bold mb-1 text-zinc-100">{activeStreak}</p>
                <p className="text-xs text-zinc-600">days in a row</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Flame className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/5 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1 text-zinc-500">⏱️ Hours</p>
                <p className="text-3xl md:text-4xl font-bold mb-1 text-zinc-100">{totalHours}</p>
                <p className="text-xs text-zinc-600">learning time</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Clock className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-green-500/5 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1 text-zinc-500">✨ Completion</p>
                <p className="text-3xl md:text-4xl font-bold mb-1 text-zinc-100">{completionRate}%</p>
                <p className="text-xs text-zinc-600">courses finished</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Award className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Courses */}
      <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-1 text-zinc-100">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                Active Courses
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-zinc-500">Continue where you left off</CardDescription>
            </div>
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all"
            >
              <Link href="/course-dashboard">
                <Plus className="w-4 h-4 mr-2" />
                <span className="text-sm">Create Course</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inProgressCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inProgressCourses.map((course) => {
                const getMilestoneBadge = (progress: number) => {
                  if (progress >= 100) return <Badge className="rounded-lg bg-green-500/10 border-green-500/30 text-green-400">🏆 Complete</Badge>;
                  if (progress >= 50) return <Badge className="rounded-lg bg-blue-500/10 border-blue-500/30 text-blue-400">50%</Badge>;
                  if (progress >= 25) return <Badge className="rounded-lg bg-violet-500/10 border-violet-500/30 text-violet-400">25%</Badge>;
                  return null;
                };
                
                return (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-zinc-800 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 bg-zinc-900/50 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                      </div>
                      {getMilestoneBadge(course.progress)}
                    </div>
                    <h4 className="font-semibold mb-2 text-lg text-zinc-100">{(course.courseOutput as any)?.topic || course.courseName}</h4>
                    <p className="text-sm capitalize mb-4 text-zinc-500">{course.category}</p>
                    <div className="mb-4">
                      <div className="relative w-full h-2 rounded-full overflow-hidden bg-zinc-800">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-600 to-blue-400"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2 text-zinc-500">{Math.round(course.progress)}% complete</p>
                    </div>
                    <Button 
                      asChild 
                      size="sm"
                      className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/20"
                    >
                      <Link href={`/course/${course.courseId}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : hasNoActivity ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/30">
              <div className="p-4 rounded-full bg-zinc-800/50 w-fit mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-zinc-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-zinc-200">No Courses Yet</h3>
              <p className="text-base mb-6 max-w-md mx-auto text-zinc-500">Start learning by creating your first course</p>
              <Button 
                asChild 
                size="sm" 
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/20"
              >
                <Link href="/course-dashboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-zinc-500">
              No courses in progress
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pathway Progress and Resumes in Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pathway Progress */}
        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-1 text-zinc-100">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-violet-500" />
                  Learning Pathways
                </CardTitle>
                <CardDescription className="text-sm mt-1 text-zinc-500">Track your pathway progress</CardDescription>
              </div>
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-violet-600 hover:border-violet-600 hover:text-white transition-all"
              >
                <Link href="/path/create">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Create Pathway</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(inProgressPathways.length > 0 || completedPathways.length > 0) ? (
              <div className="space-y-4">
                {[...inProgressPathways, ...completedPathways].map((progressRecord) => {
                  if (!progressRecord.pathway) return null;
                  
                  const pathway = progressRecord.pathway;
                  const isCompleted = progressRecord.completedSteps >= pathway.steps.length;
                  const progressPercent = pathway.steps.length > 0 ? (progressRecord.completedSteps / pathway.steps.length) * 100 : 0;

                  return (
                    <Link
                      key={progressRecord.id}
                      href={`/path/path/${pathway.slug}`}
                    >
                      <div
                        className={`flex items-center gap-4 p-5 rounded-xl transition-all duration-300 border ${
                          isCompleted 
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' 
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-violet-500/30 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/10' : 'bg-violet-500/10'}`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Target className="w-5 h-5 text-violet-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 text-base text-zinc-100">{pathway.title}</h4>
                          <p className="text-sm mb-2 line-clamp-2 text-zinc-500">{pathway.description}</p>
                          {!isCompleted && pathway.steps.length > 0 && (
                            <div className="mt-2">
                              <div className="relative w-full h-2 rounded-full overflow-hidden bg-zinc-800">
                                <div 
                                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-violet-600 to-violet-400"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <p className="text-xs mt-1 text-zinc-500">
                                {progressRecord.completedSteps} of {pathway.steps.length} steps
                              </p>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs rounded-lg ${
                            isCompleted 
                              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {isCompleted ? "Complete" : "In Progress"}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="p-4 rounded-full bg-zinc-800/50 w-fit mx-auto mb-4">
                  <Target className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-200">No Pathways Started</h3>
                <p className="text-sm mb-4 max-w-sm mx-auto text-zinc-500">Begin your learning journey with a structured pathway</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    asChild 
                    size="sm" 
                    className="rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/20"
                  >
                    <Link href="/path/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Pathway
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Link href="/path">
                      Browse Pathways
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumes */}
        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-1 text-zinc-100">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                  Resumes & Documents
                </CardTitle>
                <CardDescription className="text-sm mt-1 text-zinc-500">Manage your professional documents</CardDescription>
              </div>
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all"
              >
                <Link href="/resume">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Create Resume</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/resume/${doc.documentId}`}
                  >
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 transition-all duration-300 bg-zinc-900/50 hover:border-blue-500/30 hover:bg-zinc-800/50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 text-base text-zinc-100">{doc.title}</h4>
                        <p className="text-sm mb-2 line-clamp-1 text-zinc-500">{doc.summary || "No summary available"}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="capitalize">{doc.status}</span>
                          <span className="text-zinc-700">•</span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize flex-shrink-0 text-xs rounded-lg bg-zinc-800 border-zinc-700 text-zinc-400">
                        {doc.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {documents.length > 5 && (
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full text-sm rounded-xl text-zinc-500 hover:text-blue-500 hover:bg-zinc-900" 
                    size="sm"
                  >
                    <Link href="/resume">
                      View All {documents.length} Documents
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="p-4 rounded-full bg-zinc-800/50 w-fit mx-auto mb-4">
                  <FileText className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-200">No Resumes Yet</h3>
                <p className="text-sm mb-4 max-w-sm mx-auto text-zinc-500">Create your first professional resume</p>
                <Button 
                  asChild 
                  size="sm" 
                  className="rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium shadow-lg shadow-blue-600/20"
                >
                  <Link href="/resume">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Resume
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Courses Section */}
      {completedCourses.length > 0 && (
        <Card className="rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-semibold mb-1 text-zinc-100">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              Completed Courses
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-zinc-500">Great job! You've completed these courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-5 rounded-xl border border-green-500/30 transition-all duration-300 bg-green-500/5 hover:bg-green-500/10"
                >
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-1 text-base text-zinc-100">{(course.courseOutput as any)?.topic || course.courseName}</h4>
                    <p className="text-sm capitalize text-zinc-500">{course.category}</p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-xs rounded-lg bg-green-500/10 border-green-500/30 text-green-400">
                    Complete
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
