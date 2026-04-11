"""
LangGraph Orchestrator for Multi-Agent Resume Matching.

Orchestrates the flow: Resume Extraction → Parallel Section Scoring → Score Aggregation
"""

from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, END
from src.models.schemas import ResumeStructured, SectionScore, FinalScore
from src.agents.resume_extractor import extract_resume_node
from src.agents.skills_agent import skills_scoring_node
from src.agents.experience_agent import experience_scoring_node
from src.agents.education_agent import education_scoring_node
from src.agents.projects_agent import projects_scoring_node
from src.agents.meta_agent import meta_scoring_node
from src.utils.logging_utils import get_logger

logger = get_logger(__name__)


class OrchestratorState(TypedDict, total=False):
    """LangGraph state type for the orchestrator."""
    resume_text: str
    job_description: str
    resume_structured: dict  # ResumeStructured as dict
    skills_score: dict  # SectionScore as dict
    experience_score: dict  # SectionScore as dict
    education_score: dict  # SectionScore as dict
    projects_score: dict  # SectionScore as dict
    meta_score: dict  # SectionScore as dict
    final_score: dict  # FinalScore as dict


def aggregate_scores_node(state: OrchestratorState) -> OrchestratorState:
    """
    Aggregate all section scores into a final weighted score.
    
    Args:
        state: Current orchestrator state with all section scores
    
    Returns:
        Updated state with final_score
    """
    logger.info("Aggregating section scores")
    
    # Weights for each section
    weights = {
        "skills": 0.35,
        "experience": 0.35,
        "education": 0.15,
        "projects": 0.10,
        "meta": 0.05,
    }
    
    # Collect all section scores
    section_scores: List[SectionScore] = []
    weighted_sum = 0.0
    total_weight = 0.0
    
    # Process each section
    section_keys = {
        "skills": state.get("skills_score"),
        "experience": state.get("experience_score"),
        "education": state.get("education_score"),
        "projects": state.get("projects_score"),
        "meta": state.get("meta_score"),
    }
    
    for section_name, score_dict in section_keys.items():
        if score_dict:
            try:
                score_obj = SectionScore(**score_dict)
                section_scores.append(score_obj)
                weight = weights.get(section_name, 0.0)
                weighted_sum += score_obj.score * weight
                total_weight += weight
                logger.debug(f"{section_name}: {score_obj.score}/100 (weight: {weight})")
            except Exception as e:
                logger.warning(f"Failed to parse {section_name} score: {e}")
        else:
            logger.warning(f"Missing score for section: {section_name}")
    
    # Calculate overall score
    if total_weight > 0:
        overall_score = weighted_sum / total_weight
    else:
        overall_score = 0.0
        logger.warning("No valid scores found, overall score set to 0")
    
    # Generate comments based on scores
    comments = []
    
    # Find highest and lowest scoring sections
    if section_scores:
        highest = max(section_scores, key=lambda s: s.score)
        lowest = min(section_scores, key=lambda s: s.score)
        
        if highest.score >= 80:
            comments.append(f"Strong match in {highest.section_name} section ({highest.score}/100)")
        elif highest.score >= 60:
            comments.append(f"Good match in {highest.section_name} section ({highest.score}/100)")
        
        if lowest.score < 50:
            comments.append(f"Needs improvement in {lowest.section_name} section ({lowest.score}/100)")
            if lowest.missing_requirements:
                comments.append(f"Missing: {', '.join(lowest.missing_requirements[:3])}")
    
    # Overall assessment
    if overall_score >= 80:
        comments.insert(0, "Excellent overall match with the job requirements.")
    elif overall_score >= 60:
        comments.insert(0, "Good overall match with some areas for improvement.")
    elif overall_score >= 40:
        comments.insert(0, "Moderate match. Consider strengthening key areas.")
    else:
        comments.insert(0, "Weak match. Significant improvements needed to align with job requirements.")
    
    # Create FinalScore
    final_score = FinalScore(
        overall_score=round(overall_score, 2),
        section_scores=section_scores,
        comments=comments
    )
    
    logger.info(f"Final aggregated score: {overall_score:.2f}/100")
    
    return {
        "final_score": final_score.model_dump()
    }


def build_langgraph_app() -> StateGraph:
    """
    Build and compile the LangGraph application.
    
    Returns:
        Compiled LangGraph StateGraph ready for execution
    """
    logger.info("Building LangGraph application")
    
    # Create the graph
    workflow = StateGraph(OrchestratorState)
    
    # Add nodes
    workflow.add_node("extract_resume", extract_resume_node)
    workflow.add_node("score_skills", skills_scoring_node)
    workflow.add_node("score_experience", experience_scoring_node)
    workflow.add_node("score_education", education_scoring_node)
    workflow.add_node("score_projects", projects_scoring_node)
    workflow.add_node("score_meta", meta_scoring_node)
    workflow.add_node("aggregate_scores", aggregate_scores_node)
    
    # Define edges
    # Start → extract_resume
    workflow.set_entry_point("extract_resume")
    
    # extract_resume → all section scoring nodes (parallel fan-out)
    workflow.add_edge("extract_resume", "score_skills")
    workflow.add_edge("extract_resume", "score_experience")
    workflow.add_edge("extract_resume", "score_education")
    workflow.add_edge("extract_resume", "score_projects")
    workflow.add_edge("extract_resume", "score_meta")
    
    # All section nodes → aggregate_scores (fan-in)
    workflow.add_edge("score_skills", "aggregate_scores")
    workflow.add_edge("score_experience", "aggregate_scores")
    workflow.add_edge("score_education", "aggregate_scores")
    workflow.add_edge("score_projects", "aggregate_scores")
    workflow.add_edge("score_meta", "aggregate_scores")
    
    # aggregate_scores → END
    workflow.add_edge("aggregate_scores", END)
    
    # Compile the graph
    app = workflow.compile()
    logger.info("LangGraph application compiled successfully")
    
    return app

