"""
LangGraph Orchestrator for Multi-Agent Resume Optimization.

Orchestrates the flow: Parallel Section Optimization → Merge Results
Similar to ATS scoring - receives structured resume directly, no extraction needed.
"""

from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, END
from src.models.schemas import ResumeStructured, OptimizationResult, SectionOptimization
from src.agents.resume_extractor import extract_resume_node
from src.agents.summary_agent import summary_optimization_node
from src.agents.experience_agent import experience_optimization_node
from src.agents.skills_agent import skills_optimization_node
from src.agents.projects_agent import projects_optimization_node
from src.agents.education_agent import education_optimization_node
from src.utils.logging_utils import get_logger

logger = get_logger(__name__)


class OptimizationState(TypedDict, total=False):
    """LangGraph state type for the optimization orchestrator."""
    resume_text: str
    job_description: str
    resume_structured: dict  # ResumeStructured as dict
    summary_optimization: dict  # SectionOptimization as dict
    experience_optimizations: List[dict]  # List of SectionOptimization as dict
    skills_optimization: dict  # SectionOptimization as dict
    projects_optimizations: List[dict]  # List of SectionOptimization as dict
    education_optimizations: List[dict]  # List of SectionOptimization as dict
    optimization_result: dict  # OptimizationResult as dict


def merge_optimizations_node(state: OptimizationState) -> OptimizationState:
    """
    Merge all section optimizations into a final OptimizationResult.
    
    Args:
        state: Current optimization state with all section optimizations
    
    Returns:
        Updated state with optimization_result
    """
    logger.info("Merging section optimizations")
    
    # Collect all optimizations
    summary_opt = state.get("summary_optimization")
    experience_opts = state.get("experience_optimizations", [])
    skills_opt = state.get("skills_optimization")
    projects_opts = state.get("projects_optimizations", [])
    education_opts = state.get("education_optimizations", [])
    
    # Convert dicts to SectionOptimization objects
    summary = None
    if summary_opt:
        try:
            summary = SectionOptimization(**summary_opt)
        except Exception as e:
            logger.warning(f"Failed to parse summary optimization: {e}")
    
    experience = []
    for exp_opt in experience_opts:
        try:
            experience.append(SectionOptimization(**exp_opt))
        except Exception as e:
            logger.warning(f"Failed to parse experience optimization: {e}")
    
    skills = None
    if skills_opt:
        try:
            skills = SectionOptimization(**skills_opt)
        except Exception as e:
            logger.warning(f"Failed to parse skills optimization: {e}")
    
    projects = []
    for proj_opt in projects_opts:
        try:
            projects.append(SectionOptimization(**proj_opt))
        except Exception as e:
            logger.warning(f"Failed to parse project optimization: {e}")
    
    education = []
    for edu_opt in education_opts:
        try:
            education.append(SectionOptimization(**edu_opt))
        except Exception as e:
            logger.warning(f"Failed to parse education optimization: {e}")
    
    # Generate overall improvements
    overall_improvements = []
    
    # Collect keywords from all sections
    all_keywords = set()
    if summary and summary.keywords_added:
        all_keywords.update(summary.keywords_added)
    if skills and skills.keywords_added:
        all_keywords.update(skills.keywords_added)
    for exp in experience:
        if exp.keywords_added:
            all_keywords.update(exp.keywords_added)
    for proj in projects:
        if proj.keywords_added:
            all_keywords.update(proj.keywords_added)
    for edu in education:
        if edu.keywords_added:
            all_keywords.update(edu.keywords_added)
    
    if all_keywords:
        overall_improvements.append(f"Keywords incorporated: {', '.join(list(all_keywords)[:10])}")
    
    # Count improvements
    total_sections = sum([
        1 if summary else 0,
        len(experience),
        1 if skills else 0,
        len(projects),
        len(education)
    ])
    
    if total_sections > 0:
        overall_improvements.append(f"Optimized {total_sections} section(s) for better ATS match")
    
    # Create OptimizationResult
    optimization_result = OptimizationResult(
        summary=summary,
        experience=experience,
        skills=skills,
        projects=projects,
        education=education,
        overall_improvements=overall_improvements
    )
    
    logger.info(f"Optimization merge complete: {total_sections} sections optimized")
    
    return {
        "optimization_result": optimization_result.model_dump()
    }


def prepare_resume_node(state: OptimizationState) -> OptimizationState:
    """
    Prepare resume data - extract if needed, otherwise use provided structured data.
    If structured data is provided, skip extraction (no API call).
    If only text is provided, extract structured data (1 API call).
    """
    resume_structured = state.get("resume_structured")
    resume_text = state.get("resume_text")
    
    # If structured data already provided, skip extraction (no API call)
    if resume_structured:
        logger.info("Using provided structured resume data - skipping extraction")
        return {}  # No-op, structured data already in state
    
    # Otherwise extract from text (1 API call)
    if resume_text:
        logger.info("Extracting structured resume from text")
        result = extract_resume_node(state)
        return result
    
    raise ValueError("Either resume_structured or resume_text must be provided")


def build_optimization_app() -> StateGraph:
    """
    Build and compile the LangGraph optimization application.
    
    Similar to ATS scoring architecture:
    - Extract/prepare resume first (1 call)
    - Then run 5 parallel optimization agents (5 calls)
    - Merge results
    - Total: 6 API calls (same as ATS scoring)
    
    Returns:
        Compiled LangGraph StateGraph ready for execution
    """
    logger.info("Building LangGraph optimization application")
    
    # Create the graph
    workflow = StateGraph(OptimizationState)
    
    # Add nodes
    workflow.add_node("prepare_resume", prepare_resume_node)  # Extract or use structured resume
    workflow.add_node("optimize_summary", summary_optimization_node)
    workflow.add_node("optimize_experience", experience_optimization_node)
    workflow.add_node("optimize_skills", skills_optimization_node)
    workflow.add_node("optimize_projects", projects_optimization_node)
    workflow.add_node("optimize_education", education_optimization_node)
    workflow.add_node("merge_optimizations", merge_optimizations_node)
    
    # Define edges - same pattern as ATS scoring
    # Start → prepare_resume
    workflow.set_entry_point("prepare_resume")
    
    # prepare_resume → all section optimization nodes (parallel fan-out)
    workflow.add_edge("prepare_resume", "optimize_summary")
    workflow.add_edge("prepare_resume", "optimize_experience")
    workflow.add_edge("prepare_resume", "optimize_skills")
    workflow.add_edge("prepare_resume", "optimize_projects")
    workflow.add_edge("prepare_resume", "optimize_education")
    
    # All section nodes → merge_optimizations (fan-in)
    workflow.add_edge("optimize_summary", "merge_optimizations")
    workflow.add_edge("optimize_experience", "merge_optimizations")
    workflow.add_edge("optimize_skills", "merge_optimizations")
    workflow.add_edge("optimize_projects", "merge_optimizations")
    workflow.add_edge("optimize_education", "merge_optimizations")
    
    # merge_optimizations → END
    workflow.add_edge("merge_optimizations", END)
    
    # Compile the graph
    app = workflow.compile()
    logger.info("LangGraph optimization application compiled successfully")
    
    return app

