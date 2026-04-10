"use client";
import { Sparkles, Loader2, RotateCw, Briefcase, Building2, TrendingUp, FileText } from "lucide-react";
import React, { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ATSAnalysis {
  analysisId: string;
  jobTitle: string | null;
  companyName: string | null;
  overallScore: number;
  atsMatchPercentage: number;
  createdAt: string;
}

const ATSReportsList = () => {
  const [analyses, setAnalyses] = useState<ATSAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await fetch('/api/resume-analysis');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setAnalyses(data.data);
      } else {
        // Handle case where API returns success: false
        console.error('API returned error:', data.error || 'Unknown error');
        setIsError(true);
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 75) return { bg: "#10B981", text: "#FFFFFF", border: "#10B981" };
    if (score >= 50) return { bg: "#F59E0B", text: "#FFFFFF", border: "#F59E0B" };
    return { bg: "#EF4444", text: "#FFFFFF", border: "#EF4444" };
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 75) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
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
          <p className="text-sm mb-4 text-center" style={{ color: "#A1A1AA" }}>There was an error loading your ATS reports</p>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-90 font-medium"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            onClick={() => fetchAnalyses()}
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : analyses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed h-80 flex flex-col items-center justify-center p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", borderStyle: "dashed" }}>
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#27272A" }}>
            <FileText className="w-8 h-8" style={{ color: "#A1A1AA" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>No ATS reports yet</h3>
          <p className="text-sm text-center" style={{ color: "#A1A1AA" }}>Create your first ATS analysis to get started</p>
        </div>
      ) : (
        <>
          {analyses.map((analysis) => {
            const scoreColors = getScoreColor(analysis.overallScore);
            const scoreTextColor = getScoreTextColor(analysis.overallScore);
            return (
              <Link key={analysis.analysisId} href={`/ats?analysisId=${analysis.analysisId}`}>
                <Card className="h-80 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Header with Job Info */}
                    <div className="mb-4">
                      {analysis.jobTitle && (
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4" style={{ color: "#A1A1AA" }} />
                          <span className="font-semibold text-sm truncate" style={{ color: "#E4E4E7" }}>{analysis.jobTitle}</span>
                        </div>
                      )}
                      {analysis.companyName && (
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4" style={{ color: "#A1A1AA" }} />
                          <span className="text-sm truncate" style={{ color: "#A1A1AA" }}>{analysis.companyName}</span>
                        </div>
                      )}
                      {!analysis.jobTitle && !analysis.companyName && (
                        <div className="h-8 mb-3"></div>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="flex-1 flex flex-col justify-center gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xs mb-1" style={{ color: "#A1A1AA" }}>Overall Score</div>
                        <div className="text-4xl font-bold mb-2" style={{ color: scoreTextColor }}>
                          {analysis.overallScore}
                        </div>
                        <Badge 
                          className="rounded-lg px-2 py-0.5"
                          style={{ 
                            backgroundColor: scoreColors.bg, 
                            color: scoreColors.text,
                            borderColor: scoreColors.border
                          }}
                        >
                          /100
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-1" style={{ color: "#A1A1AA" }}>ATS Match</div>
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-5 h-5" style={{ color: "#3B82F6" }} />
                          <span className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{analysis.atsMatchPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-4 mt-auto" style={{ borderColor: "#27272A" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#A1A1AA" }}>
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs group-hover:underline" style={{ color: "#3B82F6" }}>
                          View Report →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </>
      )}
    </Fragment>
  );
};

export default ATSReportsList;

