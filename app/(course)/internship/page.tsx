'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ExternalLink, DollarSign, Clock, Bookmark, X, Briefcase, Search, Filter, Sparkles, Users, Building2, TrendingUp, Tag, Award, Home } from 'lucide-react';
import Image from 'next/image';
import PageContainer from '@/components/layout/PageContainer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations, hasProfileData, getAIRecommendations } from "@/lib/recommendations";
import { toast } from "sonner";

interface Internship {
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  posted_time: string;
  link: string;
  description?: string;
  skills?: string[];
  logoUrl?: string;
  activelyHiring?: boolean;
  jobOffer?: string;
  workType?: string;
  isPartTime?: boolean;
}

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'posted_time' | 'stipend'>('posted_time');
  const [savedInternships, setSavedInternships] = useState<string[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [showRecommended, setShowRecommended] = useState(false);
  
  // Fetch user profile for recommendations
  const trpc = useTRPC();
  const { data: userProfile } = useQuery({
    ...trpc.user.getOne.queryOptions(),
    retry: false, // Don't retry if not authenticated
    enabled: true, // Always try to fetch, but won't error if not authenticated
  });

  useEffect(() => {
    fetchInternships();
  }, []);

  useEffect(() => {
    const filterData = async () => {
      await filterAndSortInternships();
    };
    filterData();
  }, [internships, searchTerm, locationFilter, sortBy, showRecommended, userProfile]);

  const fetchInternships = async () => {
    try {
      const response = await fetch('/api/internship');
      let data = await response.json();
        // remove first 10 element
        data = data.slice(10)
      setInternships(data);
    } catch (error) {
      console.error('Error fetching internships:', error);
    }
  };

  const filterAndSortInternships = async () => {
    let filtered = internships.filter((internship) =>
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (locationFilter !== 'all') {
      filtered = filtered.filter((internship) => internship.location === locationFilter);
    }

    // Apply AI-enhanced recommendation filter if enabled
    if (showRecommended && userProfile) {
      if (!hasProfileData(userProfile)) {
        toast.info("Complete your profile to see personalized recommendations");
        setShowRecommended(false);
      } else {
        // Use AI-powered recommendations
        filtered = await getAIRecommendations(filtered, userProfile, "internship", 50);
      }
    }

    filtered.sort((a, b) => {
      if (sortBy === 'posted_time') {
        return new Date(b.posted_time).getTime() - new Date(a.posted_time).getTime();
      } 
        const stipendA = Number.parseInt(a.stipend.replace(/[^\d]/g, ''));
        const stipendB = Number.parseInt(b.stipend.replace(/[^\d]/g, ''));
        return stipendB - stipendA;
      
    });

    setFilteredInternships(filtered);
  };

  const toggleSaveInternship = (title: string) => {
    setSavedInternships((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const locations = Array.from(new Set(internships.map((internship) => internship.location)));

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Banner Section */}
      <PageContainer className="py-6 md:py-12 max-w-screen-xl">
        <div className="relative overflow-hidden rounded-2xl border p-6 md:p-8" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block p-3 rounded-xl mb-4" style={{ backgroundColor: "#27272A" }}>
                  <Briefcase className="w-5 h-5" style={{ color: "#3B82F6" }} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: "#E4E4E7" }}>
                  Internship Opportunities
                </h1>
                <p className="text-base md:text-lg max-w-3xl mb-6" style={{ color: "#A1A1AA" }}>
                  Find your next career opportunity and gain valuable experience with top companies.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <Building2 className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Top Companies</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <TrendingUp className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Career Growth</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <Sparkles className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Real Experience</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block ml-6">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                  <Briefcase className="w-10 h-10" style={{ color: "#3B82F6" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      <PageContainer className="max-w-screen-xl">
        <div className="space-y-8 md:space-y-12">

          {/* Search & Filters */}
          <Card className="rounded-2xl border shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
                  <Search className="w-4 h-4 text-white" />
                </div>
                Search & Filter Internships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: "#A1A1AA" }} />
                <Input
                  placeholder="Search internships by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 text-base rounded-xl w-full h-12"
                  style={{
                    backgroundColor: "#27272A",
                    borderColor: "#27272A",
                    color: "#E4E4E7"
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors"
                    style={{ color: "#A1A1AA" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#E4E4E7"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#A1A1AA"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-semibold mb-2 block" style={{ color: "#E4E4E7" }}>Location</label>
                  <Select value={locationFilter} onValueChange={(value) => setLocationFilter(value)}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                      <SelectItem value="all" style={{ color: "#E4E4E7" }}>All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location} style={{ color: "#E4E4E7" }}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold mb-2 block" style={{ color: "#E4E4E7" }}>Sort By</label>
                  <Select value={sortBy} onValueChange={(value: 'posted_time' | 'stipend') => setSortBy(value)}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}>
                      <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                      <SelectItem value="posted_time" style={{ color: "#E4E4E7" }}>Most Recent</SelectItem>
                      <SelectItem value="stipend" style={{ color: "#E4E4E7" }}>Highest Stipend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Show Recommended Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    if (!userProfile) {
                      toast.info("Please sign in to see personalized recommendations");
                      return;
                    }
                    if (!hasProfileData(userProfile)) {
                      toast.info("Complete your profile to see personalized recommendations");
                      return;
                    }
                    setShowRecommended(!showRecommended);
                  }}
                  variant={showRecommended ? "default" : "outline"}
                  className="rounded-xl px-6 py-6 text-base font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: showRecommended ? "#3B82F6" : "transparent",
                    borderColor: showRecommended ? "#3B82F6" : "#27272A",
                    color: "#FFFFFF"
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {showRecommended ? 'Show All' : 'Show Recommended'}
                </Button>
              </div>
              
              {(searchTerm || showRecommended) && (
                <div className="text-sm text-center" style={{ color: "#A1A1AA" }}>
                  {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''} found
                  {showRecommended && " for you"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internships List */}
          <AnimatePresence>
            <motion.div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#E4E4E7" }}>Available Internships</h2>
                <p style={{ color: "#A1A1AA" }}>Discover opportunities to gain real-world experience</p>
              </div>
              
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                layout
              >
                {filteredInternships.map((internship) => (
                  <motion.div
                    key={internship.title}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col overflow-hidden" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                      {/* Company Logo/Image Section */}
                      {internship.logoUrl && (
                        <div className="relative w-full h-32" style={{ backgroundColor: "#27272A" }}>
                          <Image
                            src={internship.logoUrl}
                            alt={internship.company}
                            fill
                            className="object-contain p-4 opacity-90"
                            unoptimized
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            {internship.activelyHiring && (
                              <Badge className="text-white px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: "#10B981" }}>
                                Actively hiring
                              </Badge>
                            )}
                            {internship.isPartTime && (
                              <Badge variant="secondary" className="px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: "#27272A", color: "#3B82F6" }}>
                                Part time
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          {!internship.logoUrl && (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#3B82F6" }}>
                              <Briefcase className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex items-start gap-2 flex-1">
                            {!internship.logoUrl && (
                              <>
                                {internship.activelyHiring && (
                                  <Badge className="text-white px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: "#10B981" }}>
                                    Actively hiring
                                  </Badge>
                                )}
                                {internship.isPartTime && (
                                  <Badge variant="secondary" className="px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: "#27272A", color: "#3B82F6" }}>
                                    Part time
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSaveInternship(internship.title)}
                            className="shrink-0 rounded-lg transition-colors"
                            style={{ color: "#A1A1AA" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#27272A"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${
                                savedInternships.includes(internship.title) 
                                  ? "fill-current" 
                                  : ""
                              }`}
                              style={{
                                color: savedInternships.includes(internship.title) ? "#3B82F6" : "#A1A1AA"
                              }}
                            />
                          </Button>
                        </div>
                        <CardTitle className="text-lg font-semibold line-clamp-2 transition-colors mb-2" style={{ color: "#E4E4E7" }}>
                          {internship.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-medium" style={{ color: "#A1A1AA" }}>{internship.company}</p>
                          {internship.workType && (
                            <Badge variant="outline" className="text-xs rounded-lg" style={{ borderColor: "#27272A", color: "#A1A1AA" }}>
                              {internship.workType}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Job Offer Badge */}
                        {internship.jobOffer && (
                          <Badge className="px-3 py-1 mb-3 text-xs font-semibold rounded-lg" style={{ backgroundColor: "#27272A", color: "#F59E0B" }}>
                            <Award className="w-3 h-3 mr-1" />
                            {internship.jobOffer}
                          </Badge>
                        )}
                      </CardHeader>
                      
                      <CardContent className="flex-grow flex flex-col justify-between p-6 pt-0">
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-3">
                            {internship.location.includes('Work from home') ? (
                              <Home className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                            ) : (
                              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{internship.location}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                            <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{internship.duration}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 shrink-0" style={{ color: "#F59E0B" }} />
                            <span className="text-sm font-semibold" style={{ color: "#F59E0B" }}>{internship.stipend}</span>
                          </div>
                          
                          {/* Skills */}
                          {internship.skills && internship.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {internship.skills.slice(0, 4).map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs px-2 py-1 rounded-lg"
                                  style={{ backgroundColor: "#27272A", color: "#3B82F6" }}
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {skill}
                                </Badge>
                              ))}
                              {internship.skills.length > 4 && (
                                <Badge variant="secondary" className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "#27272A", color: "#A1A1AA" }}>
                                  +{internship.skills.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 pt-2">
                            <Calendar className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                            <span className="text-xs" style={{ color: "#A1A1AA" }}>Posted {internship.posted_time}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="flex-1 h-12 rounded-xl font-semibold transition-all duration-200 hover:opacity-90" 
                                style={{
                                  borderColor: "#27272A",
                                  backgroundColor: "#27272A",
                                  color: "#E4E4E7"
                                }}
                                onClick={() => setSelectedInternship(internship)}
                              >
                                Quick View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                              <DialogHeader>
                                <DialogTitle className="text-2xl" style={{ color: "#E4E4E7" }}>{selectedInternship?.title}</DialogTitle>
                                <DialogDescription className="text-lg flex items-center gap-2" style={{ color: "#A1A1AA" }}>
                                  {selectedInternship?.company}
                                  {selectedInternship?.activelyHiring && (
                                    <Badge className="text-white text-xs rounded-lg" style={{ backgroundColor: "#10B981" }}>Actively hiring</Badge>
                                  )}
                                  {selectedInternship?.workType && (
                                    <Badge variant="outline" className="text-xs rounded-lg" style={{ borderColor: "#27272A", color: "#A1A1AA" }}>{selectedInternship.workType}</Badge>
                                  )}
                                  {selectedInternship?.isPartTime && (
                                    <Badge variant="secondary" className="text-xs rounded-lg" style={{ backgroundColor: "#27272A", color: "#3B82F6" }}>Part time</Badge>
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-6 space-y-4">
                                {selectedInternship?.jobOffer && (
                                  <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                                    <Award className="w-5 h-5" style={{ color: "#F59E0B" }} />
                                    <span className="font-semibold" style={{ color: "#F59E0B" }}>{selectedInternship.jobOffer}</span>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    {selectedInternship?.location?.includes('Work from home') ? (
                                      <Home className="w-5 h-5" style={{ color: "#A1A1AA" }} />
                                    ) : (
                                      <MapPin className="w-5 h-5" style={{ color: "#A1A1AA" }} />
                                    )}
                                    <span className="font-medium" style={{ color: "#E4E4E7" }}>{selectedInternship?.location}</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    <Clock className="w-5 h-5" style={{ color: "#A1A1AA" }} />
                                    <span className="font-medium" style={{ color: "#E4E4E7" }}>{selectedInternship?.duration}</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    <DollarSign className="w-5 h-5" style={{ color: "#F59E0B" }} />
                                    <span className="font-semibold text-lg" style={{ color: "#F59E0B" }}>{selectedInternship?.stipend}</span>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    <Calendar className="w-5 h-5" style={{ color: "#A1A1AA" }} />
                                    <span className="text-sm" style={{ color: "#A1A1AA" }}>Posted {selectedInternship?.posted_time}</span>
                                  </div>
                                </div>
                                
                                {selectedInternship?.description && (
                                  <div className="p-4 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    <h4 className="font-semibold mb-2" style={{ color: "#E4E4E7" }}>Description</h4>
                                    <p className="text-sm whitespace-pre-line line-clamp-6" style={{ color: "#A1A1AA" }}>
                                      {selectedInternship.description}
                                    </p>
                                  </div>
                                )}
                                
                                {selectedInternship?.skills && selectedInternship.skills.length > 0 && (
                                  <div className="p-4 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                                      <Tag className="w-4 h-4" />
                                      Required Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedInternship.skills.map((skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="rounded-lg"
                                          style={{ backgroundColor: "#0A0A0A", color: "#3B82F6", borderColor: "#27272A" }}
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button 
                                asChild 
                                className="w-full mt-6 h-12 text-white rounded-xl font-semibold transition-all duration-200 hover:opacity-90"
                                style={{ backgroundColor: "#3B82F6" }}
                              >
                                <a href={selectedInternship?.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Apply Now
                                </a>
                              </Button>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            asChild 
                            className="flex-1 h-12 text-white rounded-xl font-semibold transition-all duration-200 hover:opacity-90"
                            style={{ backgroundColor: "#3B82F6" }}
                          >
                            <a href={internship.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Apply
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Empty State */}
          {filteredInternships.length === 0 && !searchTerm && (
            <Card className="rounded-2xl border shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                  <Briefcase className="w-10 h-10" style={{ color: "#A1A1AA" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "#E4E4E7" }}>No internships found</h3>
                <p className="mb-6" style={{ color: "#A1A1AA" }}>Try adjusting your search terms or filters to find more opportunities</p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('all');
                    setSortBy('posted_time');
                  }}
                  className="rounded-xl transition-all duration-200 hover:opacity-90 font-medium"
                  style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </main>
  );
}