"""
Skills Scoring Agent.

Scores how well the candidate's skills match the job description requirements.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import SectionScore, ResumeStructured, SectionOptimization
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt
from src.utils.schema_utils import clean_schema_for_vertex_ai

logger = get_logger(__name__)


def skills_scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to score skills section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - skills_score: dict - SectionScore for skills
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with skills_score key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting skills section scoring")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract skills data
    skills_data = [skill.model_dump() for skill in resume.skills]
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Build system prompt
    system_prompt = """You are an expert technical recruiter. You score the candidate's SKILLS section against the job description for a specific dimension.

Scoring Rules (0-100):
- 90-100: Strong match on most key requirements. Candidate has most or all required skills with appropriate experience levels.
- 60-89: Partial match. Candidate has some required skills but missing important ones or has insufficient experience.
- 30-59: Weak match. Candidate has few required skills or significant gaps in critical areas.
- 0-29: Almost no alignment. Candidate lacks most required skills.

Return a JSON object strictly matching the provided schema with:
- section_name: "skills"
- score: numeric score 0-100
- reasons: list of specific reasons for the score (what matches, what's good)
- missing_requirements: list of skills or skill levels missing from the job description"""

    # Build user prompt
    user_prompt = f"""Score the candidate's skills against this job description:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE SKILLS:
{json.dumps(skills_data, indent=2)}

Analyze how well the candidate's skills match the job requirements and provide a detailed score with reasons.

Return a JSON object with this exact structure:
{{
  "section_name": "skills",
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
        logger.debug(f"Raw skills scoring response: {response_text[:200]}...")
        
        # Parse JSON
        score_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_score = SectionScore(**score_data)
            # Ensure section_name is correct
            validated_score.section_name = "skills"
            logger.info(f"Skills scoring successful: {validated_score.score}/100")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(score_data, indent=2)}")
            raise ValueError(f"Skills score data failed validation: {e}")
        
        # Return as dict for state
        return {
            "skills_score": validated_score.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse skills scoring response as JSON: {e}")
    except Exception as e:
        logger.error(f"Skills scoring failed: {e}")
        raise


def skills_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to optimize skills section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - skills_optimization: dict - SectionOptimization for skills
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with skills_optimization key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting skills section optimization")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract skills data
    skills_data = [skill.model_dump() for skill in resume.skills]
    
    # Format current skills as text
    current_skills_text = ", ".join([skill.get("name", "") for skill in skills_data])
    if not current_skills_text:
        current_skills_text = "No skills listed"
    
    # Get the LLM
    model = get_llm(temperature=0.3, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=4000)
    
    # Build system prompt
    system_prompt = """You are an expert resume writer specializing in ATS optimization. Your task is to optimize a skills section to better match a job description.

Guidelines:
- Include all relevant skills from the job description that the candidate likely has
- Organize skills logically (technical skills, soft skills, tools, etc.)
- Use industry-standard terminology
- Prioritize skills mentioned in the JD
- Group related skills together
- Don't add skills the candidate doesn't have, but suggest relevant ones they might have
- Format as a clean, scannable list

Return a JSON object with this exact structure:
{
  "section_name": "skills",
  "original_content": "original skills list",
  "optimized_content": "optimized skills list with better organization and JD keywords",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...]
}

Return ONLY the JSON object, nothing else."""

    # Build user prompt
    user_prompt = f"""Optimize this skills section for the following job:

CURRENT SKILLS:
{current_skills_text}

JOB DESCRIPTION:
{jd_truncated}

Rewrite the skills section to better match the job description. Include relevant skills from the JD that align with the candidate's background."""

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
        logger.debug(f"Raw skills optimization response: {response_text[:200]}...")
        
        # Parse JSON
        optimization_data = json.loads(response_text)
        
        # Fix: Ensure optimized_content is a string, not a list
        if isinstance(optimization_data.get("optimized_content"), list):
            optimization_data["optimized_content"] = " ".join(optimization_data["optimized_content"])
        if isinstance(optimization_data.get("original_content"), list):
            optimization_data["original_content"] = " ".join(optimization_data["original_content"])
        
        # Validate by instantiating Pydantic model
        try:
            validated_optimization = SectionOptimization(**optimization_data)
            # Ensure section_name is correct
            validated_optimization.section_name = "skills"
            logger.info("Skills optimization successful")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(optimization_data, indent=2)}")
            raise ValueError(f"Skills optimization data failed validation: {e}")
        
        # Return as dict for state
        return {
            "skills_optimization": validated_optimization.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse skills optimization response as JSON: {e}")
    except Exception as e:
        logger.error(f"Skills optimization failed: {e}")
        raise

