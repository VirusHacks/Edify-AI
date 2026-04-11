"""
Pydantic models for structured resume data and scoring outputs.

These models are used for:
1. Structured extraction from resume text (ResumeStructured)
2. Section scoring outputs (SectionScore)
3. Final aggregated results (FinalScore)
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    """Contact information from resume."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class Skill(BaseModel):
    """Individual skill with optional metadata."""
    name: str
    level: Optional[str] = Field(None, description="beginner/intermediate/expert")
    years_experience: Optional[float] = None


class ExperienceItem(BaseModel):
    """Work experience entry."""
    job_title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = None
    responsibilities: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    """Education entry."""
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ProjectItem(BaseModel):
    """Project entry."""
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    impact: Optional[str] = None


class MetaInfo(BaseModel):
    """Metadata about the candidate."""
    seniority_level: Optional[str] = Field(
        None, description="e.g., junior/mid/senior"
    )
    domains: List[str] = Field(
        default_factory=list, description="e.g., fintech, healthcare"
    )
    languages: List[str] = Field(default_factory=list)


class ResumeStructured(BaseModel):
    """Complete structured resume data."""
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    skills: List[Skill] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    meta: MetaInfo = Field(default_factory=MetaInfo)


class SectionScore(BaseModel):
    """Score for a specific resume section."""
    section_name: str
    score: float = Field(ge=0, le=100, description="Score from 0-100")
    reasons: List[str] = Field(
        default_factory=list,
        description="Reasons for the score"
    )
    missing_requirements: List[str] = Field(
        default_factory=list,
        description="Missing requirements from job description"
    )


class FinalScore(BaseModel):
    """Final aggregated scoring result."""
    overall_score: float = Field(ge=0, le=100, description="Weighted overall score")
    section_scores: List[SectionScore] = Field(
        default_factory=list,
        description="Individual section scores"
    )
    comments: List[str] = Field(
        default_factory=list,
        description="Overall comments and recommendations"
    )


class SectionOptimization(BaseModel):
    """Optimized content for a single resume section."""
    section_name: str
    original_content: str = Field(description="Original section content")
    optimized_content: str = Field(description="AI-optimized section content")
    improvements: List[str] = Field(
        default_factory=list,
        description="List of improvements made"
    )
    keywords_added: List[str] = Field(
        default_factory=list,
        description="Keywords from JD that were incorporated"
    )


class OptimizationResult(BaseModel):
    """Complete optimization result with all sections."""
    summary: Optional[SectionOptimization] = None
    experience: List[SectionOptimization] = Field(default_factory=list)
    skills: Optional[SectionOptimization] = None
    projects: List[SectionOptimization] = Field(default_factory=list)
    education: List[SectionOptimization] = Field(default_factory=list)
    overall_improvements: List[str] = Field(
        default_factory=list,
        description="Overall improvements and recommendations"
    )

