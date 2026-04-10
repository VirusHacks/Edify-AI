"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResumeContext } from "@/context/resume-info-provider";
import useUpdateDocument from "@/features/document/use-update-document";
import { toast } from "@/hooks/use-toast";
import { AIChatSession, isAIAvailable } from "@/lib/google-ai-model";
import { generateThumbnail } from "@/lib/helper";
import { ResumeDataType } from "@/types/resume.type";
import { Loader, Sparkles } from "lucide-react";
import React, { useCallback, useState } from "react";

interface SummaryItem {
  experienceLevel: string;
  summary: string;
}

const SUMMARY_PROMPT = `Job Title: {jobTitle}. Based on the job title, please generate concise 
and complete summaries for my resume as an array of objects with 'experienceLevel' and 'summary' fields,
for fresher, mid, and experienced levels. Example format: [{"experienceLevel": "fresher", "summary": "..."},
{"experienceLevel": "mid", "summary": "..."}, {"experienceLevel": "experienced", "summary": "..."}].
Each summary should be limited to 3 to 4 lines, reflecting a personal tone and showcasing specific relevant
programming languages, technologies, frameworks, and methodologies without any placeholders or gaps.
Ensure that the summaries are engaging and tailored to highlight unique strengths, aspirations,
and contributions to collaborative projects, demonstrating a clear understanding of the role and industry standards.`;

interface SummaryFormProps {
  handleNext: () => void;
}

const SummaryForm: React.FC<SummaryFormProps> = ({ handleNext }) => {
  const { resumeInfo, onUpdate } = useResumeContext();
  const { mutateAsync, isPending } = useUpdateDocument();

  const [loading, setLoading] = useState(false);
  const [aiGeneratedSummaries, setAiGeneratedSummaries] = useState<SummaryItem[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!resumeInfo) return;
    
    onUpdate({
      ...resumeInfo,
      summary: e.target.value,
    });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resumeInfo) return;

      const thumbnail = await generateThumbnail();
      const currentNo = resumeInfo.currentPosition 
        ? resumeInfo.currentPosition + 1 
        : 1;

      try {
        await mutateAsync(
          {
            currentPosition: currentNo,
            thumbnail,
            summary: resumeInfo.summary,
          },
          {
            onSuccess: () => {
              toast({
                title: "Success",
                description: "Summary updated successfully",
              });
              handleNext();
            },
            onError: () => {
              toast({
                title: "Error",
                description: "Failed to update summary",
                variant: "destructive",
              });
            },
          }
        );
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
    [resumeInfo, mutateAsync, handleNext]
  );

  const generateSummaryFromAI = async () => {
    const jobTitle = resumeInfo?.personalInfo?.jobTitle;
    if (!jobTitle) {
      toast({
        title: "Error",
        description: "Job title is required to generate summary",
        variant: "destructive",
      });
      return;
    }

    // Check if AI service is available
    if (!isAIAvailable()) {
      toast({
        title: "Error",
        description: "AI service is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const prompt = SUMMARY_PROMPT.replace("{jobTitle}", jobTitle);
      
      console.log("Sending prompt to AI:", prompt);
      
      if (!AIChatSession) {
        throw new Error("AI service is not available");
      }
      
      const result = await AIChatSession.sendMessage(prompt);
      const responseText = await result.response.text();
      
      console.log("AI Response:", responseText);
      
      try {
        // Clean the response text - remove any markdown code blocks
        let cleanResponse = responseText.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Parse the response and ensure it's an array
        let parsedResponse = JSON.parse(cleanResponse);
        
        // Handle case where response might be wrapped in an object
        if (parsedResponse && typeof parsedResponse === 'object' && !Array.isArray(parsedResponse)) {
          // Look for common keys that might contain the array
          const possibleKeys = ['summaries', 'data', 'result', 'response', 'content'];
          for (const key of possibleKeys) {
            if (parsedResponse[key] && Array.isArray(parsedResponse[key])) {
              parsedResponse = parsedResponse[key];
              break;
            }
          }
        }
        
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          // Validate that each item has the required structure
          const validSummaries = parsedResponse.filter(item => 
            item && 
            typeof item === 'object' && 
            typeof item.experienceLevel === 'string' && 
            typeof item.summary === 'string'
          );
          
          if (validSummaries.length > 0) {
            setAiGeneratedSummaries(validSummaries);
            toast({
              title: "Success",
              description: `Generated ${validSummaries.length} summary suggestions`,
            });
          } else {
            throw new Error('No valid summaries found in response');
          }
        } else {
          throw new Error('Response is not a valid array of summaries');
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("Raw response:", responseText);
        toast({
          title: "Error",
          description: "Failed to parse AI response. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      
      let errorMessage = "Failed to generate summary";
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = "AI service authentication failed";
        } else if (error.message.includes('quota')) {
          errorMessage = "AI service quota exceeded. Please try again later";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback(
    (summary: string) => {
      if (!resumeInfo) return;
      
      onUpdate({
        ...resumeInfo,
        summary,
      });
      setAiGeneratedSummaries(null);
    },
    [onUpdate, resumeInfo]
  );

  return (
    <div>
      <div className="w-full mb-6">
        <h2 className="font-bold text-xl mb-2" style={{ color: "#E4E4E7" }}>Summary</h2>
        <p className="text-base" style={{ color: "#A1A1AA" }}>Add summary for your resume</p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="py-4">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-4">
            <Label className="text-sm font-medium px-2" style={{ color: "#E4E4E7" }}>Add Summary</Label>
            <Button
              variant="outline"
              type="button"
              className="gap-1 text-md font-semibold rounded-lg"
              style={{
                borderColor: "#27272A",
                backgroundColor: "#27272A",
                color: "#E4E4E7"
              }}
              disabled={loading || isPending || !isAIAvailable()}
              onClick={generateSummaryFromAI}
              title={!isAIAvailable() ? "AI service is not configured" : ""}
            >
              <Sparkles size="15px" style={{ color: "#3B82F6" }} />
              {isAIAvailable() ? "Generate with AI" : "AI Not Available"}
            </Button>
          </div>
          <Textarea
            className="mt-3 min-h-36 text-md rounded-lg"
            required
            value={resumeInfo?.summary || ""}
            onChange={handleChange}
            style={{
              backgroundColor: "#27272A",
              borderColor: "#27272A",
              color: "#E4E4E7"
            }}
          />
          
          {aiGeneratedSummaries && aiGeneratedSummaries.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm my-4" style={{ color: "#E4E4E7" }}>Suggestions</h5>
              {aiGeneratedSummaries.map((item, index) => (
                <Card
                  key={index}
                  role="button"
                  className="my-4 shadow-none cursor-pointer transition-colors rounded-xl border"
                  style={{
                    backgroundColor: "#27272A",
                    borderColor: "#27272A"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#27272A";
                  }}
                  onClick={() => handleSelect(item.summary)}
                >
                  <CardHeader className="py-2">
                    <CardTitle className="font-semibold text-md capitalize" style={{ color: "#E4E4E7" }}>
                      {item.experienceLevel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm" style={{ color: "#A1A1AA" }}>
                    <p>{item.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            className="mt-4 text-md font-semibold py-2 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#3B82F6",
              color: "#FFFFFF"
            }}
            type="submit"
            disabled={isPending || loading || resumeInfo?.status === "archived"}
          >
            {isPending && <Loader size="15px" className="animate-spin mr-2" />}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SummaryForm;