"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  User,
  BookOpen,
  GraduationCap,
  Briefcase,
  ExternalLink,
  TrendingUp,
  Target, 
  Award,
  ArrowRight,
  Loader2,
  Building2,
  DollarSign,
  Star,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GenerativeUIProps {
  toolName: string;
  result: any;
}

export function GenerativeUI({ toolName, result }: GenerativeUIProps) {
  // Try to parse if it's a string
  let data = result;
  if (typeof result === "string") {
    try {
      data = JSON.parse(result);
    } catch {
      data = result;
    }
  }

  switch (toolName) {
    case "course.list":
      return <CourseListUI data={data} />;
    case "course.get":
      return <CourseDetailUI data={data} />;
    case "course.generate":
      return <CourseGeneratedUI data={data} />;
    case "events.list":
      return <EventsListUI data={data} />;
    case "internships.list":
      return <InternshipsListUI data={data} />;
    case "pathway.list":
    case "pathway.get":
      return <PathwayUI data={data} />;
    case "pathway.create":
      return <PathwayCreatedUI data={data} />;
    case "resume.analyze":
      return <ResumeAnalysisUI data={data} />;
    case "resume.list":
      return <ResumeListUI data={data} />;
    case "resume.validate":
      return <ResumeValidationUI data={data} />;
    case "resume.create":
      return <ResumeCreatedUI data={data} />;
    case "document.list":
    case "resumes.list":
      return <ResumeDocumentsUI data={data} />;
    case "profile.get":
      return <ProfileViewUI data={data} />;
    case "profile.update":
      return <ProfileUpdatedUI data={data} />;
    case "forum.topic.list":
      return <ForumTopicsUI data={data} />;
    default:
      return <DefaultUI toolName={toolName} data={data} />;
  }
}

// Course List UI
function CourseListUI({ data }: { data: any }) {
  // Handle different data structures
  let courses = [];
  
  if (data?.data && Array.isArray(data.data)) {
    courses = data.data;
  } else if (data?.courses && Array.isArray(data.courses)) {
    courses = data.courses;
  } else if (Array.isArray(data)) {
    courses = data;
  }

  if (courses.length === 0) {
    return <EmptyState message="No courses found" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#3B82F6]" />
          Available Courses ({courses.length})
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {courses.map((course: any, idx: number) => (
          <Link
            key={course.id || idx}
            href={`/course/${course.courseId || course.id || idx}`}
            className="block"
          >
            <Card className="h-full border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3B82F6]/10 flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-[#3B82F6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                        {course.courseName || course.title || "Untitled Course"}
                      </h4>
                      <div className="flex items-center gap-2">
                        {course.level && (
                          <Badge variant="outline" className="text-xs">
                            {course.level}
                          </Badge>
                        )}
                        {course.duration && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#A1A1AA] line-clamp-3">
                    {course.courseOutput?.description ||
                      course.description ||
                      "No description available"}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                    <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                      {course.chapters && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.chapters} chapters
                        </span>
                      )}
                      {course.category && (
                        <span className="flex items-center gap-1">
                          • {course.category}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#3B82F6] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Course Detail UI
function CourseDetailUI({ data }: { data: any }) {
  const course = data?.course || data;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{course.category || "General"}</Badge>
          {course.level && <Badge variant="secondary">{course.level}</Badge>}
        </div>
        <h3 className="text-2xl font-bold">{course.courseName || course.title}</h3>
        <p className="text-[#A1A1AA]">{course.description}</p>
      </div>

      {course.chapters && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course Chapters
          </h4>
          <div className="space-y-2">
            {course.chapters.map((chapter: any, idx: number) => (
              <Card key={idx} className="border-[#27272A] bg-[#18181B]">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-sm font-semibold">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium">{chapter.name || chapter.title}</span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Course Generated UI - Shows success message and course details after generation
function CourseGeneratedUI({ data }: { data: any }) {
  const [redirecting, setRedirecting] = React.useState(false);
  const router = useRouter();

  const courseName = data?.courseName || data?.topic || "New Course";
  const courseId = data?.courseId || "";
  const category = data?.category || "General";
  const level = data?.level || data?.difficulty || "Beginner";
  const url = data?.url || `/create-course/${courseId}`;
  const chapters = data?.courseOutput?.chapters || [];

  const handleViewCourse = () => {
    setRedirecting(true);
    setTimeout(() => {
      router.push(url);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/10 flex-shrink-0">
          <CheckCircle className="h-6 w-6 text-[#10B981]" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-xl font-bold text-[#E4E4E7]">Course Created Successfully!</h3>
          <p className="text-sm text-[#A1A1AA]">
            Your AI-powered course has been generated and is ready to explore
          </p>
        </div>
      </div>

      {/* Course Info Card */}
      <Card className="border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{category}</Badge>
                  <Badge variant="secondary" className="text-xs">{level}</Badge>
                </div>
                <h4 className="text-lg font-bold text-[#E4E4E7]">{courseName}</h4>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/10 flex-shrink-0">
                <BookOpen className="h-6 w-6 text-[#3B82F6]" />
              </div>
            </div>

            {chapters.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[#27272A]">
                <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                  <BookOpen className="h-4 w-4" />
                  <span>{chapters.length} chapters generated</span>
                </div>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {chapters.slice(0, 5).map((chapter: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-semibold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-[#E4E4E7] truncate">{chapter.chapter_name || chapter.name || chapter.title}</span>
                    </div>
                  ))}
                  {chapters.length > 5 && (
                    <div className="text-xs text-[#A1A1AA] pl-8">
                      + {chapters.length - 5} more chapters
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleViewCourse}
            disabled={redirecting}
            className="w-full rounded-xl font-medium transition-all duration-200"
            style={{
              backgroundColor: redirecting ? "#27272A" : "#3B82F6",
              color: "#FFFFFF",
            }}
          >
            {redirecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opening Course...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Course
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Events List UI
function EventsListUI({ data }: { data: any }) {
  // Handle different data structures
  let events = [];
  
  if (data?.events && Array.isArray(data.events)) {
    events = data.events;
  } else if (data?.data && Array.isArray(data.data)) {
    events = data.data;
  } else if (Array.isArray(data)) {
    events = data;
  }

  if (events.length === 0) {
    return <EmptyState message="No events found" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#3B82F6]" />
          Upcoming Events ({events.length})
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {events.map((event: any, idx: number) => (
          <Card
            key={event.id || idx}
            className="border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3B82F6]/10 flex-shrink-0">
                    <Calendar className="h-6 w-6 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                      {event.title || event.name || "Untitled Event"}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.type && (
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      )}
                      {event.date && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {event.description && (
                  <p className="text-sm text-[#A1A1AA] line-clamp-3">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {event.location && (
                    <div className="flex items-center gap-2 text-[#A1A1AA]">
                      <MapPin className="h-4 w-4 text-[#3B82F6]" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.participants && (
                    <div className="flex items-center gap-2 text-[#A1A1AA]">
                      <Users className="h-4 w-4 text-[#3B82F6]" />
                      <span>{event.participants} participants</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#27272A]">
                  {(event.eventLink || event.link || event.url) ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]"
                      asChild
                    >
                      <a href={event.eventLink || event.link || event.url} target="_blank" rel="noopener noreferrer">
                        View Details
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]"
                      asChild
                    >
                      <Link href={`/events/${event.id || event.eventId || idx}`}>
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                  {event.registrationLink && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white"
                      asChild
                    >
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Internships List UI
function InternshipsListUI({ data }: { data: any }) {
  // Handle different data structures
  let internships = [];
  
  if (data?.internships && Array.isArray(data.internships)) {
    internships = data.internships;
  } else if (data?.data && Array.isArray(data.data)) {
    internships = data.data;
  } else if (Array.isArray(data)) {
    internships = data;
  }

  if (internships.length === 0) {
    return <EmptyState message="No internships found" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#3B82F6]" />
          Available Internships ({internships.length})
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {internships.map((internship: any, idx: number) => (
          <Card
            key={internship.id || idx}
            className="border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3B82F6]/10 flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                      {internship.title || internship.position || "Untitled Position"}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {internship.type && (
                        <Badge variant="outline" className="text-xs">
                          {internship.type}
                        </Badge>
                      )}
                      {internship.remote && (
                        <Badge variant="secondary" className="text-xs">
                          Remote
                        </Badge>
                      )}
                      {internship.duration && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {internship.duration}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {internship.description && (
                  <p className="text-sm text-[#A1A1AA] line-clamp-3">
                    {internship.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {internship.company && (
                    <div className="flex items-center gap-2 text-[#A1A1AA]">
                      <Building2 className="h-4 w-4 text-[#3B82F6]" />
                      <span className="font-medium">{internship.company}</span>
                    </div>
                  )}
                  {internship.location && (
                    <div className="flex items-center gap-2 text-[#A1A1AA]">
                      <MapPin className="h-4 w-4 text-[#3B82F6]" />
                      <span>{internship.location}</span>
                    </div>
                  )}
                  {internship.stipend && (
                    <div className="flex items-center gap-2 text-[#A1A1AA]">
                      <DollarSign className="h-4 w-4 text-[#10B981]" />
                      <span className="font-medium text-[#10B981]">{internship.stipend}</span>
                    </div>
                  )}
                </div>

 <div className="flex gap-2 pt-2 border-t border-[#27272A]">
                  {(internship.link || internship.applyLink) && (
                    <Button
                      size="sm"
                      className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]"
                      asChild
                    >
                      <a href={internship.link || internship.applyLink} target="_blank" rel="noopener noreferrer">
                        View & Apply
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pathway UI
function PathwayUI({ data }: { data: any }) {
  // Handle different data structures
  let pathways = [];
  let pathway = null;
  
  // Check if data has pathways array
  if (data?.pathways && Array.isArray(data.pathways)) {
    pathways = data.pathways;
  } 
  // Check if data itself is an array
  else if (Array.isArray(data)) {
    pathways = data;
  }
  // Single pathway
  else {
    pathway = data?.pathway || data;
  }
  
  // If we have a list of pathways, show them in grid
  if (pathways.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-[#3B82F6]" />
            Learning Pathways ({pathways.length})
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {pathways.map((path: any, idx: number) => (
            <Link
              key={path.id || idx}
              href={`/path/path/${path.slug || path.id || idx}`}
              className="block"
            >
              <Card className="h-full border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3B82F6]/10 flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-[#3B82F6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                          {path.title || "Untitled Pathway"}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {path.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {path.difficulty}
                            </Badge>
                          )}
                          {path.estimatedTime && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {path.estimatedTime}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {path.description && (
                      <p className="text-sm text-[#A1A1AA] line-clamp-3">
                        {path.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <BookOpen className="h-3 w-3" />
                        <span>Learning Path</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#3B82F6] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  
  // Single pathway detail view
  const steps = pathway?.steps || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Badge variant="outline">Learning Path</Badge>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-[#3B82F6]" />
            {pathway?.career || pathway?.title || "Career Pathway"}
          </h3>
          {pathway?.description && (
            <p className="text-[#A1A1AA]">{pathway.description}</p>
          )}
        </div>
        {pathway?.id && (
          <Button
            size="sm"
            variant="outline"
            className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white"
            asChild
          >
            <Link href={`/path/path/${pathway.slug || pathway.id}`}>
              View Full Path
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {Array.isArray(steps) && steps.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Learning Steps
          </h4>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 pr-4">
              {steps.map((step: any, idx: number) => (
                <Card
                  key={idx}
                  className="border-[#27272A] bg-[#18181B] hover:border-[#3B82F6] transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h5 className="font-semibold">{step.title || step.name}</h5>
                        <p className="text-sm text-[#A1A1AA]">
                          {step.description || "Complete this step"}
                        </p>
                        {step.duration && (
                          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                            <Clock className="h-3 w-3" />
                            <span>{step.duration}</span>
                          </div>
                        )}
                        {step.resources && step.resources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {step.resources
                              .filter((resource: any) => resource.url)
                              .map((resource: any, rIdx: number) => (
                                <Button
                                  key={rIdx}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-[#27272A] hover:border-[#3B82F6]"
                                  asChild
                                >
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    {resource.title || `Resource ${rIdx + 1}`}
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                </Button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Pathway Created UI - Single card for newly created pathway
function PathwayCreatedUI({ data }: { data: any }) {
  const pathway = data?.pathway || data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-[#10B981]" />
        <h3 className="text-lg font-semibold text-[#10B981]">Pathway Created Successfully!</h3>
      </div>
      
      <Link
        href={`/path/path/${pathway.slug || pathway.id}`}
        className="block"
      >
        <Card className="border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group">
          <CardContent className="p-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#10B981]/10 flex-shrink-0">
                  <Target className="h-6 w-6 text-[#10B981]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg mb-2 group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                    {pathway.title || "Untitled Pathway"}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {pathway.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {pathway.difficulty}
                      </Badge>
                    )}
                    {pathway.estimatedTime && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pathway.estimatedTime}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {pathway.description && (
                <p className="text-sm text-[#A1A1AA] line-clamp-3">
                  {pathway.description}
                </p>
              )}

              {pathway.steps && pathway.steps.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <TrendingUp className="h-3 w-3 text-[#3B82F6]" />
                  <span>{pathway.steps.length} learning steps</span>
                </div>
              )}

              {pathway.prerequisites && pathway.prerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pathway.prerequisites.slice(0, 3).map((prereq: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {prereq}
                    </Badge>
                  ))}
                  {pathway.prerequisites.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{pathway.prerequisites.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                <div className="flex items-center gap-2 text-xs text-[#10B981]">
                  <CheckCircle className="h-3 w-3" />
                  <span>Ready to start learning</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#3B82F6] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

// Resume Documents UI - Displays list of user's resume documents in horizontal scroll
function ResumeDocumentsUI({ data }: { data: any }) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Handle different data structures
  let documents: any[] = [];
  
  if (data?.data && Array.isArray(data.data)) {
    documents = data.data;
  } else if (data?.documents && Array.isArray(data.documents)) {
    documents = data.documents;
  } else if (Array.isArray(data)) {
    documents = data;
  }

  if (documents.length === 0) {
    return <EmptyState message="No resumes found" />;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "public":
        return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20";
      case "private":
        return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20";
      case "archived":
        return "text-[#A1A1AA] bg-[#A1A1AA]/10 border-[#A1A1AA]/20";
      default:
        return "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#3B82F6]" />
          My Resumes ({documents.length})
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-[#27272A]"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-[#27272A]"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {documents.map((doc: any, idx: number) => {
          const documentId = doc.documentId || doc.id;
          const title = doc.title || "Untitled Resume";
          const status = doc.status || "private";
          const updatedAt = doc.updatedAt || doc.createdAt;
          const themeColor = doc.themeColor || "#7c3aed";
          
          return (
            <Link
              key={documentId || idx}
              href={`/dashboard/document/${documentId}/edit`}
              className="block flex-shrink-0"
            >
              <Card
                className="w-[260px] border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group overflow-hidden"
              >
                {/* Theme Color Header */}
                <div 
                  className="h-2 w-full"
                  style={{ backgroundColor: themeColor }}
                />
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${themeColor}20` }}
                      >
                        <FileText className="h-5 w-5" style={{ color: themeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-[#3B82F6] transition-colors">
                          {title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${getStatusColor(status)}`}
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>

                    {/* Summary */}
                    {doc.summary && (
                      <p className="text-xs text-[#A1A1AA] line-clamp-2">
                        {doc.summary}
                      </p>
                    )}

                    {/* Author & Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                      <div className="flex flex-col gap-0.5">
                        {doc.authorName && (
                          <span className="text-[10px] text-[#E4E4E7] truncate max-w-[120px]">
                            {doc.authorName}
                          </span>
                        )}
                        {updatedAt && (
                          <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(updatedAt).toLocaleDateString("en-US", { 
                              month: "short", 
                              day: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Resume List UI - Displays list of past resume analyses in horizontal scroll
function ResumeListUI({ data }: { data: any }) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Handle different data structures
  let analyses: any[] = [];
  
  if (data?.data && Array.isArray(data.data)) {
    analyses = data.data;
  } else if (Array.isArray(data)) {
    analyses = data;
  }

  if (analyses.length === 0) {
    return <EmptyState message="No resume analyses found" />;
  }

  // Helper to get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#10B981]";
    if (score >= 60) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-[#10B981]/10 border-[#10B981]/20";
    if (score >= 60) return "bg-[#F59E0B]/10 border-[#F59E0B]/20";
    return "bg-[#EF4444]/10 border-[#EF4444]/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#3B82F6]" />
          My Resume Analyses ({analyses.length})
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-[#27272A]"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-[#27272A]"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {analyses.map((analysis: any, idx: number) => {
          const overallScore = analysis.overallScore || 0;
          const atsScore = analysis.atsMatchPercentage || 0;
          
          return (
            <Link
              key={analysis.analysisId || idx}
              href={`/resume/analysis/${analysis.analysisId}`}
              className="block flex-shrink-0"
            >
              <Card
                className="w-[300px] border-[#27272A] bg-gradient-to-br from-[#18181B] to-[#0A0A0A] hover:border-[#3B82F6] transition-all cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]/10 flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-[#3B82F6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-[#3B82F6] transition-colors">
                          {analysis.jobTitle || "Untitled Position"}
                        </h4>
                        {analysis.companyName && (
                          <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{analysis.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Badges - Horizontal */}
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 flex flex-col items-center px-2 py-1.5 rounded-lg border ${getScoreBgColor(overallScore)}`}>
                        <span className="text-[10px] text-[#A1A1AA]">Score</span>
                        <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
                      </div>
                      <div className={`flex-1 flex flex-col items-center px-2 py-1.5 rounded-lg border ${getScoreBgColor(atsScore)}`}>
                        <span className="text-[10px] text-[#A1A1AA]">ATS</span>
                        <span className={`text-lg font-bold ${getScoreColor(atsScore)}`}>{atsScore}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#A1A1AA]">Overall Match</span>
                        <span className={`font-medium ${getScoreColor(overallScore)}`}>
                          {getScoreLabel(overallScore)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            overallScore >= 80 ? "bg-[#10B981]" : 
                            overallScore >= 60 ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                          }`}
                          style={{ width: `${overallScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                      {analysis.createdAt && (
                        <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(analysis.createdAt).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      )}
                      <ArrowRight className="h-3 w-3 text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Resume Analysis UI
function ResumeAnalysisUI({ data }: { data: any }) {
  const analysis = data?.analysis || data;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-[#3B82F6]" />
          Resume Analysis
        </h3>
      </div>

      {analysis?.score && (
        <Card className="border-[#27272A] bg-gradient-to-br from-[#3B82F6]/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#A1A1AA]">Overall Score</span>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[#FCD34D]" />
                <span className="text-2xl font-bold">{analysis.score}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis?.strengths && analysis.strengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-[#10B981] flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h4>
          <div className="space-y-2">
            {analysis.strengths.map((strength: string, idx: number) => (
              <Card key={idx} className="border-[#10B981]/20 bg-[#10B981]/5">
                <CardContent className="p-3 text-sm">{strength}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysis?.improvements && analysis.improvements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-[#F59E0B] flex items-center gap-2">
            <Award className="h-4 w-4" />
            Areas for Improvement
          </h4>
          <div className="space-y-2">
            {analysis.improvements.map((improvement: string, idx: number) => (
              <Card key={idx} className="border-[#F59E0B]/20 bg-[#F59E0B]/5">
                <CardContent className="p-3 text-sm">{improvement}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Resume Validation UI - Shows missing fields when validating resume data
function ResumeValidationUI({ data }: { data: any }) {
  const isValid = data?.isValid || false;
  const missingFields = data?.missingFields || [];
  const providedData = data?.providedData || {};

  if (isValid) {
    return (
      <Card className="border-[#10B981]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/20">
              <CheckCircle className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#10B981]">Ready to Create!</h3>
              <p className="text-sm text-[#A1A1AA]">
                All required fields are provided. Your resume can now be created.
              </p>
            </div>
          </div>
          
          {/* Show summary of provided data */}
          {Object.keys(providedData).length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#27272A]">
              <p className="text-xs text-[#A1A1AA] mb-2">Summary of your information:</p>
              <div className="flex flex-wrap gap-2">
                {providedData.title && (
                  <Badge variant="outline" className="text-[#E4E4E7] border-[#27272A]">
                    📄 {providedData.title}
                  </Badge>
                )}
                {providedData.personalInfo?.firstName && (
                  <Badge variant="outline" className="text-[#E4E4E7] border-[#27272A]">
                    👤 {providedData.personalInfo.firstName} {providedData.personalInfo?.lastName || ""}
                  </Badge>
                )}
                {providedData.personalInfo?.email && (
                  <Badge variant="outline" className="text-[#E4E4E7] border-[#27272A]">
                    ✉️ {providedData.personalInfo.email}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Next step hint */}
          <div className="mt-4 pt-4 border-t border-[#27272A]">
            <div className="bg-[#10B981]/10 rounded-lg p-3 border border-[#10B981]/20">
              <p className="text-sm text-[#10B981] font-medium mb-1">✨ Next Step</p>
              <p className="text-xs text-[#A1A1AA] mb-2">
                Say one of the following to create your resume:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] cursor-pointer">
                  &ldquo;Create it now&rdquo;
                </Badge>
                <Badge className="bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] cursor-pointer">
                  &ldquo;Generate my resume&rdquo;
                </Badge>
                <Badge className="bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] cursor-pointer">
                  &ldquo;Proceed with resume creation&rdquo;
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#F59E0B]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F59E0B]/20 flex-shrink-0">
            <FileText className="h-6 w-6 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F59E0B]">Missing Information</h3>
            <p className="text-sm text-[#A1A1AA]">
              Please provide the following details to create your resume:
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {missingFields.map((field: any, idx: number) => (
            <div 
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#27272A]/50 border border-[#27272A]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B]/20 flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#F59E0B]">{idx + 1}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#E4E4E7]">{field.field}</p>
                <p className="text-xs text-[#A1A1AA]">{field.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#27272A]">
          <p className="text-xs text-[#A1A1AA]">
            💡 Tip: You can provide information like: &ldquo;My name is John Doe, email john@email.com, phone 555-1234. I worked at Google as a Software Engineer.&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Resume Created UI - Shows success after creating a resume
function ResumeCreatedUI({ data }: { data: any }) {
  const success = data?.success || false;
  const resumeData = data?.data || {};
  const error = data?.error;

  if (!success) {
    return (
      <Card className="border-[#EF4444]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/20">
              <FileText className="h-6 w-6 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#EF4444]">Failed to Create Resume</h3>
              <p className="text-sm text-[#A1A1AA]">{error || "An error occurred while creating your resume."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sectionsCreated = resumeData.sectionsCreated || {};
  const sectionsList = [];
  if (sectionsCreated.personalInfo) sectionsList.push("Personal Info");
  if (sectionsCreated.experiences > 0) sectionsList.push(`${sectionsCreated.experiences} Experience${sectionsCreated.experiences > 1 ? 's' : ''}`);
  if (sectionsCreated.educations > 0) sectionsList.push(`${sectionsCreated.educations} Education${sectionsCreated.educations > 1 ? 's' : ''}`);
  if (sectionsCreated.skills > 0) sectionsList.push(`${sectionsCreated.skills} Skill${sectionsCreated.skills > 1 ? 's' : ''}`);

  return (
    <Card className="border-[#10B981]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#10B981]/20 flex-shrink-0">
            <CheckCircle className="h-7 w-7 text-[#10B981]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#10B981] mb-1">Resume Created Successfully!</h3>
            <p className="text-sm text-[#E4E4E7] font-medium">{resumeData.title || "My Resume"}</p>
            
            {/* Sections summary */}
            {sectionsList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {sectionsList.map((section, idx) => (
                  <Badge 
                    key={idx}
                    variant="outline" 
                    className="text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {section}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-[#27272A]">
          {resumeData.redirectUrl && (
            <Link href={resumeData.redirectUrl} className="flex-1">
              <Button className="w-full bg-[#10B981] hover:bg-[#10B981]/90 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit Resume
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full border-[#27272A] hover:bg-[#27272A]">
              <FileText className="h-4 w-4 mr-2" />
              View All Resumes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Profile View UI - Displays user profile details
function ProfileViewUI({ data }: { data: any }) {
  const success = data?.success || false;
  const profile = data?.data || {};
  const error = data?.error;

  if (!success) {
    return (
      <Card className="border-[#EF4444]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/20">
              <User className="h-6 w-6 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#EF4444]">Could Not Load Profile</h3>
              <p className="text-sm text-[#A1A1AA]">{error || "Unable to retrieve your profile."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const interests = profile.interests || [];
  const skills = profile.skills || [];
  const learningGoals = profile.learningGoals || [];
  const socialLinks = profile.socialLinks || {};

  return (
    <Card className="border-[#3B82F6]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#3B82F6]/20 flex-shrink-0">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <User className="h-8 w-8 text-[#3B82F6]" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#E4E4E7]">{profile.name || "Your Profile"}</h3>
            {profile.occupation && (
              <p className="text-sm text-[#3B82F6] font-medium">{profile.occupation}</p>
            )}
            {profile.location && (
              <p className="text-sm text-[#A1A1AA] flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </p>
            )}
            {profile.email && (
              <p className="text-xs text-[#A1A1AA] mt-1">{profile.email}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide">About</h4>
            <p className="text-sm text-[#E4E4E7]">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide flex items-center gap-2">
              <Award className="h-4 w-4 text-[#10B981]" />
              Skills ({skills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, idx: number) => (
                <Badge 
                  key={idx}
                  variant="outline" 
                  className="text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F59E0B]" />
              Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string, idx: number) => (
                <Badge 
                  key={idx}
                  variant="outline" 
                  className="text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Learning Goals */}
        {learningGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide flex items-center gap-2">
              <Target className="h-4 w-4 text-[#3B82F6]" />
              Learning Goals
            </h4>
            <div className="flex flex-wrap gap-2">
              {learningGoals.map((goal: string, idx: number) => (
                <Badge 
                  key={idx}
                  variant="outline" 
                  className="text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20"
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wide">Links</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socialLinks).map(([platform, url]: [string, any], idx: number) => (
                url && (
                  <a 
                    key={idx}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {platform}
                  </a>
                )
              ))}
              {profile.website && (
                <a 
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="pt-4 border-t border-[#27272A]">
          <Link href="/profile">
            <Button variant="outline" className="w-full border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white">
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Profile Updated UI - Shows success after updating profile
function ProfileUpdatedUI({ data }: { data: any }) {
  const success = data?.success || false;
  const profile = data?.data || {};
  const fieldsUpdated = data?.fieldsUpdated || [];
  const error = data?.error;

  if (!success) {
    return (
      <Card className="border-[#EF4444]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/20">
              <User className="h-6 w-6 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#EF4444]">Failed to Update Profile</h3>
              <p className="text-sm text-[#A1A1AA]">{error || "An error occurred while updating your profile."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#10B981]/30 bg-gradient-to-br from-[#18181B] to-[#0A0A0A]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#10B981]/20 flex-shrink-0">
            <CheckCircle className="h-7 w-7 text-[#10B981]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#10B981] mb-1">Profile Updated!</h3>
            <p className="text-sm text-[#E4E4E7]">{profile.name || "Your profile"}</p>
            
            {/* Fields updated */}
            {fieldsUpdated.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {fieldsUpdated.map((field: string, idx: number) => (
                  <Badge 
                    key={idx}
                    variant="outline" 
                    className="text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {field}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick summary of updated profile */}
        <div className="mt-4 pt-4 border-t border-[#27272A] space-y-2">
          {profile.bio && fieldsUpdated.includes("bio") && (
            <div className="text-sm">
              <span className="text-[#A1A1AA]">Bio: </span>
              <span className="text-[#E4E4E7]">{profile.bio.slice(0, 100)}{profile.bio.length > 100 ? "..." : ""}</span>
            </div>
          )}
          {profile.skills?.length > 0 && fieldsUpdated.includes("skills") && (
            <div className="text-sm">
              <span className="text-[#A1A1AA]">Skills: </span>
              <span className="text-[#E4E4E7]">{profile.skills.slice(0, 5).join(", ")}{profile.skills.length > 5 ? "..." : ""}</span>
            </div>
          )}
          {profile.occupation && fieldsUpdated.includes("occupation") && (
            <div className="text-sm">
              <span className="text-[#A1A1AA]">Occupation: </span>
              <span className="text-[#E4E4E7]">{profile.occupation}</span>
            </div>
          )}
          {profile.location && fieldsUpdated.includes("location") && (
            <div className="text-sm">
              <span className="text-[#A1A1AA]">Location: </span>
              <span className="text-[#E4E4E7]">{profile.location}</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="mt-4 pt-4 border-t border-[#27272A]">
          <Link href="/profile">
            <Button variant="outline" className="w-full border-[#27272A] hover:bg-[#27272A]">
              <User className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Forum Topics UI
function ForumTopicsUI({ data }: { data: any }) {
  const topics = data?.topics || data?.data || [];

  if (!Array.isArray(topics) || topics.length === 0) {
    return <EmptyState message="No forum topics found" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-[#3B82F6]" />
        Forum Topics ({topics.length})
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {topics.map((topic: any, idx: number) => (
            <Card
              key={topic.id || idx}
              className="border-[#27272A] bg-[#18181B] hover:border-[#3B82F6] transition-all cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">{topic.title}</h4>
                  <p className="text-sm text-[#A1A1AA] line-clamp-2">{topic.content}</p>
                  <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                    <span>{topic.author || "Anonymous"}</span>
                    <span>•</span>
                    <span>{topic.replies || 0} replies</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Default UI for unknown tool results
function DefaultUI({ toolName, data }: { toolName: string; data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{toolName}</Badge>
        <span className="text-sm text-[#A1A1AA]">Result</span>
      </div>
      <ScrollArea className="h-[300px]">
        <pre className="text-xs text-[#10B981] whitespace-pre-wrap break-words bg-[#0A0A0A] rounded-lg p-4 border border-[#27272A]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-[#27272A] bg-[#18181B]">
      <CardContent className="p-8 text-center">
        <p className="text-[#A1A1AA]">{message}</p>
      </CardContent>
    </Card>
  );
}
