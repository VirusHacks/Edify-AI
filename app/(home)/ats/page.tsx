'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Sparkles, Loader2, Download, ArrowLeft, CheckCircle, XCircle, Clock, Building2, Briefcase, BarChart3, PieChart, TrendingUp, User, Briefcase as BriefcaseIcon, GraduationCap, Code, FolderKanban, Info, Target, BookOpen, Route, Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import PersonalInfo from '@/components/preview/PersonalInfo';
import SummaryPreview from '@/components/preview/SummaryPreview';
import ExperiencePreview from '@/components/preview/ExperiencePreview';
import EducationPreview from '@/components/preview/EducationPreview';
import SkillPreview from '@/components/preview/SkillPreview';
import ProjectsPreview from '@/components/preview/ProjectsPreview';

interface AnalysisResult {
  analysisId: string;
  overallScore: number;
  atsMatchPercentage: number;
  analysis: any;
  resumeStructured?: any;
  resumeText?: string;
  jobDescription?: string;
}

// Helper component to convert structured resume to ResumeDataType format
function convertStructuredToResumeDataType(resumeStructured: any): any {
  if (!resumeStructured) return null;

  const contactInfo = resumeStructured.contact_info || {};
  
  return {
    personalInfo: {
      firstName: contactInfo.name?.split(' ')[0] || '',
      lastName: contactInfo.name?.split(' ').slice(1).join(' ') || '',
      jobTitle: null,
      address: contactInfo.location || '',
      phone: contactInfo.phone || '',
      email: contactInfo.email || '',
    },
    summary: resumeStructured.summary || '',
    experiences: (resumeStructured.experience || []).map((exp: any) => ({
      title: exp.job_title || '',
      companyName: exp.company || '',
      city: null,
      state: null,
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
      currentlyWorking: exp.is_current || false,
      workSummary: exp.responsibilities?.join('\n') || '',
    })),
    educations: (resumeStructured.education || []).map((edu: any) => ({
      universityName: edu.institution || '',
      degree: edu.degree || '',
      major: edu.field_of_study || '',
      startDate: edu.start_date || '',
      endDate: edu.end_date || '',
      description: null,
    })),
    skills: (resumeStructured.skills || []).map((skill: any) => ({
      name: skill.name || '',
      rating: skill.level === 'expert' ? 5 : skill.level === 'intermediate' ? 3 : 1,
    })),
    projects: (resumeStructured.projects || []).map((proj: any) => ({
      name: proj.name || '',
      description: proj.description || '',
      technologies: proj.technologies || [],
      impact: proj.impact || '',
    })),
    themeColor: '#3B82F6',
  };
}

// Component to display structured resume in document format
function ResumeDocumentViewATS({ resumeStructured }: { resumeStructured: any }) {
  const resumeData = convertStructuredToResumeDataType(resumeStructured);
  
  if (!resumeData) return null;

  return (
    <div
      className="w-full p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-lg !bg-white !text-black max-w-4xl mx-auto overflow-y-auto"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        lineHeight: "1.6",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      <PersonalInfo isLoading={false} resumeInfo={resumeData} />
      <SummaryPreview isLoading={false} resumeInfo={resumeData} />
      <ExperiencePreview isLoading={false} resumeInfo={resumeData} />
      <EducationPreview isLoading={false} resumeInfo={resumeData} />
      <ProjectsPreview isLoading={false} resumeInfo={resumeData} />
      <SkillPreview isLoading={false} resumeInfo={resumeData} />
    </div>
  );
}

// Component to display raw resume text in document format
function ResumeTextViewATS({ resumeText }: { resumeText: string }) {
  return (
    <div
      className="w-full p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-lg !bg-white !text-black max-w-4xl mx-auto overflow-y-auto"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        lineHeight: "1.6",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-gray-700 break-words">
        {resumeText}
      </div>
    </div>
  );
}

// Component to display job description in professional format
function JobDescriptionView({ jobDescription }: { jobDescription: string }) {
  return (
    <div
      className="w-full p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-lg !bg-white !text-black max-w-4xl mx-auto overflow-y-auto"
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        lineHeight: "1.6",
        maxHeight: "calc(100vh - 200px)",
      }}
    >
      <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-gray-700 break-words">
        {jobDescription}
      </div>
    </div>
  );
}

export default function InternshipPreparationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#3B82F6" }} />
      </div>
    }>
      <InternshipPreparationContent />
    </Suspense>
  );
}

function InternshipPreparationContent() {
  const [activeTab, setActiveTab] = useState<'templates' | 'build'>('build');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lastJobTitle, setLastJobTitle] = useState<string>('');
  const [lastCompanyName, setLastCompanyName] = useState<string>('');
  const [lastJobDescription, setLastJobDescription] = useState<string>('');
  const [previousAnalyses, setPreviousAnalyses] = useState<any[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function to extract all missing skills from analysis
  const getMissingSkills = () => {
    if (!analysisResult?.analysis) return [];
    
    const missingSkills: { skill: string; section: string; score: number }[] = [];
    const seenSkills = new Set<string>();
    
    // List of non-skill terms to filter out
    const filterOutTerms = new Set([
      'confirmed upcoming', 'prospective', 'expected', 'resume', 'summary',
      'bullet points', 'experience', 'projects', 'values', 'mission statement',
      'ai research intern', 'status', 'completion', 'validity', 'dates',
      'language', 'keywords', 'alignment', 'boost', 'ats', 'section',
      'professional', 'compelling', 'relevant', 'highlight', 'clarify',
      'incorporate', 'ensure', 'rework', 'add', 'top', 'core', 'strengths',
      'customer focus', 'product quality', 'technical guidance', 'time management',
      'seeking feedback', 's core values', 'mission statement language'
    ]);
    
    // Technical/learnable skills keywords to prioritize
    const technicalKeywords = [
      'programming', 'development', 'engineering', 'design', 'architecture',
      'agile', 'scrum', 'devops', 'cloud', 'aws', 'azure', 'gcp',
      'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
      'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'docker', 'kubernetes', 'ci/cd', 'git', 'linux', 'unix',
      'machine learning', 'deep learning', 'ai', 'nlp', 'computer vision',
      'data science', 'data analysis', 'statistics', 'tensorflow', 'pytorch',
      'api', 'rest', 'graphql', 'microservices', 'system design',
      'testing', 'tdd', 'unit testing', 'automation',
      'security', 'networking', 'database', 'backend', 'frontend', 'fullstack',
      'collaboration', 'communication', 'leadership', 'problem solving'
    ];
    
    const isValidSkill = (skill: string): boolean => {
      const lower = skill.toLowerCase().trim();
      // Filter out short terms, filtered terms, and terms with commas
      if (lower.length < 3 || lower.length > 50) return false;
      if (lower.includes(',')) return false;
      if (filterOutTerms.has(lower)) return false;
      // Check if it contains technical keywords or is a proper skill
      return technicalKeywords.some(kw => lower.includes(kw)) || 
             /^[a-z][a-z\s\-\+\#\.]+$/.test(lower);
    };
    
    // Extract from sectionScores missing_requirements (highest priority)
    if (analysisResult.analysis.sectionScores) {
      analysisResult.analysis.sectionScores.forEach((section: any) => {
        const sectionName = section.section_name || section.sectionName || 'Unknown';
        if (section.missing_requirements?.length > 0) {
          section.missing_requirements.forEach((skill: string) => {
            const cleanSkill = skill.trim();
            if (!seenSkills.has(cleanSkill.toLowerCase()) && isValidSkill(cleanSkill)) {
              seenSkills.add(cleanSkill.toLowerCase());
              missingSkills.push({
                skill: cleanSkill,
                section: sectionName,
                score: section.score || 0,
              });
            }
          });
        }
      });
    }
    
    // Extract from nextSteps (action items mentioning skills) - only technical skills
    if (analysisResult.analysis.nextSteps?.length > 0) {
      analysisResult.analysis.nextSteps.forEach((step: string) => {
        const skillMatch = step.match(/['"]([^'"]+)['"]/g);
        if (skillMatch) {
          skillMatch.forEach((match: string) => {
            const skill = match.replace(/['"]/g, '').trim();
            if (!seenSkills.has(skill.toLowerCase()) && isValidSkill(skill)) {
              // Only add if it looks like a technical skill
              const lower = skill.toLowerCase();
              if (technicalKeywords.some(kw => lower.includes(kw))) {
                seenSkills.add(skill.toLowerCase());
                missingSkills.push({
                  skill,
                  section: 'Recommended Skill',
                  score: 60,
                });
              }
            }
          });
        }
      });
    }
    
    // Limit to top 6 most relevant skills
    return missingSkills.slice(0, 6);
  };

  // Handler for creating a course from a skill
  const handleCreateCourse = (skill: string) => {
    const params = new URLSearchParams({
      prefill: "true",
      topic: skill,
      description: `Learn ${skill} to improve your resume and career prospects for ${lastJobTitle || 'your target role'}`,
      category: "Programming",
      difficulty: "Beginner",
      fromATS: "true",
    });
    router.push(`/create-course?${params.toString()}`);
  };

  // Handler for creating a roadmap from skills
  const handleCreateRoadmap = (skills: string[]) => {
    // Store skills in sessionStorage for the roadmap page
    sessionStorage.setItem("atsSkillGaps", JSON.stringify({
      skills,
      jobTitle: lastJobTitle || jobTitle,
      companyName: lastCompanyName || companyName,
    }));
    router.push("/path/personalized?fromATS=true");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.includes('wordprocessingml')) {
        setResumeFile(file);
        toast({
          title: 'File uploaded',
          description: `${file.name} has been uploaded successfully`,
        });
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or DOCX file',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeFile || !jobDescription) {
      toast({
        title: 'Missing information',
        description: 'Please upload a resume and provide a job description',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jobDescription);
      if (keywords) formData.append('keywords', keywords);
      if (jobTitle) formData.append('jobTitle', jobTitle);
      if (companyName) formData.append('companyName', companyName);

      const response = await fetch('/api/resume-analysis', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setAnalysisResult({
        ...data.data,
        resumeText: data.data.resumeText,
        jobDescription: data.data.jobDescription,
        resumeStructured: data.data.resumeStructured || data.data.analysis?.resumeStructured,
      });
      setLastJobTitle(jobTitle);
      setLastCompanyName(companyName);
      setLastJobDescription(data.data.jobDescription || jobDescription);
      
      // Refresh previous analyses list
      const refreshResponse = await fetch('/api/resume-analysis');
      const refreshData = await refreshResponse.json();
      if (refreshData.success && refreshData.data) {
        setPreviousAnalyses(refreshData.data);
      }
      
      toast({
        title: 'Analysis complete!',
        description: 'Your resume has been analyzed successfully',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch previous analyses on component mount
  useEffect(() => {
    const fetchPreviousAnalyses = async () => {
      try {
        const response = await fetch('/api/resume-analysis');
        const data = await response.json();
        
        if (data.success && data.data) {
          setPreviousAnalyses(data.data);
          
          // Check if there's a specific analysisId in URL params
          const analysisId = searchParams?.get('analysisId');
          if (analysisId) {
            const analysis = data.data.find((a: any) => a.analysisId === analysisId);
            if (analysis) {
              handleViewPreviousAnalysis(analysis);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch previous analyses:', error);
      } finally {
        setLoadingAnalyses(false);
      }
    };

    fetchPreviousAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewPreviousAnalysis = (analysis: any) => {
    setAnalysisResult({
      analysisId: analysis.analysisId,
      overallScore: analysis.overallScore,
      atsMatchPercentage: analysis.atsMatchPercentage,
      analysis: analysis.recommendations || analysis,
      resumeText: analysis.resumeText,
      jobDescription: analysis.jobDescription,
      resumeStructured: analysis.resumeStructured || (analysis.recommendations as any)?.resumeStructured,
    });
    if (analysis.jobTitle) setLastJobTitle(analysis.jobTitle);
    if (analysis.companyName) setLastCompanyName(analysis.companyName);
    if (analysis.jobDescription) setLastJobDescription(analysis.jobDescription);
  };

  const handleDownloadPDF = async () => {
    if (!analysisResult) return;

    try {
      const response = await fetch('/api/resume-report-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: analysisResult.analysis,
          metadata: {
            analysisId: analysisResult.analysisId,
            jobTitle: lastJobTitle || undefined,
            companyName: lastCompanyName || undefined,
            generatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-analysis-${analysisResult.analysisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF downloaded!',
        description: 'Your resume analysis report has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download PDF report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="container mx-auto py-4 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-4 max-w-screen-xl">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: "#E4E4E7" }}>Improve ATS Score</h1>
              <p className="text-xs sm:text-sm md:text-base" style={{ color: "#A1A1AA" }}>
                AI-powered resume intelligence to help you land your dream job
              </p>
            </div>
            <div className="hidden md:block">
            <Link href="/dashboard">
              <Button 
                variant="outline"
                className="rounded-lg"
                style={{
                  borderColor: "#27272A",
                  backgroundColor: "#27272A",
                  color: "#E4E4E7"
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 border-b overflow-x-auto" style={{ borderColor: "#27272A" }}>
          <button
            onClick={() => {
              setActiveTab('build');
              setAnalysisResult(null);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors rounded-t-lg text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
              activeTab === 'build'
                ? 'border-b-2'
                : ''
            }`}
            style={{
              color: activeTab === 'build' ? "#3B82F6" : "#A1A1AA",
              borderBottomColor: activeTab === 'build' ? "#3B82F6" : "transparent"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'build') {
                e.currentTarget.style.color = "#E4E4E7";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'build') {
                e.currentTarget.style.color = "#A1A1AA";
              }
            }}
          >
            <Sparkles className="inline mr-1 sm:mr-2" size={16} style={{ width: '14px', height: '14px' }} />
            <span className="hidden sm:inline">Build Resume (AI-Powered)</span>
            <span className="sm:hidden">Build</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors rounded-t-lg text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
              activeTab === 'templates'
                ? 'border-b-2'
                : ''
            }`}
            style={{
              color: activeTab === 'templates' ? "#3B82F6" : "#A1A1AA",
              borderBottomColor: activeTab === 'templates' ? "#3B82F6" : "transparent"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'templates') {
                e.currentTarget.style.color = "#E4E4E7";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'templates') {
                e.currentTarget.style.color = "#A1A1AA";
              }
            }}
          >
            <FileText className="inline mr-1 sm:mr-2" size={16} style={{ width: '14px', height: '14px' }} />
            <span className="hidden sm:inline">See Templates</span>
            <span className="sm:hidden">Templates</span>
          </button>
        </div>

      {/* Build Resume Tab */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {!analysisResult ? (
            <>
              {/* Previous Analyses Section */}
              {(loadingAnalyses || previousAnalyses.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-2 mb-4 sm:mb-5 md:mb-6"
                >
                  <Card className="rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                        Previous Analyses
                        {loadingAnalyses && (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin ml-1.5 sm:ml-2" style={{ color: "#A1A1AA" }} />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                        View your past resume analyses and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                      {loadingAnalyses ? (
                        <div className="flex items-center justify-center py-6 sm:py-8">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" style={{ color: "#A1A1AA" }} />
                          <span className="ml-2 text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>Loading previous analyses...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {previousAnalyses.map((analysis) => (
                            <Card
                              key={analysis.analysisId}
                              className="cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-lg"
                              style={{ 
                                backgroundColor: "#0A0A0A", 
                                borderColor: "#27272A"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#3B82F6";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#27272A";
                              }}
                              onClick={() => handleViewPreviousAnalysis(analysis)}
                            >
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start justify-between mb-2 sm:mb-3">
                                  <div className="flex-1 min-w-0">
                                    {analysis.jobTitle && (
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                        <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: "#A1A1AA" }} />
                                        <span className="font-medium text-xs sm:text-sm truncate" style={{ color: "#E4E4E7" }}>{analysis.jobTitle}</span>
                                      </div>
                                    )}
                                    {analysis.companyName && (
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: "#A1A1AA" }} />
                                        <span className="text-xs sm:text-sm truncate" style={{ color: "#A1A1AA" }}>{analysis.companyName}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="text-[10px] sm:text-xs mb-0.5 sm:mb-1" style={{ color: "#A1A1AA" }}>Overall Score</div>
                                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#3B82F6" }}>
                                      {analysis.overallScore}/100
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] sm:text-xs mb-0.5 sm:mb-1" style={{ color: "#A1A1AA" }}>ATS Match</div>
                                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#3B82F6" }}>
                                      {analysis.atsMatchPercentage}%
                                    </div>
                                  </div>
                                </div>
                                {analysis.createdAt && (
                                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>
                                    {new Date(analysis.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Left Column - Input Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>Upload Your Resume</CardTitle>
                    <CardDescription className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                      Get personalized recommendations based on your resume and job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* Resume Upload */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="resume" className="text-xs sm:text-sm font-medium" style={{ color: "#E4E4E7" }}>Resume File (PDF or DOCX)</Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf,.docx,.doc"
                          onChange={handleFileChange}
                          className="cursor-pointer rounded-lg text-xs sm:text-sm"
                          style={{
                            backgroundColor: "#27272A",
                            borderColor: "#27272A",
                            color: "#E4E4E7"
                          }}
                        />
                        {resumeFile && (
                          <span className="text-xs sm:text-sm truncate" style={{ color: "#10B981" }}>✓ {resumeFile.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Job Title */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="jobTitle" className="text-xs sm:text-sm font-medium" style={{ color: "#E4E4E7" }}>Job Title (Optional)</Label>
                      <Input
                        id="jobTitle"
                        placeholder="e.g., Software Engineering Intern"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="rounded-lg text-sm sm:text-base h-10 sm:h-11"
                        style={{
                          backgroundColor: "#27272A",
                          borderColor: "#27272A",
                          color: "#E4E4E7"
                        }}
                      />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="companyName" className="text-xs sm:text-sm font-medium" style={{ color: "#E4E4E7" }}>Company Name (Optional)</Label>
                      <Input
                        id="companyName"
                        placeholder="e.g., Google, Microsoft"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="rounded-lg text-sm sm:text-base h-10 sm:h-11"
                        style={{
                          backgroundColor: "#27272A",
                          borderColor: "#27272A",
                          color: "#E4E4E7"
                        }}
                      />
                    </div>

                    {/* Job Description */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="jobDescription" className="text-xs sm:text-sm font-medium" style={{ color: "#E4E4E7" }}>
                        Job Description <span style={{ color: "#EF4444" }}>*</span>
                      </Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Paste the complete job description here..."
                        rows={6}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="resize-none rounded-lg text-sm sm:text-base sm:rows-8"
                        style={{
                          backgroundColor: "#27272A",
                          borderColor: "#27272A",
                          color: "#E4E4E7"
                        }}
                      />
                    </div>

                    {/* Keywords */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="keywords" className="text-xs sm:text-sm font-medium" style={{ color: "#E4E4E7" }}>Additional Keywords (Optional)</Label>
                      <Input
                        id="keywords"
                        placeholder="e.g., Machine Learning, React, Python (comma-separated)"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="rounded-lg text-sm sm:text-base h-10 sm:h-11"
                        style={{
                          backgroundColor: "#27272A",
                          borderColor: "#27272A",
                          color: "#E4E4E7"
                        }}
                      />
                    </div>

                    {/* Analyze Button */}
                    <Button
                      onClick={handleAnalyzeResume}
                      disabled={isAnalyzing || !resumeFile || !jobDescription}
                      className="w-full rounded-xl font-medium transition-all duration-200 hover:opacity-90 h-11 sm:h-12 text-sm sm:text-base"
                      size="lg"
                      style={{
                        backgroundColor: "#3B82F6",
                        color: "#FFFFFF"
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Resume
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column - Information */}
        <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="h-full rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                        <span className="font-bold text-sm sm:text-base" style={{ color: "#3B82F6" }}>1</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base" style={{ color: "#E4E4E7" }}>Upload Your Resume</h3>
                        <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                          Upload your current resume in PDF or DOCX format
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                        <span className="font-bold text-sm sm:text-base" style={{ color: "#3B82F6" }}>2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base" style={{ color: "#E4E4E7" }}>Provide Job Details</h3>
                        <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                          Share the job description and any specific requirements
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                        <span className="font-bold text-sm sm:text-base" style={{ color: "#3B82F6" }}>3</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base" style={{ color: "#E4E4E7" }}>AI Analysis</h3>
                        <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                          Our AI analyzes your resume against the job requirements
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
                        <span className="font-bold text-sm sm:text-base" style={{ color: "#3B82F6" }}>4</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base" style={{ color: "#E4E4E7" }}>Get Personalized Report</h3>
                        <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                          Receive detailed recommendations and download a PDF report
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            /* Results View - Comprehensive Dashboard */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-2"
            >
              <Card className="rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                    <div className="space-y-0.5 sm:space-y-1">
                      <CardTitle className="text-xl sm:text-2xl" style={{ color: "#E4E4E7" }}>Resume Analysis Dashboard</CardTitle>
                      <CardDescription className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                        Comprehensive multi-agent analysis with detailed insights
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={() => setAnalysisResult(null)}
                        className="rounded-lg text-xs sm:text-sm w-full sm:w-auto"
                        style={{
                          borderColor: "#27272A",
                          backgroundColor: "#27272A",
                          color: "#E4E4E7"
                        }}
                      >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        New Analysis
                      </Button>
                      <Button 
                        onClick={handleDownloadPDF}
                        className="rounded-lg font-medium transition-all duration-200 hover:opacity-90 text-xs sm:text-sm w-full sm:w-auto"
                        style={{
                          backgroundColor: "#3B82F6",
                          color: "#FFFFFF"
                        }}
                      >
                        <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                    <Card className="rounded-lg sm:rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                      <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-medium" style={{ color: "#A1A1AA" }}>Overall Score</span>
                        {analysisResult.overallScore >= 75 ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#10B981" }} />
                        ) : analysisResult.overallScore >= 50 ? (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#F59E0B" }} />
                        ) : (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#EF4444" }} />
                        )}
                      </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2" style={{ color: "#3B82F6" }}>
                        {analysisResult.overallScore}/100
                      </div>
                        <Progress 
                          value={analysisResult.overallScore} 
                          className="h-1.5 sm:h-2"
                          style={{
                            backgroundColor: "#18181B",
                          }}
                        />
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg sm:rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                      <CardContent className="p-3 sm:p-4 md:p-6">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-medium" style={{ color: "#A1A1AA" }}>ATS Match</span>
                        {analysisResult.atsMatchPercentage >= 75 ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#10B981" }} />
                        ) : (
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#EF4444" }} />
                        )}
                      </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2" style={{ color: "#3B82F6" }}>
                        {analysisResult.atsMatchPercentage}%
                      </div>
                        <Progress 
                          value={analysisResult.atsMatchPercentage} 
                          className="h-1.5 sm:h-2"
                          style={{
                            backgroundColor: "#18181B",
                          }}
                        />
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg sm:rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-medium" style={{ color: "#A1A1AA" }}>Strengths</span>
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#10B981" }} />
                    </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "#10B981" }}>
                          {analysisResult.analysis.strengths?.length || 0}
                        </div>
                        <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: "#A1A1AA" }}>Key areas</div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg sm:rounded-xl border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                      <CardContent className="p-3 sm:p-4 md:p-6">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-medium" style={{ color: "#A1A1AA" }}>Improvements</span>
                          <Target className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#F59E0B" }} />
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "#F59E0B" }}>
                          {analysisResult.analysis.weaknesses?.length || 0}
                        </div>
                        <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1" style={{ color: "#A1A1AA" }}>Areas to focus</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabbed Interface */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4 sm:mb-6 overflow-x-auto" style={{ backgroundColor: "#27272A" }}>
                      <TabsTrigger value="overview" className="data-[state=active]:bg-[#3B82F6] text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2">
                        <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Overview</span>
                        <span className="sm:hidden">Over</span>
                      </TabsTrigger>
                      <TabsTrigger value="resume" className="data-[state=active]:bg-[#3B82F6] text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2">
                        <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Resume</span>
                        <span className="sm:hidden">Res</span>
                      </TabsTrigger>
                      <TabsTrigger value="job" className="data-[state=active]:bg-[#3B82F6] text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2">
                        <BriefcaseIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Job Description</span>
                        <span className="sm:hidden">Job</span>
                      </TabsTrigger>
                      <TabsTrigger value="sections" className="data-[state=active]:bg-[#3B82F6] text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2">
                        <PieChart className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Sections</span>
                        <span className="sm:hidden">Sec</span>
                      </TabsTrigger>
                      <TabsTrigger value="recommendations" className="data-[state=active]:bg-[#3B82F6] text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2">
                        <Target className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Recommendations</span>
                        <span className="sm:hidden">Rec</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6">
                      {/* Section Scores Bar Chart */}
                      {analysisResult.analysis.sectionScores && analysisResult.analysis.sectionScores.length > 0 && (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                          <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                              Section Scores Comparison
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <ChartContainer
                              config={{
                                score: {
                                  label: "Score",
                                  color: "#3B82F6",
                                },
                              }}
                              className="h-[250px] sm:h-[300px] md:h-[400px]"
                            >
                              <BarChart data={analysisResult.analysis.sectionScores.map((s: any) => ({
                                name: (s.section_name || s.sectionName || '').charAt(0).toUpperCase() + (s.section_name || s.sectionName || '').slice(1),
                                score: s.score,
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fill: '#A1A1AA' }}
                                  style={{ color: '#A1A1AA' }}
                                />
                                <YAxis 
                                  domain={[0, 100]}
                                  tick={{ fill: '#A1A1AA' }}
                                  style={{ color: '#A1A1AA' }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar 
                                  dataKey="score" 
                                  fill="#3B82F6"
                                  radius={[8, 8, 0, 0]}
                                />
                              </BarChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      )}

                      {/* Score Distribution Pie Chart */}
                      {analysisResult.analysis.sectionScores && analysisResult.analysis.sectionScores.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                          <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                            <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                                <PieChart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                                Score Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                              <ChartContainer
                                config={{
                                  excellent: { label: "Excellent (90-100)", color: "#10B981" },
                                  good: { label: "Good (70-89)", color: "#3B82F6" },
                                  fair: { label: "Fair (50-69)", color: "#F59E0B" },
                                  poor: { label: "Poor (0-49)", color: "#EF4444" },
                                }}
                                className="h-[200px] sm:h-[250px] md:h-[300px]"
                              >
                                <RechartsPieChart>
                                  <Pie
                                    data={[
                                      { name: "Excellent", value: analysisResult.analysis.sectionScores.filter((s: any) => s.score >= 90).length, fill: "#10B981" },
                                      { name: "Good", value: analysisResult.analysis.sectionScores.filter((s: any) => s.score >= 70 && s.score < 90).length, fill: "#3B82F6" },
                                      { name: "Fair", value: analysisResult.analysis.sectionScores.filter((s: any) => s.score >= 50 && s.score < 70).length, fill: "#F59E0B" },
                                      { name: "Poor", value: analysisResult.analysis.sectionScores.filter((s: any) => s.score < 50).length, fill: "#EF4444" },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: any) => {
                                      const percent = entry.percent || 0;
                                      const name = entry.name || '';
                                      return `${name}: ${(percent * 100).toFixed(0)}%`;
                                    }}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {[
                                      { fill: "#10B981" },
                                      { fill: "#3B82F6" },
                                      { fill: "#F59E0B" },
                                      { fill: "#EF4444" },
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                  </Pie>
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                </RechartsPieChart>
                              </ChartContainer>
                            </CardContent>
                          </Card>

                          {/* Radar Chart */}
                          <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                            <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                                Performance Radar
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                              <ChartContainer
                                config={{
                                  score: {
                                    label: "Score",
                                    color: "#3B82F6",
                                  },
                                }}
                                className="h-[200px] sm:h-[250px] md:h-[300px]"
                              >
                                <RadarChart data={analysisResult.analysis.sectionScores.map((s: any) => ({
                                  subject: (s.section_name || s.sectionName || '').charAt(0).toUpperCase() + (s.section_name || s.sectionName || '').slice(1),
                                  score: s.score,
                                  fullMark: 100,
                                }))}>
                                  <PolarGrid stroke="#27272A" />
                                  <PolarAngleAxis 
                                    dataKey="subject" 
                                    tick={{ fill: '#A1A1AA' }}
                                  />
                                  <PolarRadiusAxis 
                                    angle={90} 
                                    domain={[0, 100]}
                                    tick={{ fill: '#A1A1AA' }}
                                  />
                                  <Radar
                                    name="Score"
                                    dataKey="score"
                                    stroke="#3B82F6"
                                    fill="#3B82F6"
                                    fillOpacity={0.6}
                                  />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                </RadarChart>
                              </ChartContainer>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Summary Cards - Visual Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                        {analysisResult.analysis.strengths && analysisResult.analysis.strengths.length > 0 && (
                          <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                            <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#10B981" }} />
                                Key Strengths ({analysisResult.analysis.strengths.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                              <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                                {analysisResult.analysis.strengths.map((strength: string, index: number) => (
                                    <div
                                      key={index}
                                    className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg"
                                    style={{ backgroundColor: "#27272A" }}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
                                    <span className="text-xs sm:text-sm flex-1" style={{ color: "#A1A1AA" }}>{strength}</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                        {analysisResult.analysis.weaknesses && analysisResult.analysis.weaknesses.length > 0 && (
                            <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                            <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#EF4444" }} />
                                Areas for Improvement ({analysisResult.analysis.weaknesses.length})
                                </CardTitle>
                              </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                              <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                                {analysisResult.analysis.weaknesses.map((weakness: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg"
                                    style={{ backgroundColor: "#27272A" }}
                                    >
                                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                                    <span className="text-xs sm:text-sm flex-1" style={{ color: "#A1A1AA" }}>{weakness}</span>
                                        </div>
                                  ))}
                      </div>
                              </CardContent>
                            </Card>
                    )}
                                    </div>
                    </TabsContent>

                    {/* Resume Details Tab */}
                    <TabsContent value="resume" className="space-y-3 sm:space-y-4 md:space-y-6">
                      {analysisResult.resumeStructured || analysisResult.resumeText ? (
                            <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                              <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                              Resume Document
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="w-full">
                              {analysisResult.resumeStructured ? (
                                <ResumeDocumentViewATS 
                                  resumeStructured={analysisResult.resumeStructured}
                                />
                              ) : analysisResult.resumeText ? (
                                <ResumeTextViewATS resumeText={analysisResult.resumeText} />
                              ) : null}
                                    </div>
                              </CardContent>
                            </Card>
                      ) : (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                          <CardContent className="p-6 sm:p-8 text-center">
                            <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" style={{ color: "#A1A1AA" }} />
                            <p className="text-sm sm:text-base" style={{ color: "#A1A1AA" }}>Resume data not available</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Job Description Tab */}
                    <TabsContent value="job" className="space-y-3 sm:space-y-4 md:space-y-6">
                      <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                        <CardHeader className="p-4 sm:p-6">
                          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                            <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                            Job Description
                          </CardTitle>
                          {lastJobTitle && (
                            <CardDescription className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                              {lastJobTitle} {lastCompanyName && `at ${lastCompanyName}`}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                          <div className="w-full">
                            <JobDescriptionView 
                              jobDescription={analysisResult.jobDescription || lastJobDescription || 'No job description available'}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Section Analysis Tab */}
                    <TabsContent value="sections" className="space-y-3 sm:space-y-4 md:space-y-6">
                      {analysisResult.analysis.sectionScores && analysisResult.analysis.sectionScores.length > 0 ? (
                        <>
                          {/* Visual Score Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {analysisResult.analysis.sectionScores.map((section: any, index: number) => {
                          const sectionName = section.section_name || section.sectionName || 'Unknown';
                          const score = section.score || 0;
                          const getSectionIcon = (name: string) => {
                            const lower = name.toLowerCase();
                            if (lower.includes('skill')) return Code;
                            if (lower.includes('experience')) return BriefcaseIcon;
                            if (lower.includes('education')) return GraduationCap;
                            if (lower.includes('project')) return FolderKanban;
                            return Info;
                          };
                          const SectionIcon = getSectionIcon(sectionName);
                          const scoreColor = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
                              const strengthsCount = section.reasons?.length || 0;
                              const missingCount = section.missing_requirements?.length || 0;

                          return (
                            <Card key={index} className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                                  <CardContent className="p-4 sm:p-5 md:p-6">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                    <SectionIcon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                                        <CardTitle className="text-sm sm:text-base" style={{ color: "#E4E4E7" }}>
                                          {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                                  </CardTitle>
                                      </div>
                                    </div>
                                    
                                    {/* Score Circle */}
                                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                                        <svg className="transform -rotate-90 w-20 h-20 sm:w-24 sm:h-24">
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="32"
                                            stroke="#27272A"
                                            strokeWidth="6"
                                            fill="none"
                                            className="sm:hidden"
                                          />
                                          <circle
                                            cx="40"
                                            cy="40"
                                            r="32"
                                            stroke={scoreColor}
                                            strokeWidth="6"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 32}`}
                                            strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                                            className="transition-all duration-500 sm:hidden"
                                          />
                                          <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="#27272A"
                                            strokeWidth="8"
                                            fill="none"
                                            className="hidden sm:block"
                                          />
                                          <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke={scoreColor}
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                                            className="transition-all duration-500 hidden sm:block"
                                          />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-center">
                                      <div className="text-xl sm:text-2xl font-bold" style={{ color: scoreColor }}>
                                              {score}
                                  </div>
                                            <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>/100</div>
                                </div>
                                  </div>
                                </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                                      <div className="p-1.5 sm:p-2 rounded-lg text-center" style={{ backgroundColor: "#27272A" }}>
                                        <div className="text-base sm:text-lg font-bold" style={{ color: "#10B981" }}>
                                          {strengthsCount}
                                        </div>
                                        <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>Strengths</div>
                                      </div>
                                      <div className="p-1.5 sm:p-2 rounded-lg text-center" style={{ backgroundColor: "#27272A" }}>
                                        <div className="text-base sm:text-lg font-bold" style={{ color: "#EF4444" }}>
                                          {missingCount}
                                        </div>
                                        <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>Missing</div>
                                      </div>
                                    </div>

                                    {/* Expandable Details */}
                                    <details className="group">
                                      <summary className="cursor-pointer text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2" style={{ color: "#3B82F6" }}>
                                        View Details
                                        <span className="transition-transform group-open:rotate-180 text-[10px] sm:text-xs">▼</span>
                                      </summary>
                                      <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t" style={{ borderColor: "#27272A" }}>
                                {section.reasons && section.reasons.length > 0 && (
                      <div>
                                            <h5 className="text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 flex items-center gap-1" style={{ color: "#E4E4E7" }}>
                                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ color: "#10B981" }} />
                                              Strengths ({strengthsCount})
                                            </h5>
                                            <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                                              {section.reasons.slice(0, 3).map((reason: string, idx: number) => (
                                                <div key={idx} className="text-[10px] sm:text-xs flex items-start gap-1 sm:gap-1.5" style={{ color: "#A1A1AA" }}>
                                                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
                                                  <span className="line-clamp-2 break-words">{reason}</span>
                                                </div>
                                      ))}
                                              {section.reasons.length > 3 && (
                                                <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>
                                                  +{section.reasons.length - 3} more
                                                </div>
                                              )}
                                            </div>
                                  </div>
                                )}
                                {section.missing_requirements && section.missing_requirements.length > 0 && (
                                  <div>
                                            <h5 className="text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 flex items-center gap-1" style={{ color: "#E4E4E7" }}>
                                              <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ color: "#EF4444" }} />
                                              Missing ({missingCount})
                                            </h5>
                                            <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                                              {section.missing_requirements.slice(0, 3).map((missing: string, idx: number) => (
                                                <div key={idx} className="text-[10px] sm:text-xs flex items-start gap-1 sm:gap-1.5" style={{ color: "#A1A1AA" }}>
                                                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mt-0.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                                                  <span className="line-clamp-2 break-words">{missing}</span>
                                                </div>
                                      ))}
                                              {section.missing_requirements.length > 3 && (
                                                <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>
                                                  +{section.missing_requirements.length - 3} more
                                  </div>
                                )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </details>
                              </CardContent>
                            </Card>
                          );
                            })}
                          </div>
                        </>
                      ) : (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                          <CardContent className="p-6 sm:p-8 text-center">
                            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4" style={{ color: "#A1A1AA" }} />
                            <p className="text-sm sm:text-base" style={{ color: "#A1A1AA" }}>No section scores available</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Recommendations Tab */}
                    <TabsContent value="recommendations" className="space-y-3 sm:space-y-4 md:space-y-6">
                      {/* AI Summary Card - Prominent */}
                      {analysisResult.analysis.aiGeneratedSummary && (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#3B82F6" }}>
                          <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                              AI-Generated Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: "#27272A" }}>
                              <p className="leading-relaxed text-xs sm:text-sm" style={{ color: "#E4E4E7" }}>
                                {analysisResult.analysis.aiGeneratedSummary}
                              </p>
                                  </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Skill Gap Analysis with Course/Roadmap Generation */}
                      {getMissingSkills().length > 0 && (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#F59E0B" }}>
                          <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#F59E0B" }} />
                                <span className="break-words">Skill Gap Analysis ({getMissingSkills().length} skills to develop)</span>
                              </CardTitle>
                              <Button
                                onClick={() => handleCreateRoadmap(getMissingSkills().map(s => s.skill))}
                                className="rounded-lg text-xs sm:text-sm w-full sm:w-auto"
                                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                              >
                                <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden sm:inline">Generate Full Roadmap</span>
                                <span className="sm:hidden">Roadmap</span>
                              </Button>
                                  </div>
                            <CardDescription className="text-xs sm:text-sm mt-2 sm:mt-0" style={{ color: "#A1A1AA" }}>
                              Bridge the gap between your current skills and the job requirements with personalized learning paths
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: "#27272A" }}>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: "#EF4444" }}>{getMissingSkills().length}</div>
                                <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>Missing Skills</div>
                              </div>
                              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: "#27272A" }}>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: "#F59E0B" }}>
                                  {getMissingSkills().filter(s => s.section.toLowerCase().includes('skill')).length}
                                </div>
                                <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>Technical Skills</div>
                              </div>
                              <div className="p-2 sm:p-3 rounded-lg text-center" style={{ backgroundColor: "#27272A" }}>
                                <div className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: "#3B82F6" }}>
                                  {getMissingSkills().filter(s => !s.section.toLowerCase().includes('skill')).length}
                                </div>
                                <div className="text-[10px] sm:text-xs" style={{ color: "#A1A1AA" }}>Other Gaps</div>
                              </div>
                            </div>

                            {/* Skills Grid with Actions */}
                            <div className="space-y-2 sm:space-y-3">
                              {getMissingSkills().slice(0, 8).map((item, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border"
                                  style={{ backgroundColor: "#27272A", borderColor: "#3F3F46" }}
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div 
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: item.score < 50 ? "#EF444420" : "#F59E0B20" }}
                                    >
                                      <Code className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: item.score < 50 ? "#EF4444" : "#F59E0B" }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-xs sm:text-sm truncate" style={{ color: "#E4E4E7" }}>{item.skill}</p>
                                      <p className="text-[10px] sm:text-xs truncate" style={{ color: "#A1A1AA" }}>
                                        From: {item.section.charAt(0).toUpperCase() + item.section.slice(1)} • Score: {item.score}%
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCreateCourse(item.skill)}
                                      className="rounded-lg text-[10px] sm:text-xs flex-1 sm:flex-initial"
                                      style={{ borderColor: "#3B82F6", color: "#3B82F6", backgroundColor: "transparent" }}
                                    >
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Create Course</span>
                                      <span className="sm:hidden">Course</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {getMissingSkills().length > 8 && (
                                <div className="text-center pt-2">
                                  <p className="text-xs sm:text-sm" style={{ color: "#A1A1AA" }}>
                                    +{getMissingSkills().length - 8} more skills to develop
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t" style={{ borderColor: "#27272A" }}>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const technicalSkills = getMissingSkills()
                                    .filter(s => s.section.toLowerCase().includes('skill'))
                                    .map(s => s.skill);
                                  if (technicalSkills.length > 0) {
                                    handleCreateRoadmap(technicalSkills);
                                  } else {
                                    toast({
                                      title: "No technical skills found",
                                      description: "No technical skills gaps were identified",
                                    });
                                  }
                                }}
                                className="rounded-lg flex-1 text-xs sm:text-sm"
                                style={{ borderColor: "#27272A", color: "#E4E4E7", backgroundColor: "#27272A" }}
                              >
                                <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden sm:inline">Technical Skills Roadmap</span>
                                <span className="sm:hidden">Tech Roadmap</span>
                              </Button>
                              <Link href="/course-dashboard" className="flex-1">
                                <Button
                                  variant="outline"
                                  className="rounded-lg w-full text-xs sm:text-sm"
                                  style={{ borderColor: "#27272A", color: "#E4E4E7", backgroundColor: "#27272A" }}
                                >
                                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                  <span className="hidden sm:inline">Browse All Courses</span>
                                  <span className="sm:hidden">Browse Courses</span>
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Action Items - Visual Cards */}
                      {analysisResult.analysis.nextSteps && analysisResult.analysis.nextSteps.length > 0 && (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                          <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                              <Target className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                              Action Items & Next Steps ({analysisResult.analysis.nextSteps.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                              {analysisResult.analysis.nextSteps.map((step: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border"
                                  style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}
                                >
                                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 pt-0.5 sm:pt-1 text-xs sm:text-sm" style={{ color: "#E4E4E7" }}>
                                    {step}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                    )}

                      {/* Additional Insights - Compact */}
                      {analysisResult.analysis.comments && analysisResult.analysis.comments.length > 0 && (
                        <Card className="rounded-xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
                          <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl" style={{ color: "#E4E4E7" }}>
                              <Info className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3B82F6" }} />
                              Additional Insights ({analysisResult.analysis.comments.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2">
                              {analysisResult.analysis.comments.map((comment: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-1.5 sm:gap-2 p-2 rounded text-[10px] sm:text-xs"
                                  style={{ backgroundColor: "#27272A", color: "#A1A1AA" }}
                                >
                                  <span className="mt-0.5">•</span>
                                  <span className="break-words">{comment}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="mx-auto h-16 w-16 mb-4" style={{ color: "#A1A1AA" }} />
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "#E4E4E7" }}>Resume Templates</h2>
          <p className="mb-6" style={{ color: "#A1A1AA" }}>
            Browse our collection of professional resume templates (Coming Soon)
          </p>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('build')}
            className="rounded-lg"
            style={{
              borderColor: "#27272A",
              backgroundColor: "#27272A",
              color: "#E4E4E7"
            }}
          >
            Try AI Resume Builder Instead
          </Button>
        </motion.div>
      )}
      </div>
    </div>
  );
}
