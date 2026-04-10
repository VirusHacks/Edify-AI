"use client";
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import ResumeDocumentView from "./ResumeDocumentView";
import { useResumeContext } from "@/context/resume-info-provider";
import { ResumeDataType, StatusType } from "@/types/resume.type";

interface SectionOptimization {
  section_name: string;
  original_content: string | string[] | any;
  optimized_content: string | string[] | any;
  improvements: string[];
  keywords_added: string[];
}

interface OptimizationResult {
  summary?: SectionOptimization;
  experience: SectionOptimization[];
  skills?: SectionOptimization;
  projects: SectionOptimization[];
  education: SectionOptimization[];
  overall_improvements: string[];
}

interface OptimizationComparisonProps {
  optimizationResult: OptimizationResult;
  resumeStructured?: any; // Original structured resume data from backend
  originalData?: any; // Original data from backend
  onApply: (acceptedSections: Record<string, any>) => void;
  onCancel: () => void;
}

const OptimizationComparison: React.FC<OptimizationComparisonProps> = ({
  optimizationResult,
  resumeStructured,
  originalData,
  onApply,
  onCancel,
}) => {
  const { resumeInfo } = useResumeContext();

  // Build base resume data - prefer resumeStructured from backend, fallback to resumeInfo from context
  const baseResumeData = useMemo(() => {
    if (resumeStructured) {
      // Convert backend structured format to frontend ResumeDataType format
      // Backend uses snake_case, frontend uses camelCase
      const personalInfoBackend = resumeStructured.personal_info || resumeStructured.personalInfo;
      const personalInfo = resumeInfo?.personalInfo || (personalInfoBackend ? {
        firstName: personalInfoBackend.first_name || personalInfoBackend.firstName,
        lastName: personalInfoBackend.last_name || personalInfoBackend.lastName,
        jobTitle: personalInfoBackend.job_title || personalInfoBackend.jobTitle,
        address: personalInfoBackend.address,
        phone: personalInfoBackend.phone,
        email: personalInfoBackend.email,
      } : null);

      // Convert experience format
      const experiences = (resumeStructured.experience || resumeStructured.experiences || []).map((exp: any) => ({
        id: exp.id,
        docId: exp.doc_id || exp.docId,
        title: exp.title,
        companyName: exp.company_name || exp.companyName,
        city: exp.city,
        state: exp.state,
        startDate: exp.start_date || exp.startDate,
        endDate: exp.end_date || exp.endDate,
        currentlyWorking: exp.currently_working || exp.currentlyWorking || false,
        workSummary: exp.work_summary || exp.workSummary || exp.description || '',
      }));

      // Convert education format
      const educations = (resumeStructured.education || resumeStructured.educations || []).map((edu: any) => ({
        id: edu.id,
        docId: edu.doc_id || edu.docId,
        universityName: edu.university_name || edu.universityName || edu.institution,
        startDate: edu.start_date || edu.startDate,
        endDate: edu.end_date || edu.endDate,
        degree: edu.degree,
        major: edu.major,
        description: edu.description,
      }));

      // Convert skills format
      const skills = (resumeStructured.skills || []).map((skill: any) => ({
        id: skill.id,
        docId: skill.doc_id || skill.docId,
        name: typeof skill === 'string' ? skill : (skill.name || skill.skill),
        rating: skill.rating,
      }));

      // Convert projects format
      const projects = (resumeStructured.projects || []).map((proj: any) => ({
        id: proj.id,
        docId: proj.doc_id || proj.docId,
        name: proj.name || proj.title,
        description: proj.description || proj.summary,
        technologies: proj.technologies || proj.tech_stack || [],
        impact: proj.impact,
      }));

      return {
        ...resumeInfo,
        title: resumeInfo?.title || 'Resume',
        status: resumeInfo?.status || undefined,
        personalInfo: personalInfo || resumeInfo?.personalInfo || null,
        summary: resumeStructured.summary || resumeInfo?.summary || '',
        experiences: experiences.length > 0 ? experiences : (resumeInfo?.experiences || []),
        educations: educations.length > 0 ? educations : (resumeInfo?.educations || []),
        skills: skills.length > 0 ? skills : (resumeInfo?.skills || []),
        themeColor: resumeInfo?.themeColor || '#3B82F6',
        ...(projects.length > 0 || (resumeInfo as any)?.projects ? { projects: projects.length > 0 ? projects : ((resumeInfo as any)?.projects || []) } : {}),
      } as ResumeDataType & { projects?: any[] };
    }
    return resumeInfo || {
      title: 'Resume',
      status: undefined as StatusType,
      summary: null,
      personalInfo: null,
      experiences: [],
      educations: [],
      skills: [],
    } as ResumeDataType;
  }, [resumeInfo, resumeStructured]);

  // Build optimized resume - apply all optimizations by default
  const optimizedResume = useMemo(() => {
    if (!baseResumeData) return null;

    // Deep clone to avoid mutating original, ensuring all fields are preserved
    const optimized: ResumeDataType = JSON.parse(JSON.stringify(baseResumeData));
    
    // Ensure all required fields exist
    if (!optimized.personalInfo) {
      optimized.personalInfo = baseResumeData.personalInfo || null;
    }
    if (!optimized.experiences) {
      optimized.experiences = baseResumeData.experiences || [];
    }
    if (!optimized.educations) {
      optimized.educations = baseResumeData.educations || [];
    }
    if (!optimized.skills) {
      optimized.skills = baseResumeData.skills || [];
    }
    if (!(optimized as any).projects) {
      (optimized as any).projects = (baseResumeData as any)?.projects || [];
    }
    if (optimized.summary === undefined || optimized.summary === null) {
      optimized.summary = baseResumeData.summary || '';
    }

    // Apply summary optimization
    if (optimizationResult.summary) {
      const optimizedSummary = optimizationResult.summary.optimized_content;
      optimized.summary = typeof optimizedSummary === 'string' 
        ? optimizedSummary 
        : String(optimizedSummary || baseResumeData.summary || '');
    }

    // Apply skills optimization
    if (optimizationResult.skills) {
      const optimizedSkills = optimizationResult.skills.optimized_content;
      if (typeof optimizedSkills === 'string') {
        // Parse markdown or text format skills
        const parsed = parseSkillsFromText(optimizedSkills);
        if (parsed.length > 0) {
          optimized.skills = parsed;
        }
      } else if (Array.isArray(optimizedSkills)) {
        optimized.skills = optimizedSkills.map((s: any) => 
          typeof s === 'string' ? { name: s } : s
        );
      }
    }

    // Apply experience optimizations - preserve all original experiences, update optimized ones
    if (optimizationResult.experience && optimizationResult.experience.length > 0) {
      const originalExperiences = baseResumeData.experiences || [];
      optimized.experiences = originalExperiences.map((originalExp: any, idx: number) => {
        const expOptimization = optimizationResult.experience[idx];
        
        // If this experience was optimized, use optimized content
        if (expOptimization) {
          const optimizedContent = typeof expOptimization.optimized_content === 'string'
            ? expOptimization.optimized_content
            : String(expOptimization.optimized_content || originalExp.workSummary || '');
          
          return {
            ...originalExp,
            workSummary: optimizedContent,
          };
        }
        
        // Otherwise, keep original
        return originalExp;
      });
    }

    // Apply education optimizations - preserve all original educations, update optimized ones
    if (optimizationResult.education && optimizationResult.education.length > 0) {
      const originalEducations = baseResumeData.educations || [];
      optimized.educations = originalEducations.map((originalEdu: any, idx: number) => {
        const eduOptimization = optimizationResult.education[idx];
        
        // If this education was optimized, use optimized content
        if (eduOptimization) {
          const optimizedContent = typeof eduOptimization.optimized_content === 'string'
            ? eduOptimization.optimized_content
            : String(eduOptimization.optimized_content || originalEdu.description || '');
          
          return {
            ...originalEdu,
            description: optimizedContent,
          };
        }
        
        // Otherwise, keep original
        return originalEdu;
      });
    }

    // Apply projects optimizations - preserve all original projects, update optimized ones
    if (optimizationResult.projects && optimizationResult.projects.length > 0) {
      const originalProjects = (baseResumeData as any)?.projects || [];
      (optimized as any).projects = originalProjects.map((originalProj: any, idx: number) => {
        const projOptimization = optimizationResult.projects[idx];
        
        // If this project was optimized, use optimized content
        if (projOptimization) {
          const optimizedContent = typeof projOptimization.optimized_content === 'string'
            ? projOptimization.optimized_content
            : String(projOptimization.optimized_content || originalProj.description || '');
          
          return {
            ...originalProj,
            description: optimizedContent,
          };
        }
        
        // Otherwise, keep original
        return originalProj;
      });
    }

    return optimized;
  }, [baseResumeData, optimizationResult]);

  // Debug: Log the data structures (must be before any early returns)
  React.useEffect(() => {
    if (baseResumeData && optimizedResume) {
      console.log("Base Resume Data:", baseResumeData);
      console.log("Resume Info (context):", resumeInfo);
      console.log("Resume Structured (backend):", resumeStructured);
      console.log("Optimized Resume:", optimizedResume);
      console.log("Optimization Result:", optimizationResult);
    }
  }, [baseResumeData, resumeInfo, resumeStructured, optimizedResume, optimizationResult]);

  if (!baseResumeData || !optimizedResume) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: "#E4E4E7" }}>
        <div>Loading resume data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-black min-h-screen p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                <Sparkles className="w-5 h-5" style={{ color: "#3B82F6" }} />
              </div>
              <div>
                <CardTitle className="text-xl" style={{ color: "#E4E4E7" }}>
                  Resume Optimization Results
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>
                  Compare original and optimized resumes side by side
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        {optimizationResult.overall_improvements && optimizationResult.overall_improvements.length > 0 && (
          <CardContent className="pt-0">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "#27272A" }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: "#E4E4E7" }}>
                Overall Improvements:
              </h4>
              <ul className="space-y-1">
                {optimizationResult.overall_improvements.map((improvement, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-2" style={{ color: "#A1A1AA" }}>
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>


      {/* Side-by-side Document Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
        {/* Original Resume */}
        <div className="flex flex-col h-full">
          <ResumeDocumentView
            resumeInfo={baseResumeData}
            label="Original Resume"
            labelColor="#EF4444"
          />
        </div>

        {/* Optimized Resume */}
        <div className="flex flex-col h-full">
          <ResumeDocumentView
            resumeInfo={optimizedResume}
            label="Optimized Resume"
            labelColor="#22C55E"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-black pb-4" style={{ borderColor: "#27272A" }}>
        <Button
          variant="outline"
          onClick={onCancel}
          className="rounded-xl"
          style={{
            borderColor: "#27272A",
            backgroundColor: "#27272A",
            color: "#E4E4E7",
          }}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

// Helper function to parse skills from text/markdown
function parseSkillsFromText(skillsText: string): any[] {
  if (!skillsText || typeof skillsText !== 'string') return [];
  
  const skills: any[] = [];
  
  // Remove markdown formatting
  let cleaned = skillsText
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '') // Remove italic/bullets
    .replace(/##/g, '') // Remove double hash
    .trim();
  
  // Split by newlines and process each line
  const lines = cleaned.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip section headers and category labels
    if (trimmedLine.toLowerCase().includes('technical skills') || 
        trimmedLine.toLowerCase().includes('applied science') ||
        trimmedLine.toLowerCase().includes('machine learning') ||
        trimmedLine.toLowerCase().includes('data analysis') ||
        trimmedLine.toLowerCase().includes('programming languages') ||
        trimmedLine.toLowerCase().includes('databases') ||
        trimmedLine.match(/^##?\s*[A-Z]/)) { // Markdown headers
      continue;
    }
    
    // Extract skills from bullet points (various formats)
    const bulletPattern = /^[-•*]\s*(.+)$/;
    const bulletMatch = trimmedLine.match(bulletPattern);
    if (bulletMatch) {
      const skillText = bulletMatch[1].trim();
      // Check if it's a comma-separated list
      if (skillText.includes(',')) {
        skillText.split(',').forEach(skill => {
          const skillName = skill.trim();
          if (skillName && skillName.length > 0) {
            skills.push({ name: skillName });
          }
        });
      } else {
        skills.push({ name: skillText });
      }
      continue;
    }
    
    // Try comma-separated list (without bullets)
    if (trimmedLine.includes(',')) {
      trimmedLine.split(',').forEach(skill => {
        const skillName = skill.trim();
        if (skillName && skillName.length > 0 && !skillName.toLowerCase().includes('skills')) {
          skills.push({ name: skillName });
        }
      });
      continue;
    }
    
    // Single skill on a line (if it's not a header)
    if (trimmedLine.length > 0 && 
        !trimmedLine.match(/^[A-Z][a-z]+\s+[A-Z]/) && // Not a sentence
        trimmedLine.length < 50) { // Not too long
      skills.push({ name: trimmedLine });
    }
  }
  
  // Remove duplicates
  const uniqueSkills = skills.filter((skill, index, self) =>
    index === self.findIndex((s) => s.name?.toLowerCase() === skill.name?.toLowerCase())
  );
  
  return uniqueSkills.length > 0 ? uniqueSkills : [];
}

export default OptimizationComparison;
