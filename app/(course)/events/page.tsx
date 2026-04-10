'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ExternalLink, Loader, Search, Filter, Sparkles, Users, Trophy, DollarSign, Clock, Building2, Star } from 'lucide-react';
import Image from 'next/image';
import PageContainer from '@/components/layout/PageContainer';
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations, hasProfileData, getAIRecommendations } from "@/lib/recommendations";
import { toast } from "sonner";

interface Event {
  title: string;
  location: string;
  date: string;
  submissionPeriod?: string;
  status?: string;
  link: string;
  imageUrl?: string;
  prizeAmount?: string;
  participants?: string;
  host?: string;
  organizer?: string;
  attendees?: string;
  rating?: string;
  type: 'hackathon' | 'meetup';
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventType, setEventType] = useState<'all' | 'hackathon' | 'meetup'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  
  // Fetch user profile for recommendations
  const trpc = useTRPC();
  const { data: userProfile } = useQuery({
    ...trpc.user.getOne.queryOptions(),
    retry: false,
    enabled: true,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError('Error loading events. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (eventType !== 'all') {
      filtered = filtered.filter(event => event.type === eventType);
    }
    
    // Apply recommendation filter if enabled (using basic recommendations for performance in useMemo)
    if (showRecommended && userProfile) {
      if (!hasProfileData(userProfile)) {
        toast.info("Complete your profile to see personalized recommendations");
      } else {
        filtered = getRecommendations(filtered, userProfile, 50);
      }
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        // Try to parse dates, but handle cases where date might be in a different format
        const dateA = a.submissionPeriod || a.date;
        const dateB = b.submissionPeriod || b.date;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        // If dates are invalid, put them at the end
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeA - timeB;
      }
      return a.title.localeCompare(b.title);
    });
  }, [events, searchTerm, eventType, sortBy, showRecommended, userProfile]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Banner Section */}
      <PageContainer className="py-6 md:py-12 max-w-screen-xl">
        <div className="relative overflow-hidden rounded-2xl border p-6 md:p-8" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block p-3 rounded-xl mb-4" style={{ backgroundColor: "#27272A" }}>
                  <Calendar className="w-5 h-5" style={{ color: "#3B82F6" }} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: "#E4E4E7" }}>
                  Events & Opportunities
                </h1>
                <p className="text-base md:text-lg max-w-3xl mb-6" style={{ color: "#A1A1AA" }}>
                  Discover hackathons, meetups, and learning opportunities to advance your career and expand your network.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <Trophy className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Hackathons</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <Users className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Meetups</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#27272A" }}>
                    <Sparkles className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Learning Events</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block ml-6">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                  <Calendar className="w-10 h-10" style={{ color: "#3B82F6" }} />
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
                Search & Filter Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: "#A1A1AA" }} />
                <Input 
                  placeholder="Search events by name, location, or type..." 
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
                  <label className="text-sm font-semibold mb-2 block" style={{ color: "#E4E4E7" }}>Event Type</label>
                  <Select value={eventType} onValueChange={(value: 'all' | 'hackathon' | 'meetup') => setEventType(value)}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}>
                      <SelectValue placeholder="All Event Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                      <SelectItem value="all" style={{ color: "#E4E4E7" }}>All Events</SelectItem>
                      <SelectItem value="hackathon" style={{ color: "#E4E4E7" }}>Hackathons</SelectItem>
                      <SelectItem value="meetup" style={{ color: "#E4E4E7" }}>Meetups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold mb-2 block" style={{ color: "#E4E4E7" }}>Sort By</label>
                  <Select value={sortBy} onValueChange={(value: 'date' | 'title') => setSortBy(value)}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}>
                      <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                      <SelectItem value="date" style={{ color: "#E4E4E7" }}>Date (Earliest First)</SelectItem>
                      <SelectItem value="title" style={{ color: "#E4E4E7" }}>Title (A-Z)</SelectItem>
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
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  {showRecommended && " for you"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Loading Events</h3>
                  <p style={{ color: "#A1A1AA" }}>Fetching the latest events and opportunities...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                  <Calendar className="w-8 h-8" style={{ color: "#EF4444" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Error Loading Events</h3>
                <p style={{ color: "#A1A1AA" }}>{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Events List */}
          <AnimatePresence>
            {!loading && !error && (
              <motion.div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#E4E4E7" }}>Available Events</h2>
                  <p style={{ color: "#A1A1AA" }}>Discover opportunities to learn, network, and grow</p>
                </div>
                
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                  {filteredEvents.map(event => (
                    <motion.div 
                      key={event.title} 
                      layout 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -20 }} 
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                        {/* Image Section */}
                        {event.imageUrl && (
                          <div className="relative w-full h-48" style={{ backgroundColor: "#27272A" }}>
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              fill
                              className="object-cover opacity-90"
                              unoptimized
                            />
                            <div className="absolute top-4 right-4">
                              <Badge 
                                className="px-3 py-1 rounded-lg"
                                style={{
                                  backgroundColor: event.type === 'hackathon' ? "#3B82F6" : "#9333EA",
                                  color: "#FFFFFF"
                                }}
                              >
                                {event.type}
                              </Badge>
                            </div>
                            {/* Status badges for both hackathons and meetups */}
                            {event.status && (
                              <div className="absolute top-4 left-4">
                                <Badge className="px-3 py-1 rounded-lg text-white" style={{
                                  backgroundColor: event.status.toLowerCase().includes('sold out') || 
                                    event.status.toLowerCase().includes('waiting list')
                                    ? "#F59E0B"
                                    : event.type === 'hackathon'
                                    ? "#10B981"
                                    : "#3B82F6"
                                }}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {event.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <CardHeader className="p-6">
                          {!event.imageUrl && (
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#3B82F6" }}>
                                {event.type === 'hackathon' ? (
                                  <Trophy className="w-6 h-6 text-white" />
                                ) : (
                                  <Users className="w-6 h-6 text-white" />
                                )}
                              </div>
                              <Badge 
                                className="shrink-0 px-3 py-1 rounded-lg"
                                style={{
                                  backgroundColor: event.type === 'hackathon' ? "#3B82F6" : "#9333EA",
                                  color: "#FFFFFF"
                                }}
                              >
                                {event.type}
                              </Badge>
                            </div>
                          )}
                          <CardTitle className="text-lg font-semibold line-clamp-2 transition-colors" style={{ color: "#E4E4E7" }}>
                            {event.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                          <div className="space-y-3">
                            {/* Submission Period / Date */}
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                              <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>
                                {event.submissionPeriod || (event.date !== 'Invalid Date' && event.date !== 'N/A' ? event.date : 'Date TBA')}
                              </span>
                            </div>
                            
                            {/* Location */}
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#A1A1AA" }} />
                              <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{event.location}</span>
                            </div>

                            {/* Hackathon-specific details */}
                            {event.type === 'hackathon' && (
                              <>
                                {/* Prize Amount */}
                                {event.prizeAmount && event.prizeAmount !== 'N/A' && (
                                  <div className="flex items-center gap-3">
                                    <DollarSign className="w-4 h-4 shrink-0" style={{ color: "#F59E0B" }} />
                                    <span className="text-sm font-medium" style={{ color: "#F59E0B" }}>{event.prizeAmount}</span>
                                  </div>
                                )}

                                {/* Participants */}
                                {event.participants && event.participants !== '0' && (
                                  <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 shrink-0" style={{ color: "#3B82F6" }} />
                                    <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{event.participants} participants</span>
                                  </div>
                                )}

                                {/* Host */}
                                {event.host && event.host !== 'N/A' && (
                                  <div className="flex items-center gap-3">
                                    <Building2 className="w-4 h-4 shrink-0" style={{ color: "#9333EA" }} />
                                    <span className="text-sm font-medium line-clamp-1" style={{ color: "#A1A1AA" }}>{event.host}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Meetup-specific details */}
                            {event.type === 'meetup' && (
                              <>
                                {/* Organizer */}
                                {event.organizer && event.organizer !== 'N/A' && (
                                  <div className="flex items-center gap-3">
                                    <Building2 className="w-4 h-4 shrink-0" style={{ color: "#9333EA" }} />
                                    <span className="text-sm font-medium line-clamp-1" style={{ color: "#A1A1AA" }}>{event.organizer}</span>
                                  </div>
                                )}

                                {/* Attendees */}
                                {event.attendees && event.attendees !== '0' && (
                                  <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 shrink-0" style={{ color: "#3B82F6" }} />
                                    <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{event.attendees}</span>
                                  </div>
                                )}

                                {/* Rating */}
                                {event.rating && event.rating !== 'N/A' && (
                                  <div className="flex items-center gap-3">
                                    <Star className="w-4 h-4 shrink-0 fill-amber-500" style={{ color: "#F59E0B" }} />
                                    <span className="text-sm font-medium" style={{ color: "#F59E0B" }}>{event.rating}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          <Button 
                            asChild 
                            className="w-full h-12 text-white rounded-xl font-semibold transition-all duration-200 hover:opacity-90"
                            style={{ backgroundColor: "#3B82F6" }}
                          >
                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Learn More
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!loading && !error && filteredEvents.length === 0 && (
            <Card className="rounded-2xl border shadow-sm" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                  <Calendar className="w-10 h-10" style={{ color: "#A1A1AA" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "#E4E4E7" }}>No events found</h3>
                <p className="mb-6" style={{ color: "#A1A1AA" }}>Try adjusting your search terms or filters to find more events</p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setEventType('all');
                    setSortBy('date');
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
