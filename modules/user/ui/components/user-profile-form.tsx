"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  PlusIcon, XIcon, Mail, Upload, FileText, Linkedin, Github, 
  Twitter, Globe, ExternalLink, CheckCircle2, AlertCircle, Loader2, Sparkles, Brain 
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { userUpdateSchema } from "@/modules/user/schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GeneratedAvatar } from "@/components/generated-avatar";

// Helper to safely parse JSON arrays
const parseJsonArray = (str: string | null | undefined): string[] => {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Helper to safely parse JSON objects
const parseJsonObject = (str: string | null | undefined): Record<string, string> => {
  if (!str) return {};
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

// Build form default values from user data
const buildFormValues = (user: any) => ({
  bio: user.bio || "",
  interests: parseJsonArray(user.interests),
  skills: parseJsonArray(user.skills),
  courses: parseJsonArray(user.courses),
  preferredLanguages: parseJsonArray(user.preferredLanguages),
  learningGoals: parseJsonArray(user.learningGoals),
  occupation: user.occupation || "",
  location: user.location || "",
  website: user.website || "",
  socialLinks: parseJsonObject(user.socialLinks),
  linkedinProfileUrl: user.linkedinProfileUrl || "",
  githubUsername: user.githubUsername || "",
});

export const UserProfileForm = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for file uploads and imports
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  const { data: user } = useSuspenseQuery(trpc.user.getOne.queryOptions());

  // Parse profile completeness
  const profileCompleteness = (() => {
    try {
      return user.profileCompleteness ? JSON.parse(user.profileCompleteness) : { score: 0, details: {} };
    } catch {
      return { score: 0, details: {} };
    }
  })();

  const updateUser = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
        toast.success("Changes saved ✅");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Initialize form with user data
  const form = useForm<z.infer<typeof userUpdateSchema>>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: buildFormValues(user),
  });

  // Reset form when user data changes (after resume upload, LinkedIn import, etc.)
  // We track specific fields that can be auto-populated to trigger form reset
  useEffect(() => {
    const newValues = buildFormValues(user);
    form.reset(newValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user.skills,
    user.interests,
    user.bio,
    user.occupation,
    user.location,
    user.website,
    user.githubUsername,
    user.socialLinks,
    user.linkedinProfileUrl,
    user.resumeUrl,
    user.updatedAt,
  ]);

  // Watch socialLinks for reactive updates in uncontrolled social inputs
  const watchedSocialLinks = form.watch("socialLinks") || {};

  const interests = useFieldArray({ control: form.control as any, name: "interests" });
  const skills = useFieldArray({ control: form.control as any, name: "skills" });
  const courses = useFieldArray({ control: form.control as any, name: "courses" });
  const languages = useFieldArray({ control: form.control as any, name: "preferredLanguages" });
  const learningGoals = useFieldArray({ control: form.control as any, name: "learningGoals" });

  const isPending = updateUser.isPending;

  const onSubmit = (values: z.infer<typeof userUpdateSchema>) => {
    updateUser.mutate(values);
  };

  // Resume upload handler
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/user/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Show detailed success message with auto-populated info
        const { autoPopulated, extracted } = data;
        let message = "Resume uploaded and analyzed! 🎉";
        
        if (autoPopulated) {
          const updates: string[] = [];
          if (autoPopulated.skillsAdded > 0) {
            updates.push(`${autoPopulated.skillsAdded} skills`);
          }
          if (autoPopulated.interestsAdded > 0) {
            updates.push(`${autoPopulated.interestsAdded} interests`);
          }
          if (autoPopulated.fieldsUpdated && autoPopulated.fieldsUpdated.length > 0) {
            updates.push(autoPopulated.fieldsUpdated.join(", "));
          }
          
          if (updates.length > 0) {
            message = `Resume uploaded! Auto-added: ${updates.join(", ")} 🎉`;
          }
        }
        
        toast.success(message);
        
        // Refresh the form data to show auto-populated fields
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
        
        // Show extracted data hint
        if (extracted?.currentRole) {
          toast.info(`Detected role: ${extracted.currentRole}`, { duration: 3000 });
        }
      } else {
        toast.error(data.error || "Failed to upload resume");
      }
    } catch (error) {
      toast.error("Failed to upload resume");
      console.error("Resume upload error:", error);
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // LinkedIn import handler
  const handleLinkedInImport = async () => {
    if (!linkedinUrlInput.trim()) {
      toast.error("Please enter your LinkedIn profile URL");
      return;
    }

    // Basic URL validation
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
    if (!linkedinRegex.test(linkedinUrlInput)) {
      toast.error("Invalid LinkedIn URL. Use format: https://linkedin.com/in/username");
      return;
    }

    setIsImportingLinkedIn(true);
    try {
      const response = await fetch("/api/user/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: linkedinUrlInput }),
      });

      const data = await response.json();

      if (data.success) {
        // Build success message with auto-populated fields
        const autoPopulated = data.autoPopulated;
        let message = "LinkedIn profile imported! 🔗";
        
        if (autoPopulated?.fieldsUpdated?.length > 0) {
          message = `LinkedIn imported! Auto-updated: ${autoPopulated.fieldsUpdated.join(", ")} 🔗`;
        }
        
        toast.success(message);
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
        setLinkedinUrlInput("");
      } else {
        toast.error(data.error || "Failed to import LinkedIn profile");
      }
    } catch (error) {
      toast.error("Failed to import LinkedIn profile");
      console.error("LinkedIn import error:", error);
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  // Delete resume handler
  const handleDeleteResume = async () => {
    try {
      const response = await fetch("/api/user/resume", { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        toast.success("Resume removed");
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
      } else {
        toast.error(data.error || "Failed to remove resume");
      }
    } catch (error) {
      toast.error("Failed to remove resume");
    }
  };

  // Generate AI Context handler
  const handleGenerateAIContext = async () => {
    setIsGeneratingContext(true);
    try {
      const response = await fetch("/api/user/ai-context", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("AI Context generated successfully! 🤖");
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
        
        if (data.profileCompleteness?.score) {
          toast.info(`Profile completeness: ${data.profileCompleteness.score}%`, { duration: 3000 });
        }
      } else {
        toast.error(data.error || "Failed to generate AI context");
      }
    } catch (error) {
      toast.error("Failed to generate AI context");
      console.error("AI context generation error:", error);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  // Helper to create tag input field
  const TagField = ({ label, placeholder, fields, form, name }: any) => (
    <div className="space-y-3">
      <FormLabel className="text-sm font-medium block" style={{ color: "#E4E4E7" }}>{label}</FormLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {fields.fields.map((field: any, index: number) => (
          <span 
            key={field.id} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ backgroundColor: "#27272A", color: "#E4E4E7", border: "1px solid #27272A" }}
          >
            {form.watch(`${name}.${index}`)}
            <button
              type="button"
              onClick={() => fields.remove(index)}
              className="ml-1 transition-colors"
              style={{ color: "#71717A" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#E4E4E7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#71717A"; }}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = e.currentTarget.value.trim();
              if (value && !form.watch(name)?.includes(value)) {
                fields.append(value);
                e.currentTarget.value = "";
              }
            }
          }}
          className="h-10 text-sm rounded-xl"
          style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`);
            const value = input?.value.trim();
            if (value && !form.watch(name)?.includes(value)) {
              fields.append(value);
              input!.value = "";
            }
          }}
          className="h-10 w-10 rounded-xl transition-all"
          style={{ backgroundColor: "#3B82F6", borderColor: "#3B82F6", color: "#FFFFFF" }}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
        {/* Profile Completeness Bar */}
        <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: "#27272A", border: "1px solid #27272A" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Profile Completeness</span>
            <span className="text-sm font-bold" style={{ color: "#3B82F6" }}>{profileCompleteness.score || 0}%</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${profileCompleteness.score || 0}%`, backgroundColor: "#3B82F6" }}
            />
          </div>
          <p className="text-xs mt-3" style={{ color: "#71717A" }}>
            Complete your profile to get better course recommendations and career advice
          </p>
        </div>

        {/* Compact Profile Header */}
        <div className="flex items-center gap-4 mb-8 pb-8" style={{ borderBottom: "1px solid #27272A" }}>
          <GeneratedAvatar
            seed={user.name}
            variant="botttsNeutral"
            className="size-14 md:size-16 flex-shrink-0 rounded-full"
            style={{ border: "2px solid #27272A" }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold mb-1 truncate" style={{ color: "#E4E4E7" }}>{user.name}</h3>
            <p className="text-sm mb-2" style={{ color: "#71717A" }}>{user.occupation || "Student"}</p>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#71717A" }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "#3B82F6" }} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Resume & LinkedIn Import Section */}
        <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: "#27272A", border: "1px solid #27272A" }}>
          <h4 className="text-sm font-semibold mb-5" style={{ color: "#E4E4E7" }}>Import Profile Data</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resume Upload */}
            <div className="p-4 rounded-xl transition-all" style={{ backgroundColor: "#0A0A0A", border: "1px solid #27272A" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
                  <FileText className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>Resume</span>
                {user.resumeUrl && (
                  <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: "#22C55E" }} />
                )}
              </div>
              
              {user.resumeUrl ? (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: "#71717A" }}>Resume uploaded and analyzed</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(user.resumeUrl!, "_blank")}
                      className="text-xs rounded-lg"
                      style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#A1A1AA" }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteResume}
                      className="text-xs rounded-lg"
                      style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#EF4444" }}
                    >
                      <XIcon className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume}
                    className="w-full text-xs rounded-lg transition-all"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)", color: "#3B82F6" }}
                  >
                    {isUploadingResume ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" /> Upload Resume
                      </>
                    )}
                  </Button>
                  <p className="text-xs mt-2" style={{ color: "#52525B" }}>PDF or Word, max 5MB</p>
                </div>
              )}
            </div>

            {/* LinkedIn Import */}
            <div className="p-4 rounded-xl transition-all" style={{ backgroundColor: "#0A0A0A", border: "1px solid #27272A" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(10, 102, 194, 0.1)" }}>
                  <Linkedin className="w-4 h-4" style={{ color: "#0A66C2" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "#E4E4E7" }}>LinkedIn</span>
                {user.linkedinSummary && (
                  <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: "#22C55E" }} />
                )}
              </div>
              
              {user.linkedinSummary ? (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: "#71717A" }}>Profile imported successfully</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(user.linkedinProfileUrl!, "_blank")}
                    className="text-xs rounded-lg"
                    style={{ backgroundColor: "#27272A", borderColor: "#27272A", color: "#A1A1AA" }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> View Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrlInput}
                    onChange={(e) => setLinkedinUrlInput(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                    style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLinkedInImport}
                    disabled={isImportingLinkedIn}
                    className="w-full text-xs rounded-lg transition-all"
                    style={{ backgroundColor: "rgba(10, 102, 194, 0.1)", borderColor: "rgba(10, 102, 194, 0.3)", color: "#0A66C2" }}
                  >
                    {isImportingLinkedIn ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Importing...
                      </>
                    ) : (
                      <>
                        <Linkedin className="w-3 h-3 mr-1" /> Import Profile
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Context Section */}
        <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: "#27272A", border: "1px solid #27272A" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}>
                <Brain className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "#E4E4E7" }}>AI Profile Context</h4>
            </div>
            {user.aiContext && (
              <CheckCircle2 className="w-4 h-4" style={{ color: "#22C55E" }} />
            )}
          </div>
          
          <p className="text-xs mb-4" style={{ color: "#71717A" }}>
            Generate a unified AI context from your resume, LinkedIn, and profile data. This helps provide personalized course recommendations and career advice.
          </p>

          {user.aiContext ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#0A0A0A", border: "1px solid #27272A" }}>
                <p className="text-xs leading-relaxed" style={{ color: "#A1A1AA" }}>
                  {user.aiContext.length > 300 ? user.aiContext.substring(0, 300) + "..." : user.aiContext}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#52525B" }}>
                  {user.aiContext.length} characters
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAIContext}
                  disabled={isGeneratingContext}
                  className="text-xs rounded-lg transition-all"
                  style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", borderColor: "rgba(139, 92, 246, 0.3)", color: "#8B5CF6" }}
                >
                  {isGeneratingContext ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" /> Regenerate
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateAIContext}
              disabled={isGeneratingContext}
              className="w-full text-xs rounded-lg transition-all"
              style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", borderColor: "rgba(139, 92, 246, 0.3)", color: "#8B5CF6" }}
            >
              {isGeneratingContext ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating AI Context...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" /> Generate AI Context
                </>
              )}
            </Button>
          )}
        </div>

        {/* Social Links Section */}
        <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: "#27272A", border: "1px solid #27272A" }}>
          <h4 className="text-sm font-semibold mb-5" style={{ color: "#E4E4E7" }}>Social Links</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub */}
            <FormField
              name="githubUsername"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium flex items-center gap-2" style={{ color: "#A1A1AA" }}>
                    <Github className="w-4 h-4" /> GitHub Username
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="username" 
                      className="h-9 text-sm rounded-lg"
                      style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Twitter */}
            <div>
              <label className="text-xs font-medium flex items-center gap-2 mb-2" style={{ color: "#A1A1AA" }}>
                <Twitter className="w-4 h-4" /> Twitter URL
              </label>
              <Input
                placeholder="https://twitter.com/username"
                value={watchedSocialLinks.twitter || ""}
                onChange={(e) => {
                  const currentLinks = form.getValues("socialLinks") || {};
                  form.setValue("socialLinks", { ...currentLinks, twitter: e.target.value });
                }}
                className="h-9 text-sm rounded-lg"
                style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
              />
            </div>

            {/* Portfolio */}
            <div>
              <label className="text-xs font-medium flex items-center gap-2 mb-2" style={{ color: "#A1A1AA" }}>
                <Globe className="w-4 h-4" /> Portfolio URL
              </label>
              <Input
                placeholder="https://yourportfolio.com"
                value={watchedSocialLinks.portfolio || ""}
                onChange={(e) => {
                  const currentLinks = form.getValues("socialLinks") || {};
                  form.setValue("socialLinks", { ...currentLinks, portfolio: e.target.value });
                }}
                className="h-9 text-sm rounded-lg"
                style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
              />
            </div>

            {/* LeetCode */}
            <div>
              <label className="text-xs font-medium flex items-center gap-2 mb-2" style={{ color: "#A1A1AA" }}>
                <span className="text-xs font-semibold">LC</span> LeetCode URL
              </label>
              <Input
                placeholder="https://leetcode.com/username"
                value={watchedSocialLinks.leetcode || ""}
                onChange={(e) => {
                  const currentLinks = form.getValues("socialLinks") || {};
                  form.setValue("socialLinks", { ...currentLinks, leetcode: e.target.value });
                }}
                className="h-9 text-sm rounded-lg"
                style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
              />
            </div>
          </div>
        </div>

        {/* Compact Two Column Grid - Better breakpoint for form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Occupation */}
            <FormField
              name="occupation"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2" style={{ color: "#E4E4E7" }}>Occupation</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g. Software Engineer" 
                      className="h-10 text-sm rounded-xl"
                      style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              name="location"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2" style={{ color: "#E4E4E7" }}>Location</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g. San Francisco, CA" 
                      className="h-10 text-sm rounded-xl"
                      style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              name="website"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2" style={{ color: "#E4E4E7" }}>Website</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="https://yourwebsite.com" 
                      className="h-10 text-sm rounded-xl"
                      style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skills */}
            <TagField
              label="Skills"
              placeholder="Add skill"
              fields={skills}
              form={form}
              name="skills"
            />

            {/* Interests */}
            <TagField
              label="Interests"
              placeholder="Add interest"
              fields={interests}
              form={form}
              name="interests"
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bio */}
            <FormField
              name="bio"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium block mb-2" style={{ color: "#E4E4E7" }}>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px] text-sm rounded-xl resize-none"
                      style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A", color: "#E4E4E7" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Languages */}
            <TagField
              label="Preferred Languages"
              placeholder="Add language"
              fields={languages}
              form={form}
              name="preferredLanguages"
            />

            {/* Learning Goals */}
            <TagField
              label="Learning Goals"
              placeholder="Add learning goal"
              fields={learningGoals}
              form={form}
              name="learningGoals"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-8" style={{ borderTop: "1px solid #27272A" }}>
          <Button 
            type="submit" 
            disabled={isPending}
            size="lg"
            className="font-medium px-8 rounded-xl transition-all"
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
