"""
Projects Scoring Agent.

Scores how well the candidate's projects match the job description requirements.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import SectionScore, ResumeStructured, SectionOptimization
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt
from src.utils.schema_utils import clean_schema_for_vertex_ai

logger = get_logger(__name__)


def projects_scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to score projects section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - projects_score: dict - SectionScore for projects
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with projects_score key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting projects section scoring")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract projects data
    projects_data = [proj.model_dump() for proj in resume.projects]
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Build system prompt
    system_prompt = """You are an expert technical recruiter. You score the candidate's PROJECTS section against the job description for a specific dimension.

Scoring Rules (0-100):
- 90-100: Strong match. Candidate has projects demonstrating relevant technologies, problem-solving, and impact. Projects align with job requirements.
- 60-89: Partial match. Candidate has some relevant projects but may lack specific technologies, scale, or impact demonstrated in job requirements.
- 30-59: Weak match. Candidate has projects but they don't align well with job requirements or lack depth/impact.
- 0-29: Almost no alignment. Candidate's projects don't match job requirements or no projects listed.

Return a JSON object strictly matching the provided schema with:
- section_name: "projects"
- score: numeric score 0-100
- reasons: list of specific reasons for the score (what matches, what's good)
- missing_requirements: list of project requirements missing (e.g., specific technologies, types of projects, demonstrated impact)"""

    # Build user prompt
    user_prompt = f"""Score the candidate's projects against this job description:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE PROJECTS:
{json.dumps(projects_data, indent=2)}

Analyze how well the candidate's projects match the job requirements and provide a detailed score with reasons.

Return a JSON object with this exact structure:
{{
  "section_name": "projects",
  "score": 0-100,
  "reasons": ["reason1", "reason2"],
  "missing_requirements": ["requirement1", "requirement2"]
}}

Return ONLY the JSON object, nothing else."""

    try:
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Call Vertex AI with JSON output
        response = model.generate_content(
            full_prompt,
            generation_config={
                "response_mime_type": "application/json",
            }
        )
        
        # Parse the JSON response
        response_text = response.text
        logger.debug(f"Raw projects scoring response: {response_text[:200]}...")
        
        # Parse JSON
        score_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_score = SectionScore(**score_data)
            # Ensure section_name is correct
            validated_score.section_name = "projects"
            logger.info(f"Projects scoring successful: {validated_score.score}/100")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(score_data, indent=2)}")
            raise ValueError(f"Projects score data failed validation: {e}")
        
        # Return as dict for state
        return {
            "projects_score": validated_score.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse projects scoring response as JSON: {e}")
    except Exception as e:
        logger.error(f"Projects scoring failed: {e}")
        raise


def projects_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to optimize projects section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - projects_optimizations: list - List of SectionOptimization for each project
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with projects_optimizations key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting projects section optimization")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract projects data
    projects_data = [proj.model_dump() for proj in resume.projects]
    
    if not projects_data:
        logger.warning("No projects data found, returning empty optimizations")
        return {"projects_optimizations": []}
    
    # Get the LLM
    model = get_llm(temperature=0.3, max_output_tokens=4096)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=4000)
    
    # Build system prompt
    system_prompt = """You are an expert resume writer specializing in ATS optimization. Your task is to rewrite project descriptions to better match a job description.

Guidelines:
- Use strong action verbs (Built, Developed, Designed, Implemented, etc.)
- Include quantifiable impact and metrics
- Highlight technologies that match the JD
- Emphasize problem-solving and results
- Show relevance to the job role
- Keep descriptions concise but impactful
- Focus on technical depth and business impact

Return a JSON array where each object has this structure:
{
  "section_name": "projects",
  "original_content": "original project name, description, technologies, and impact",
  "optimized_content": "optimized version with better keywords and impact statements",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...]
}

Return ONLY the JSON array, nothing else."""

    # Build user prompt
    user_prompt = f"""Optimize these projects for the following job:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE PROJECTS:
{json.dumps(projects_data, indent=2)}

Rewrite each project to better match the job description. Emphasize relevant technologies, impact, and problem-solving."""

    try:
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Call Vertex AI with JSON output
        response = model.generate_content(
            full_prompt,
            generation_config={
                "response_mime_type": "application/json",
            }
        )
        
        # Parse the JSON response
        response_text = response.text
        logger.debug(f"Raw projects optimization response: {response_text[:300]}...")
        
        # Parse JSON array
        optimizations_data = json.loads(response_text)
        
        if not isinstance(optimizations_data, list):
            optimizations_data = [optimizations_data]
        
        # Validate each optimization
        validated_optimizations = []
        for idx, opt_data in enumerate(optimizations_data):
            try:
                # Fix: Ensure optimized_content is a string, not a list
                if isinstance(opt_data.get("optimized_content"), list):
                    opt_data["optimized_content"] = " ".join(opt_data["optimized_content"])
                if isinstance(opt_data.get("original_content"), list):
                    opt_data["original_content"] = " ".join(opt_data["original_content"])
                
                validated = SectionOptimization(**opt_data)
                validated.section_name = "projects"
                validated_optimizations.append(validated)
            except Exception as e:
                logger.warning(f"Failed to validate project optimization {idx}: {e}")
                # Create a fallback optimization
                if isinstance(opt_data, dict):
                    # Fix: Convert list to string if needed
                    optimized_content = opt_data.get("optimized_content", "")
                    if isinstance(optimized_content, list):
                        optimized_content = " ".join(optimized_content)
                    original_content = opt_data.get("original_content", "")
                    if isinstance(original_content, list):
                        original_content = " ".join(original_content)
                    
                    fallback = SectionOptimization(
                        section_name="projects",
                        original_content=original_content,
                        optimized_content=optimized_content,
                        improvements=opt_data.get("improvements", []),
                        keywords_added=opt_data.get("keywords_added", [])
                    )
                    validated_optimizations.append(fallback)
        
        logger.info(f"Projects optimization successful: {len(validated_optimizations)} projects optimized")
        
        # Return as dict for state
        return {
            "projects_optimizations": [opt.model_dump() for opt in validated_optimizations]
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse projects optimization response as JSON: {e}")
    except Exception as e:
        logger.error(f"Projects optimization failed: {e}")
        raise

