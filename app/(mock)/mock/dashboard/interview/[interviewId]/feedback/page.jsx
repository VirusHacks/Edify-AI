"use client";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDownIcon, ArrowLeft, Star, TrendingUp, Target, Eye, Brain, Smile, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


function Feedback({ params }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [avgRating, setAvgRating] = useState()
  const [avgBodyLanguage, setAvgBodyLanguage] = useState(null)
  const router = useRouter()
  useEffect(() => {
    GetFeedBack();
  }, []);
  const GetFeedBack = async () => {
    try {
      const response = await fetch(`/api/mock-interview/${params.interviewId}/feedback`);
      const result = await response.json();

      if (result.success && result.data) {
        setFeedbackList(result.data);
        let getTotalOfRating = result.data.reduce((sum, item) => sum + Number(item.rating), 0)
        setAvgRating(Math.round(getTotalOfRating / result.data?.length))

        // Calculate average body language metrics
        const bodyMetrics = result.data.filter(item => item.engagementScore != null);
        if (bodyMetrics.length > 0) {
          const avgEyeContact = Math.round(bodyMetrics.reduce((sum, item) => sum + (item.eyeContactScore || 0), 0) / bodyMetrics.length);
          const avgEngagement = Math.round(bodyMetrics.reduce((sum, item) => sum + (item.engagementScore || 0), 0) / bodyMetrics.length);
          const avgConfidence = Math.round(bodyMetrics.reduce((sum, item) => sum + (item.confidenceScore || 0), 0) / bodyMetrics.length);

          // Find most common dominant expression
          const expressions = bodyMetrics.map(item => item.dominantExpression).filter(Boolean);
          const expressionCounts = expressions.reduce((acc, exp) => {
            acc[exp] = (acc[exp] || 0) + 1;
            return acc;
          }, {});
          const dominantExpression = Object.entries(expressionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

          setAvgBodyLanguage({
            eyeContact: avgEyeContact,
            engagement: avgEngagement,
            confidence: avgConfidence,
            dominantExpression,
          });
        }
      } else {
        console.error("Failed to fetch feedback:", result.error);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-8 md:py-12 space-y-8 max-w-screen-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="rounded-xl transition-all duration-200 hover:opacity-90 w-fit"
              style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#E4E4E7" }}>Interview Feedback</h1>
              <p className="mt-1 text-sm md:text-base" style={{ color: "#A1A1AA" }}>Review your performance and improve for next time</p>
            </div>
          </div>
        </div>

        {feedbackList?.length === 0 ? (
          <Card className="text-center py-16 px-6 rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                <Target className="w-8 h-8" style={{ color: "#A1A1AA" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "#E4E4E7" }}>No Interview Feedback Found</h3>
              <p style={{ color: "#A1A1AA" }}>Complete an interview to see your feedback here</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall Performance */}
            <Card className="rounded-2xl border-0" style={{ backgroundColor: "#27272A" }}>
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: "#E4E4E7" }}>Congratulations!</h2>
                    <p className="text-xl mb-4" style={{ color: "#A1A1AA" }}>Here&apos;s your interview performance analysis</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5" style={{ color: "#FBBF24" }} />
                        <span className="text-lg font-semibold" style={{ color: "#E4E4E7" }}>Overall Rating</span>
                      </div>
                      <Badge
                        className="text-lg px-4 py-2 rounded-lg"
                        style={{
                          backgroundColor: avgRating < 6 ? "#EF4444" : "#22C55E",
                          color: "#FFFFFF"
                        }}
                      >
                        {avgRating}/10
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-bold" style={{ color: "#27272A" }}>
                      {avgRating < 6 ? '📈' : '🎉'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Body Language Analysis */}
            {avgBodyLanguage && (
              <Card className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                    <Activity className="w-5 h-5" style={{ color: "#3B82F6" }} />
                    Body Language Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Eye Contact */}
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#27272A" }}>
                      <Eye className="w-6 h-6 mx-auto mb-2" style={{ color: avgBodyLanguage.eyeContact >= 60 ? "#22C55E" : "#EF4444" }} />
                      <p className="text-2xl font-bold" style={{ color: "#E4E4E7" }}>{avgBodyLanguage.eyeContact}%</p>
                      <p className="text-xs" style={{ color: "#A1A1AA" }}>Eye Contact</p>
                      <p className="text-xs mt-1" style={{ color: avgBodyLanguage.eyeContact >= 60 ? "#22C55E" : "#FBBF24" }}>
                        {avgBodyLanguage.eyeContact >= 70 ? "Excellent" : avgBodyLanguage.eyeContact >= 50 ? "Good" : "Needs Work"}
                      </p>
                    </div>

                    {/* Engagement */}
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#27272A" }}>
                      <Brain className="w-6 h-6 mx-auto mb-2" style={{ color: avgBodyLanguage.engagement >= 60 ? "#22C55E" : "#EF4444" }} />
                      <p className="text-2xl font-bold" style={{ color: "#E4E4E7" }}>{avgBodyLanguage.engagement}%</p>
                      <p className="text-xs" style={{ color: "#A1A1AA" }}>Engagement</p>
                      <p className="text-xs mt-1" style={{ color: avgBodyLanguage.engagement >= 60 ? "#22C55E" : "#FBBF24" }}>
                        {avgBodyLanguage.engagement >= 70 ? "Excellent" : avgBodyLanguage.engagement >= 50 ? "Good" : "Needs Work"}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#27272A" }}>
                      <Target className="w-6 h-6 mx-auto mb-2" style={{ color: avgBodyLanguage.confidence >= 60 ? "#22C55E" : "#EF4444" }} />
                      <p className="text-2xl font-bold" style={{ color: "#E4E4E7" }}>{avgBodyLanguage.confidence}%</p>
                      <p className="text-xs" style={{ color: "#A1A1AA" }}>Confidence</p>
                      <p className="text-xs mt-1" style={{ color: avgBodyLanguage.confidence >= 60 ? "#22C55E" : "#FBBF24" }}>
                        {avgBodyLanguage.confidence >= 70 ? "Excellent" : avgBodyLanguage.confidence >= 50 ? "Good" : "Needs Work"}
                      </p>
                    </div>

                    {/* Dominant Expression */}
                    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#27272A" }}>
                      <Smile className="w-6 h-6 mx-auto mb-2" style={{ color: "#3B82F6" }} />
                      <p className="text-2xl font-bold capitalize" style={{ color: "#E4E4E7" }}>{avgBodyLanguage.dominantExpression}</p>
                      <p className="text-xs" style={{ color: "#A1A1AA" }}>Expression</p>
                      <p className="text-xs mt-1" style={{ color: "#22C55E" }}>
                        {avgBodyLanguage.dominantExpression === 'neutral' || avgBodyLanguage.dominantExpression === 'happy' ? "Professional" : "Consider Tone"}
                      </p>
                    </div>
                  </div>

                  {/* Body Language Tips */}
                  <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: "#27272A" }}>
                    <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "#E4E4E7" }}>
                      <TrendingUp className="w-4 h-4" style={{ color: "#3B82F6" }} />
                      Body Language Tips
                    </h4>
                    <ul className="text-sm space-y-1" style={{ color: "#A1A1AA" }}>
                      {avgBodyLanguage.eyeContact < 60 && (
                        <li>• Try to maintain more consistent eye contact with the camera</li>
                      )}
                      {avgBodyLanguage.engagement < 60 && (
                        <li>• Show more enthusiasm through facial expressions and posture</li>
                      )}
                      {avgBodyLanguage.confidence < 60 && (
                        <li>• Practice speaking more clearly and with conviction</li>
                      )}
                      {avgBodyLanguage.dominantExpression !== 'neutral' && avgBodyLanguage.dominantExpression !== 'happy' && (
                        <li>• Maintain a calm, professional demeanor throughout the interview</li>
                      )}
                      {avgBodyLanguage.eyeContact >= 60 && avgBodyLanguage.engagement >= 60 && avgBodyLanguage.confidence >= 60 && (
                        <li>• Great job! Your body language projects confidence and professionalism</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions and Feedback */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4" style={{ color: "#E4E4E7" }}>Detailed Feedback</h3>
              {feedbackList.map((item, index) => (
                <Card key={index} className="transition-shadow duration-200" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                  <Collapsible>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="transition-colors duration-200 rounded-t-2xl" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-left text-base font-medium line-clamp-2" style={{ color: "#E4E4E7" }}>
                            {item.question}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="rounded-lg"
                              style={{
                                backgroundColor: item.rating < 6 ? "#27272A" : "#27272A",
                                borderColor: item.rating < 6 ? "#EF4444" : "#22C55E",
                                color: item.rating < 6 ? "#EF4444" : "#22C55E"
                              }}
                            >
                              {item.rating}/10
                            </Badge>
                            <ChevronsUpDownIcon className="h-5 w-5" style={{ color: "#A1A1AA" }} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        {/* Your Answer */}
                        <div className="rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#EF4444" }}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "#EF4444" }}>
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Your Answer
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{item.userAns}</p>
                        </div>

                        {/* Correct Answer */}
                        <div className="rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#22C55E" }}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "#22C55E" }}>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Correct Answer
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{item.correctAns}</p>
                        </div>

                        {/* Feedback */}
                        <div className="rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#3B82F6" }}>
                          <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "#3B82F6" }}>
                            <TrendingUp className="w-4 h-4" />
                            Feedback & Improvement Tips
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{item.feedback}</p>
                        </div>

                        {/* Body Language for this question */}
                        {item.engagementScore != null && (
                          <div className="rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#8B5CF6" }}>
                            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#8B5CF6" }}>
                              <Activity className="w-4 h-4" />
                              Body Language Analysis
                            </h4>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="text-center">
                                <Eye className="w-4 h-4 mx-auto mb-1" style={{ color: item.eyeContactScore >= 60 ? "#22C55E" : "#FBBF24" }} />
                                <p className="text-lg font-bold" style={{ color: "#E4E4E7" }}>{item.eyeContactScore || 0}%</p>
                                <p className="text-xs" style={{ color: "#A1A1AA" }}>Eye Contact</p>
                              </div>
                              <div className="text-center">
                                <Brain className="w-4 h-4 mx-auto mb-1" style={{ color: item.engagementScore >= 60 ? "#22C55E" : "#FBBF24" }} />
                                <p className="text-lg font-bold" style={{ color: "#E4E4E7" }}>{item.engagementScore || 0}%</p>
                                <p className="text-xs" style={{ color: "#A1A1AA" }}>Engagement</p>
                              </div>
                              <div className="text-center">
                                <Target className="w-4 h-4 mx-auto mb-1" style={{ color: item.confidenceScore >= 60 ? "#22C55E" : "#FBBF24" }} />
                                <p className="text-lg font-bold" style={{ color: "#E4E4E7" }}>{item.confidenceScore || 0}%</p>
                                <p className="text-xs" style={{ color: "#A1A1AA" }}>Confidence</p>
                              </div>
                              <div className="text-center">
                                <Smile className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
                                <p className="text-lg font-bold capitalize" style={{ color: "#E4E4E7" }}>{item.dominantExpression || '-'}</p>
                                <p className="text-xs" style={{ color: "#A1A1AA" }}>Expression</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => router.replace('/mock/dashboard')}
                className="flex-1 rounded-xl font-medium transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
              >
                <Target className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.replace('/mock/dashboard')}
                className="flex-1 rounded-xl transition-all duration-200 hover:opacity-90"
                style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
              >
                Start New Interview
              </Button>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}

export default Feedback;
