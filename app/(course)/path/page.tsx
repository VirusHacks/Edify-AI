"use client"

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Sparkles, BookOpen, Clock, Star, ArrowRight, Target, Brain, TrendingUp, Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getAllPathways } from "./action";
import PageContainer from "@/components/layout/PageContainer";



type Path = {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  difficulty?: string;
  estimatedTime?: string;
}

export default function Home() {
  const [pathways, setPathways] = useState<Path[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPathways = async () => {
      try {
        const fetchedPathways = await getAllPathways();
        console.log(fetchedPathways);
        const customPathways = fetchedPathways.map((pathway: any) => ({
          id: pathway.slug,
          title: pathway.title,
          difficulty: pathway.difficulty,
          estimatedTime: pathway.estimatedTime,
          icon: "📚", // default icon
          color: "from-gray-500/20 to-gray-500/20",
        })) as Path[];
        setPathways([ ...customPathways]);
      } catch (error) {
        console.error("Error fetching pathways:", error);
      }
    };

    fetchPathways();  
  }, []);

  const filteredPaths = pathways.filter((path) =>
    path.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7]">
      {/* Mobile Back Button */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          className="rounded-xl transition-all duration-200 hover:opacity-90"
          style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
      
      {/* Banner Section */}
      <PageContainer className="py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#071033] via-[#0b1220] to-[#071033] p-4 sm:p-6 md:p-8 text-[#E4E4E7] border border-[#27272A]"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 md:mb-3">
                  Discover Your Learning Path
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mb-4 md:mb-6">
                  Choose from curated learning paths or create your own custom journey to achieve your career goals.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  <div className="flex items-center gap-2 bg-transparent rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-[#27272A]">
                    <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-[#3B82F6]" />
                    <span className="text-xs md:text-sm font-medium text-[#E4E4E7]">Personalized Learning</span>
                  </div>
                  <div className="flex items-center gap-2 bg-transparent rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-[#27272A]">
                    <Star className="w-3 h-3 md:w-4 md:h-4 text-[#3B82F6]" />
                    <span className="text-xs md:text-sm font-medium text-[#E4E4E7]">Expert Curated</span>
                  </div>
                  <div className="flex items-center gap-2 bg-transparent rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-[#27272A]">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-[#3B82F6]" />
                    <span className="text-xs md:text-sm font-medium text-[#E4E4E7]">Goal-Oriented</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block ml-8">
                <div className="w-24 h-24 rounded-xl bg-transparent border border-[#27272A] flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-[#3B82F6]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </PageContainer>

      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >

          {/* Search Section */}
          <div className="relative max-w-2xl mx-auto px-4 sm:px-0">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-[#A1A1AA]" />
              <Input
                placeholder="Search by learning path name..."
                className="pl-10 md:pl-12 pr-4 py-3 md:py-5 text-base md:text-lg bg-transparent border-2 border-[#27272A] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-xl md:rounded-2xl shadow-sm transition-all duration-200 w-full h-11 md:h-12 text-[#E4E4E7] placeholder-[#A1A1AA]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-[#A1A1AA] text-center">
                {filteredPaths.length} path{filteredPaths.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {/* Paths Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
            {/* AI-Powered Personalized Roadmap Card - Featured */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Link href="/path/personalized">
                <Card className="h-full border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 group cursor-pointer bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-cyan-900/20 rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl" />
                  <CardContent className="flex flex-col items-center justify-center p-8 h-full relative z-10">
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Powered
                      </Badge>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300"
                    >
                      <Brain className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#E4E4E7] mb-2 group-hover:text-purple-300 transition-colors text-center">
                      Market-Aware Roadmap
                    </h3>
                    <p className="text-[#A1A1AA] text-center text-sm mb-4">
                      Get a personalized path based on your profile & real-time job market trends for 2025-2030
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center text-xs text-purple-300">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Market Data
                      </span>
                      <span className="inline-flex items-center text-xs text-cyan-300">
                        <Rocket className="w-3 h-3 mr-1" />
                        Personalized
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Discover Your Path Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Link href="/path/discover">
                <Card className="h-full border-2 border-[#27272A] hover:border-cyan-500/60 transition-all duration-300 group cursor-pointer bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-purple-900/20 rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />
                  <CardContent className="flex flex-col items-center justify-center p-8 h-full relative z-10">
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300"
                    >
                      <Target className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#E4E4E7] mb-2 group-hover:text-cyan-300 transition-colors text-center">
                      Discover Your Path
                    </h3>
                    <p className="text-[#A1A1AA] text-center text-sm mb-4">
                      Swipe through cards to find your perfect tech career pathway
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center text-xs text-cyan-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Powered
                      </span>
                      <span className="inline-flex items-center text-xs text-blue-300">
                        <Clock className="w-3 h-3 mr-1" />
                        30 seconds
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Create Custom Path Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/path/create">
                <Card className="h-full border-2 border-dashed border-[#27272A] hover:border-[#3B82F6] transition-all duration-300 group cursor-pointer bg-transparent rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center p-8 h-full">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] flex items-center justify-center mb-4 group-hover:shadow-lg transition-all duration-300"
                    >
                      <Plus className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-[#E4E4E7] mb-2 group-hover:text-[#3B82F6] transition-colors">
                      Create Custom Path
                    </h3>
                    <p className="text-[#A1A1AA] text-center">
                      Build your personalized learning journey
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            {/* Learning Path Cards */}
            {filteredPaths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Link href={`/path/path/${path.id}`}>
                  <Card className="h-full bg-transparent rounded-2xl border border-[#27272A] shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] flex items-center justify-center text-2xl">
                          {path.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-[#E4E4E7] group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                            {path.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {path.difficulty && (
                          <Badge variant="secondary" className="bg-transparent text-[#3B82F6] border border-[#27272A]">
                            {path.difficulty}
                          </Badge>
                        )}
                        {path.estimatedTime && (
                          <Badge variant="outline" className="border-[#27272A] text-[#A1A1AA]">
                            <Clock className="w-3 h-3 mr-1 text-[#A1A1AA]" />
                            {path.estimatedTime}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[#A1A1AA] text-sm">
                          <BookOpen className="w-4 h-4 mr-1 text-[#A1A1AA]" />
                          <span>Learning Path</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPaths.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-transparent border border-[#27272A] flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#A1A1AA]" />
              </div>
              <h3 className="text-lg font-semibold text-[#E4E4E7] mb-2">No paths found</h3>
              <p className="text-[#A1A1AA]">Try adjusting your search terms</p>
            </div>
          )}
        </motion.div>
      </PageContainer>
    </main>
  );
}
