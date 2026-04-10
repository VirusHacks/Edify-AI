"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/configs/ai-models";
import { LoaderCircle, MessageSquare } from "lucide-react";
// Removed direct database imports - using API route instead
import { useRouter, useSearchParams } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseEnvironment } from "@/configs/BaseEnvironment";

function AddNewInterview() {
  const searchParams = useSearchParams();
  const [openDialog, setOpenDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [JsonResponse, setJsonResponse] = useState([]);
  const [isFromCourse, setIsFromCourse] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeSource, setResumeSource] = useState(""); // "profile" or "upload"
  const { user } = useKindeBrowserClient();
  const route = useRouter();

  // Pre-fill form from URL params (e.g., coming from a course page)
  useEffect(() => {
    const prefillPosition = searchParams.get("jobPosition");
    const prefillDesc = searchParams.get("jobDesc");
    const prefillExperience = searchParams.get("jobExperience");
    const fromCourse = searchParams.get("fromCourse");

    if (prefillPosition || prefillDesc) {
      if (prefillPosition) setJobPosition(prefillPosition);
      if (prefillDesc) setJobDesc(prefillDesc);
      if (prefillExperience) setJobExperience(prefillExperience);
      if (fromCourse === "true") setIsFromCourse(true);
      // Auto-open the dialog when pre-filled from course
      setOpenDialog(true);
    }
  }, [searchParams]);

  // Fetch resume from profile when dialog opens
  useEffect(() => {
    if (openDialog && step === 2 && !resumeText && !resumeLoading) {
      fetchResumeFromProfile();
    }
  }, [openDialog, step]);

  const fetchResumeFromProfile = async () => {
    setResumeLoading(true);
    setResumeError("");
    try {
      const response = await fetch('/api/user/resume?fullText=true');
      const data = await response.json();
      
      if (data.success && data.resumeText) {
        setResumeText(data.resumeText);
        setResumeSource("profile");
      } else if (data.success && !data.resumeText) {
        // No resume in profile
        setResumeError("No resume found in your profile. Please upload a resume below.");
        setResumeSource("");
      } else {
        setResumeError("Failed to load resume from profile. You can upload one below.");
        setResumeSource("");
      }
    } catch (error) {
      console.error("Error fetching resume from profile:", error);
      setResumeError("Failed to load resume from profile. You can upload one below.");
      setResumeSource("");
    } finally {
      setResumeLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have resume text
    if (!resumeText || resumeText.trim().length === 0) {
      setResumeError("Please upload a resume or ensure your profile has a resume.");
      return;
    }
    
    setLoading(true);

    try {
      const trimmedResume = (resumeText || "").slice(0, 20000);
      const InputPromt = `Generate 10 interview questions and answers in JSON format based on the following candidate context. Only return the JSON (no backticks, no prose).\n\n- Job Position: ${jobPosition}\n- Years of Experience: ${jobExperience}\n- Job Description: ${jobDesc}\n- LinkedIn URL (optional): ${linkedinUrl || "N/A"}\n- Candidate Resume (extracted text): ${trimmedResume}`;

      const result = await chatSession.sendMessage(InputPromt);
      const MockJsonResp = result.response
        .text()
        .replace("```json", "")
        .replace("```", "");

      setJsonResponse(JSON.parse(MockJsonResp));

      if (MockJsonResp) {
        // Call API route instead of directly accessing database
        const apiResponse = await fetch('/api/mock-interview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonMockResp: MockJsonResp,
            jobPosition: jobPosition,
            jobDesc: jobDesc,
            jobExperience: jobExperience,
            linkedinUrl: linkedinUrl || null,
          }),
        });

        const apiResult = await apiResponse.json();

        if (apiResult.success && apiResult.data?.mockId) {
          route.push("/mock/dashboard/interview/" + apiResult.data.mockId);
          setOpenDialog(false);
        } else {
          throw new Error(apiResult.error || 'Failed to create interview');
        }
      } else {
        console.log("ERROR: No response from AI");
        setResumeError("No response from AI. Please try again.");
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      setResumeError("Failed to generate interview questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractPdfText = async (file) => {
    setResumeError("");
    setResumeText("");
    try {
      if (!file) {
        setResumeError("No file selected.");
        return;
      }
      if (file.type !== "application/pdf") {
        setResumeError("Please upload a valid PDF file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setResumeError("File size must be less than 10MB.");
        return;
      }

      // Read file as base64 (without the data URL prefix)
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Send to Gemini to extract text from PDF
      const env = new BaseEnvironment();
      const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMENI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5 -flash" });

      const prompt =
        "Extract the textual content from this PDF resume. Return strictly JSON as {\"text\": \"...\"} with no code fences, no extra keys. Keep plain UTF-8 text.";

      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType: "application/pdf" } },
              { text: prompt },
            ],
          },
        ],
      });

      const textResp = response.response.text();
      const cleaned = textResp.replace("```json", "").replace("```", "");
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: treat full response as text
        parsed = { text: textResp };
      }
      const extracted = (parsed?.text || "").trim();
      if (!extracted) {
        setResumeError("Model returned no text. Try a clearer PDF.");
        return;
      }
      setResumeText(extracted);
      setResumeSource("upload"); // Mark as uploaded
    } catch (err) {
      console.error("Gemini extract error:", err);
      setResumeError("Unable to extract with Gemini. Try another PDF or skip.");
      setResumeText("");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await extractPdfText(file);
    }
  };

  const handleDialogChange = (isOpen) => {
    setOpenDialog(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setStep(1);
      setJobPosition("");
      setJobDesc("");
      setJobExperience("");
      setLinkedinUrl("");
      setResumeText("");
      setResumeError("");
      setResumeSource("");
      setResumeLoading(false);
    }
  };

  return (
    <>
      <div
        className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        onClick={() => setOpenDialog(true)}
      >
        <div className="rounded-2xl border-2 border-dashed transition-all duration-300 h-32 w-64 flex flex-col items-center justify-center p-6 hover:shadow-xl group-hover:scale-105" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3B82F6"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#27272A"}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: "#3B82F6" }}>
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "#E4E4E7" }}>
            Start New Interview
          </h3>
          <p className="text-xs text-center leading-relaxed" style={{ color: "#A1A1AA" }}>
            Create personalized mock interview
          </p>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <DialogHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#3B82F6" }}>
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold" style={{ color: "#E4E4E7" }}>
              {isFromCourse ? "Practice Interview for Your Course" : "Create Your Mock Interview"}
            </DialogTitle>
            <DialogDescription className="mt-2" style={{ color: "#A1A1AA" }}>
              {isFromCourse
                ? "We've pre-filled the details based on your course. Review and customize if needed."
                : "Tell us about the role you're preparing for and we'll generate personalized interview questions"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>
                    Job Role/Position
                  </label>
                  <Input
                    value={jobPosition}
                    onChange={(event) => setJobPosition(event.target.value)}
                    placeholder="e.g., Full Stack Developer, Product Manager"
                    required
                    className="rounded-xl"
                    style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>
                    Years of Experience
                  </label>
                  <Input
                    value={jobExperience}
                    onChange={(event) => setJobExperience(event.target.value)}
                    placeholder="e.g., 3"
                    type="number"
                    min="0"
                    max="50"
                    required
                    className="rounded-xl"
                    style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t" style={{ borderColor: "#27272A" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                  className="flex-1 rounded-xl transition-all duration-200 hover:opacity-90"
                  style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl font-medium transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                >
                  Next
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>
                    Job Description/Tech Stack
                  </label>
                  <Textarea
                    value={jobDesc}
                    onChange={(event) => setJobDesc(event.target.value)}
                    placeholder="e.g., React, Node.js, TypeScript, MongoDB..."
                    required
                    rows={4}
                    className="rounded-xl resize-none"
                    style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>
                    LinkedIn Profile URL (optional)
                  </label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    type="url"
                    className="rounded-xl"
                    style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>
                    Resume
                  </label>
                  
                  {resumeLoading && (
                    <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: "#27272A" }}>
                      <p className="text-xs flex items-center gap-2" style={{ color: "#A1A1AA" }}>
                        <LoaderCircle className="w-3 h-3 animate-spin" />
                        Loading resume from your profile...
                      </p>
                    </div>
                  )}
                  
                  {resumeSource === "profile" && resumeText && (
                    <div className="mb-3 p-3 rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#3B82F6" }}>
                      <p className="text-xs flex items-center gap-2" style={{ color: "#22C55E" }}>
                        <span>✓</span>
                        <span>Resume loaded from your profile ({resumeText.length} characters)</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
                        Upload a new resume below to override
                      </p>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <label className="block text-xs font-medium mb-2" style={{ color: "#A1A1AA" }}>
                      {resumeSource === "profile" ? "Upload Different Resume (Optional)" : "Upload Resume (PDF)"}
                    </label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="rounded-xl"
                      style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </div>
                  
                  {resumeError && (
                    <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{resumeError}</p>
                  )}
                  
                  {resumeSource === "upload" && resumeText && (
                    <p className="text-xs mt-1" style={{ color: "#22C55E" }}>
                      ✓ Resume parsed successfully ({resumeText.length} characters)
                    </p>
                  )}
                  
                  {!resumeText && !resumeLoading && (
                    <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
                      {resumeSource === "" ? "Please upload a resume PDF to continue" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t" style={{ borderColor: "#27272A" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 rounded-xl transition-all duration-200 hover:opacity-90"
                  style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
                >
                  Back
                </Button>
                <Button
                  disabled={loading}
                  type="submit"
                  className="flex-1 rounded-xl font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    "Generate Interview"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddNewInterview;