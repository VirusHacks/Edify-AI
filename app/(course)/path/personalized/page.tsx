"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Brain, 
  Rocket, 
  ChevronDown,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Zap,
  Globe,
  Award,
  BookOpen,
  RefreshCw,
  Play,
  GraduationCap,
  Briefcase,
  Star,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type RoadmapStep = {
  title: string;
  description: string;
  estimatedTime: string;
  marketRelevance: string;
  resources: { title: string; url?: string | null; type?: string }[];
  milestones?: string[];
  skills?: string[];
};

type GeneratedRoadmap = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  targetCareer: string;
  estimatedTime: string;
  difficulty: string;
  prerequisites: string[];
  steps: RoadmapStep[];
  marketInsights?: {
    demandTrends: string[];
    salaryRange: string;
    topCompanies: string[];
    futureOutlook: string;
    certifications: string[];
  };
  personalizedFor?: {
    currentSkills: string[];
    skillGaps: string[];
    quickWins: string[];
  };
  citations?: string[];
};

export default function PersonalizedRoadmapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    }>
      <PersonalizedRoadmapContent />
    </Suspense>
  );
}

function PersonalizedRoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMarketIntelligence, setHasMarketIntelligence] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isExistingRoadmap, setIsExistingRoadmap] = useState(false);
  const [atsSkillGaps, setAtsSkillGaps] = useState<{ skills: string[]; jobTitle: string; companyName: string } | null>(null);

  // Check if coming from ATS page with skill gaps
  useEffect(() => {
    const fromATS = searchParams?.get("fromATS") === "true";
    if (fromATS) {
      const storedData = sessionStorage.getItem("atsSkillGaps");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setAtsSkillGaps(parsed);
          sessionStorage.removeItem("atsSkillGaps"); // Clear after reading
        } catch (e) {
          console.error("Error parsing ATS skill gaps:", e);
        }
      }
    }
  }, [searchParams]);

  // Check if coming from discovery page
  useEffect(() => {
    const fromDiscovery = searchParams?.get("fromDiscovery") === "true";
    const career = searchParams?.get("career");
    if (fromDiscovery && career) {
      // Discovery data is already in sessionStorage, will be used in generateRoadmap
      const storedData = sessionStorage.getItem("discoveryData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          // Store for use in roadmap generation
          sessionStorage.setItem("discoveryData", JSON.stringify(parsed));
        } catch (e) {
          console.error("Error parsing discovery data:", e);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    checkExistingRoadmap();
  }, []);

  useEffect(() => {
    if (isGenerating && !isLoadingExisting) {
      const interval = setInterval(() => {
        setGenerationPhase(prev => (prev < 4 ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, isLoadingExisting]);

  const checkExistingRoadmap = async () => {
    setIsLoadingExisting(true);
    
    // If coming from ATS with skill gaps, always generate a new roadmap
    const fromATS = searchParams?.get("fromATS") === "true";
    if (fromATS) {
      setIsLoadingExisting(false);
      // Small delay to let atsSkillGaps be set from the other useEffect
      setTimeout(() => generateRoadmap(true), 100);
      return;
    }

    // If coming from discovery, always generate a new roadmap
    const fromDiscovery = searchParams?.get("fromDiscovery") === "true";
    if (fromDiscovery) {
      setIsLoadingExisting(false);
      // Small delay to let discovery data be set from the other useEffect
      setTimeout(() => generateRoadmap(true), 100);
      return;
    }
    
    try {
      const response = await fetch("/api/market-roadmap", { method: "GET" });
      const data = await response.json();

      if (data.success && data.hasExistingRoadmap && data.data) {
        setRoadmap(data.data);
        setHasMarketIntelligence(!!data.data.marketInsights);
        setIsExistingRoadmap(true);
        setIsGenerating(false);
        setIsLoadingExisting(false);
      } else {
        setIsLoadingExisting(false);
        generateRoadmap(false);
      }
    } catch (err) {
      setIsLoadingExisting(false);
      generateRoadmap(false);
    }
  };

  const generateRoadmap = async (regenerate: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    setGenerationPhase(0);
    setIsExistingRoadmap(false);

    try {
      // Include ATS skill gaps if available
      const requestBody: any = { timeframe: "1year", regenerate };
      if (atsSkillGaps) {
        requestBody.skillGaps = atsSkillGaps.skills;
        requestBody.targetRole = atsSkillGaps.jobTitle;
        requestBody.targetCompany = atsSkillGaps.companyName;
      }

      // Include discovery data if available
      const discoveryDataStr = sessionStorage.getItem("discoveryData");
      if (discoveryDataStr) {
        try {
          const discoveryData = JSON.parse(discoveryDataStr);
          if (discoveryData.selectedCareer) {
            requestBody.targetCareer = discoveryData.selectedCareer;
          }
          if (discoveryData.selectedDescription) {
            requestBody.customGoals = [discoveryData.selectedDescription];
          }
          // Extract interests from discovery data
          if (discoveryData.likedItems && discoveryData.likedItems.length > 0) {
            const interests = discoveryData.likedItems.map((item: any) => item.text);
            requestBody.focusAreas = interests;
          }
        } catch (e) {
          console.error("Error parsing discovery data:", e);
        }
      }

      // Get career from URL params if available
      const careerParam = searchParams?.get("career");
      if (careerParam && !requestBody.targetCareer) {
        requestBody.targetCareer = decodeURIComponent(careerParam);
      }

      const response = await fetch("/api/market-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate roadmap");
      }

      setRoadmap(data.data);
      setHasMarketIntelligence(data.hasMarketIntelligence);
      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsGenerating(false);
    }
  };

  const navigateToRoadmap = () => {
    if (roadmap?.slug) {
      router.push(`/path/path/${roadmap.slug}`);
    }
  };

  const phases = [
    { icon: Brain, text: "Analyzing your profile and skills..." },
    { icon: Globe, text: "Fetching real-time market intelligence..." },
    { icon: Target, text: "Identifying skill gaps and priorities..." },
    { icon: Rocket, text: "Building your personalized learning path..." },
    { icon: Sparkles, text: "Finalizing your career roadmap..." },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Navigation */}
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Profile</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* ATS Skill Gaps Banner */}
        {atsSkillGaps && (
          <Card className="bg-[#F59E0B]/10 border-[#F59E0B]/30 rounded-xl">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-[#E4E4E7]">
                    Roadmap Based on ATS Analysis
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
                    This roadmap is tailored to help you develop the {atsSkillGaps.skills.length} skills 
                    identified as gaps in your resume analysis
                    {atsSkillGaps.jobTitle && ` for ${atsSkillGaps.jobTitle}`}
                    {atsSkillGaps.companyName && ` at ${atsSkillGaps.companyName}`}.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {atsSkillGaps.skills.slice(0, 5).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {atsSkillGaps.skills.length > 5 && (
                      <Badge 
                        variant="outline" 
                        className="bg-[#27272A] border-[#3F3F46] text-[#A1A1AA] text-xs"
                      >
                        +{atsSkillGaps.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Card */}
        <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl overflow-hidden">
          <div className="relative p-8 md:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 via-transparent to-purple-500/5" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                <Brain className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold text-[#E4E4E7] tracking-tight">
                  AI-Powered Career Roadmap
                </h1>
                <p className="text-sm text-[#A1A1AA]">
                  Personalized for your profile • Market-aware for 2025-2030
                </p>
              </div>
            </div>
            
            <Separator className="my-6 bg-[#27272A]" />
            
            <div className="flex flex-wrap gap-2">
              {isExistingRoadmap && (
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Saved Roadmap
                </Badge>
              )}
              <Badge variant="outline" className="bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6] text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Perplexity Market Intelligence
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs font-medium">
                <Target className="w-3 h-3 mr-1.5" />
                Profile-Based
              </Badge>
              <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-xs font-medium">
                <TrendingUp className="w-3 h-3 mr-1.5" />
                Future-Proof
              </Badge>
            </div>
          </div>
        </Card>

        {/* Loading Existing State */}
        {isLoadingExisting && (
          <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-medium text-[#E4E4E7]">Checking Your Roadmap</h2>
                <p className="text-sm text-[#A1A1AA]">Looking for your existing personalized roadmap...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generating State */}
        {isGenerating && !isLoadingExisting && (
          <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl">
            <CardContent className="py-16 px-8">
              <div className="max-w-md mx-auto space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-2xl bg-[#3B82F6]/20" />
                    <div className="relative w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-[#3B82F6] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-[#E4E4E7]">Creating Your Personalized Roadmap</h2>
                    <p className="text-sm text-[#A1A1AA]">Analyzing your profile and current job market trends...</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {phases.map((phase, index) => {
                    const Icon = phase.icon;
                    const isActive = index <= generationPhase;
                    const isCurrent = index === generationPhase;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isActive ? 1 : 0.4, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          isCurrent ? "bg-[#27272A]/50" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCurrent ? "bg-[#3B82F6]/20" : isActive ? "bg-emerald-500/20" : "bg-[#27272A]"
                        }`}>
                          {isCurrent ? (
                            <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
                          ) : isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Icon className="w-4 h-4 text-[#A1A1AA]" />
                          )}
                        </div>
                        <span className={`text-sm ${isActive ? "text-[#E4E4E7]" : "text-[#A1A1AA]"}`}>
                          {phase.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-xs text-center text-[#A1A1AA]">
                  This may take 30-60 seconds for the most accurate results...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <Card className="bg-[#0A0A0A] border-red-500/30 rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-red-400">Generation Failed</h3>
                <p className="text-sm text-[#A1A1AA] max-w-sm">{error}</p>
              </div>
              <Button 
                onClick={() => generateRoadmap(true)}
                className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result State */}
        {roadmap && !isGenerating && !isLoadingExisting && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Target, label: "Target Role", value: roadmap.targetCareer, color: "purple" },
                { icon: Clock, label: "Duration", value: roadmap.estimatedTime, color: "blue" },
                { icon: BookOpen, label: "Modules", value: roadmap.steps.length.toString(), color: "emerald" },
                { icon: Star, label: "Difficulty", value: roadmap.difficulty, color: "amber" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-[#0A0A0A] border-[#27272A] rounded-2xl h-full">
                    <CardContent className="p-5">
                      <stat.icon className={`w-5 h-5 mb-3 ${
                        stat.color === "purple" ? "text-purple-400" :
                        stat.color === "blue" ? "text-[#3B82F6]" :
                        stat.color === "emerald" ? "text-emerald-400" :
                        "text-amber-400"
                      }`} />
                      <p className="text-lg font-semibold text-[#E4E4E7] truncate">{stat.value}</p>
                      <p className="text-xs text-[#A1A1AA] mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="timeline" className="space-y-6">
              <TabsList className="w-full bg-[#0A0A0A] border border-[#27272A] rounded-xl p-1 h-auto">
                <TabsTrigger 
                  value="timeline" 
                  className="flex-1 data-[state=active]:bg-[#27272A] data-[state=active]:text-[#E4E4E7] text-[#A1A1AA] rounded-lg py-2.5 text-sm font-medium"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Learning Path
                </TabsTrigger>
                <TabsTrigger 
                  value="skills" 
                  className="flex-1 data-[state=active]:bg-[#27272A] data-[state=active]:text-[#E4E4E7] text-[#A1A1AA] rounded-lg py-2.5 text-sm font-medium"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Skills & Gaps
                </TabsTrigger>
                <TabsTrigger 
                  value="market" 
                  className="flex-1 data-[state=active]:bg-[#27272A] data-[state=active]:text-[#E4E4E7] text-[#A1A1AA] rounded-lg py-2.5 text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Market Intel
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4 mt-6">
                {/* Quick Wins */}
                {roadmap.personalizedFor?.quickWins && roadmap.personalizedFor.quickWins.length > 0 && (
                  <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-emerald-400">Quick Wins - Start Here!</h3>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.personalizedFor.quickWins.slice(0, 3).map((win, i) => (
                              <Badge key={i} variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                {win}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline Steps */}
                <div className="relative space-y-4">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#3B82F6] via-purple-500 to-cyan-500 opacity-20" />
                  
                  {roadmap.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-14"
                    >
                      <div className={`absolute left-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                        index === 0 
                          ? "bg-[#3B82F6] text-white" 
                          : "bg-[#27272A] text-[#A1A1AA] border border-[#27272A]"
                      }`}>
                        {index + 1}
                      </div>

                      <Card 
                        className={`bg-[#0A0A0A] rounded-2xl cursor-pointer transition-all ${
                          expandedStep === index 
                            ? "border-[#3B82F6]/30" 
                            : "border-[#27272A] hover:border-[#3B82F6]/20"
                        }`}
                        onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-[#E4E4E7] truncate">{step.title}</h4>
                                {index === 0 && (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                    Start
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {step.estimatedTime}
                                </span>
                                <span className="flex items-center gap-1.5 text-[#3B82F6]">
                                  <TrendingUp className="w-3 h-3" />
                                  High Demand
                                </span>
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-[#A1A1AA] transition-transform flex-shrink-0 ${
                              expandedStep === index ? "rotate-180" : ""
                            }`} />
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {expandedStep === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <Separator className="my-4 bg-[#27272A]" />
                                <div className="space-y-4">
                                  <p className="text-sm text-[#A1A1AA] leading-relaxed">{step.description}</p>
                                  
                                  {step.skills && step.skills.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-[#A1A1AA]">Skills you&apos;ll learn:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {step.skills.map((skill, i) => (
                                          <Badge key={i} variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="p-3 rounded-xl bg-[#3B82F6]/5 border border-[#3B82F6]/20">
                                    <div className="flex items-start gap-3">
                                      <TrendingUp className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-[#3B82F6]">{step.marketRelevance}</p>
                                    </div>
                                  </div>

                                  {step.resources && step.resources.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-[#A1A1AA]">Resources:</p>
                                      <div className="space-y-2">
                                        {step.resources.slice(0, 3).map((resource, i) => (
                                          <a 
                                            key={i}
                                            href={resource.url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[#27272A]/50 hover:bg-[#27272A] transition-colors group"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <BookOpen className="w-4 h-4 text-cyan-400" />
                                            <span className="text-sm text-[#E4E4E7] flex-1 truncate">{resource.title}</span>
                                            <ExternalLink className="w-3 h-3 text-[#A1A1AA] group-hover:text-cyan-400" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Completion Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: roadmap.steps.length * 0.05 + 0.2 }}
                    className="relative pl-14 pt-4"
                  >
                    <div className="absolute left-0 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-medium text-emerald-400">Career Ready: {roadmap.targetCareer}</h4>
                        </div>
                        <p className="text-xs text-[#A1A1AA] mt-1">Complete all modules to achieve your career goal</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-4 mt-6">
                {/* Your Strengths */}
                {roadmap.prerequisites.length > 0 && (
                  <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-emerald-400">Your Strengths</h3>
                          <p className="text-xs text-[#A1A1AA]">Skills you already have</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.prerequisites.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1.5" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Skills to Develop */}
                {roadmap.personalizedFor?.skillGaps && roadmap.personalizedFor.skillGaps.length > 0 && (
                  <Card className="bg-amber-500/5 border-amber-500/20 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-amber-400">Skills to Develop</h3>
                          <p className="text-xs text-[#A1A1AA]">Focus areas for your growth</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {roadmap.personalizedFor.skillGaps.map((skill, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#27272A]/50">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-medium">
                              {i + 1}
                            </div>
                            <span className="text-sm text-[#E4E4E7] flex-1">{skill}</span>
                            <ArrowRight className="w-4 h-4 text-[#A1A1AA]" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {roadmap.marketInsights?.certifications && roadmap.marketInsights.certifications.length > 0 && (
                  <Card className="bg-purple-500/5 border-purple-500/20 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Award className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-purple-400">Recommended Certifications</h3>
                          <p className="text-xs text-[#A1A1AA]">Industry-recognized credentials</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {roadmap.marketInsights.certifications.map((cert, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#27272A]/50">
                            <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="text-xs text-[#E4E4E7]">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Market Tab */}
              <TabsContent value="market" className="space-y-4 mt-6">
                {roadmap.marketInsights && (
                  <>
                    {/* Salary & Companies */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-[#27272A]/30 border-[#27272A] rounded-2xl">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#27272A] flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-[#E4E4E7]" />
                            </div>
                            <div>
                              <p className="text-xs text-[#A1A1AA]">Expected Salary Range</p>
                              <p className="text-lg font-semibold text-[#E4E4E7]">{roadmap.marketInsights.salaryRange}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#27272A]/30 border-[#27272A] rounded-2xl">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-[#A1A1AA]" />
                            <span className="text-sm font-medium text-[#E4E4E7]">Top Hiring Companies</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.marketInsights.topCompanies.slice(0, 6).map((company, i) => (
                              <Badge key={i} variant="outline" className="bg-[#27272A]/50 border-[#3F3F46] text-[#E4E4E7] text-xs">
                                {company}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Demand Trends */}
                    <Card className="bg-[#27272A]/30 border-[#27272A] rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[#27272A] flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#E4E4E7]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-[#E4E4E7]">Market Demand Trends</h3>
                            <p className="text-xs text-[#A1A1AA]">Current job market insights</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {roadmap.marketInsights.demandTrends.map((trend, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#27272A]/50">
                              <div className="w-5 h-5 rounded-full bg-[#3F3F46] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <TrendingUp className="w-3 h-3 text-[#A1A1AA]" />
                              </div>
                              <span className="text-sm text-[#E4E4E7]">{trend}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 2030 Outlook */}
                    <Card className="bg-[#27272A]/30 border-[#27272A] rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[#27272A] flex items-center justify-center">
                            <Globe className="w-5 h-5 text-[#E4E4E7]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-[#E4E4E7]">2030 Future Outlook</h3>
                            <p className="text-xs text-[#A1A1AA]">Long-term career projection</p>
                          </div>
                        </div>
                        <p className="text-sm text-[#E4E4E7] leading-relaxed">{roadmap.marketInsights.futureOutlook}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
              <Button
                onClick={navigateToRoadmap}
                size="lg"
                className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Learning Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => generateRoadmap(true)}
                className="border-[#27272A] bg-transparent text-[#E4E4E7] hover:bg-[#27272A]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isExistingRoadmap ? "Update Roadmap" : "Regenerate"}
              </Button>
            </div>

            {isExistingRoadmap && (
              <p className="text-center text-xs text-[#A1A1AA] mt-3">
                This is your saved roadmap. Click &quot;Update Roadmap&quot; to regenerate with latest market data.
              </p>
            )}

            {/* Citations */}
            {roadmap.citations && roadmap.citations.length > 0 && (
              <details className="mt-8">
                <summary className="text-xs text-[#A1A1AA] cursor-pointer hover:text-[#E4E4E7] transition-colors">
                  View Sources ({roadmap.citations.length})
                </summary>
                <ul className="mt-3 space-y-1 pl-4">
                  {roadmap.citations.slice(0, 5).map((citation, i) => (
                    <li key={i} className="text-xs text-[#A1A1AA] truncate">
                      <a href={citation} target="_blank" rel="noopener noreferrer" className="hover:text-[#E4E4E7]">
                        {citation}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
