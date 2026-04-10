"use client";
import { Briefcase, Loader2, RotateCw, Building2, ExternalLink, Trash2, MapPin, Calendar } from "lucide-react";
import React, { Fragment, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrackedJob {
  id: number;
  jobTitle: string | null;
  companyName: string | null;
  jobUrl: string;
  jobDescription: string | null;
  requirements: string | null;
  location: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const TrackedJobsList = () => {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await fetch('/api/tracked-jobs');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setJobs(data.data);
      } else {
        console.error('API returned error:', data.error || 'Unknown error');
        setIsError(true);
      }
    } catch (error) {
      console.error('Failed to fetch tracked jobs:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to remove this job from tracking?')) {
      return;
    }

    try {
      setDeletingId(jobId);
      const response = await fetch(`/api/tracked-jobs?id=${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove from local state
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return { bg: "#3B82F6", text: "#FFFFFF" };
      case 'interview':
        return { bg: "#F59E0B", text: "#FFFFFF" };
      case 'offer':
        return { bg: "#22C55E", text: "#FFFFFF" };
      case 'rejected':
        return { bg: "#EF4444", text: "#FFFFFF" };
      default:
        return { bg: "#6B7280", text: "#FFFFFF" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Fragment>
      {isLoading ? (
        <>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="rounded-2xl border h-80 animate-pulse" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <div className="p-6">
                <div className="h-48 rounded-xl mb-4" style={{ backgroundColor: "#27272A" }}></div>
                <div className="h-4 rounded mb-2" style={{ backgroundColor: "#27272A" }}></div>
                <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#27272A" }}></div>
              </div>
            </div>
          ))}
        </>
      ) : isError ? (
        <div className="rounded-2xl border h-80 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#27272A" }}>
            <RotateCw className="w-6 h-6" style={{ color: "#EF4444" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>Failed to load</h3>
          <p className="text-sm mb-4 text-center" style={{ color: "#A1A1AA" }}>There was an error loading your tracked jobs</p>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-90 font-medium"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            onClick={() => fetchJobs()}
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed h-80 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", borderStyle: "dashed" }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#27272A" }}>
            <Briefcase className="w-8 h-8" style={{ color: "#A1A1AA" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>No tracked jobs yet</h3>
          <p className="text-sm text-center mb-4" style={{ color: "#A1A1AA" }}>
            Start tracking jobs by clicking &quot;Add to Track&quot; on job application pages
          </p>
        </div>
      ) : (
        jobs.map((job) => {
          const statusColor = getStatusColor(job.status);
          return (
            <Card
              key={job.id}
              className="rounded-2xl border transition-all duration-200 hover:border-opacity-60"
              style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5" style={{ color: "#3B82F6" }} />
                      <h3 className="text-lg font-semibold" style={{ color: "#E4E4E7" }}>
                        {job.jobTitle || 'Untitled Position'}
                      </h3>
                    </div>
                    {job.companyName && (
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4" style={{ color: "#A1A1AA" }} />
                        <span className="text-sm" style={{ color: "#A1A1AA" }}>{job.companyName}</span>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" style={{ color: "#A1A1AA" }} />
                        <span className="text-sm" style={{ color: "#A1A1AA" }}>{job.location}</span>
                      </div>
                    )}
                  </div>
                  <Badge
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                    }}
                  >
                    {job.status || 'Applied'}
                  </Badge>
                </div>

                {job.jobDescription && (
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: "#A1A1AA" }}>
                    {job.jobDescription.substring(0, 150)}...
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#27272A" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#A1A1AA" }}>
                    <Calendar className="w-3 h-3" />
                    <span>Tracked {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(job.jobUrl, '_blank')}
                      className="rounded-lg"
                      style={{ color: "#3B82F6" }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingId === job.id}
                      className="rounded-lg"
                      style={{ color: "#EF4444" }}
                    >
                      {deletingId === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </Fragment>
  );
};

export default TrackedJobsList;

