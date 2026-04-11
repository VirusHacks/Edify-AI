"""
Education Scoring Agent.

Scores how well the candidate's education matches the job description requirements.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import SectionScore, ResumeStructured, SectionOptimization
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt
from src.utils.schema_utils import clean_schema_for_vertex_ai

logger = get_logger(__name__)


def education_scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to score education section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - education_score: dict - SectionScore for education
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with education_score key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting education section scoring")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract education data
    education_data = [edu.model_dump() for edu in resume.education]
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Build system prompt
    system_prompt = """You are an expert technical recruiter. You score the candidate's EDUCATION section against the job description for a specific dimension.

Scoring Rules (0-100):
- 90-100: Strong match. Candidate has required degree, field of study, or equivalent qualifications. Education aligns perfectly with job requirements.
- 60-89: Partial match. Candidate has relevant education but may lack specific degree level, field, or prestigious institution requirements.
- 30-59: Weak match. Candidate has some education but significant gaps in required qualifications or field of study.
- 0-29: Almost no alignment. Candidate lacks required educational qualifications.

Note: For many technical roles, relevant experience can compensate for education gaps. Consider this in scoring.

Return a JSON object strictly matching the provided schema with:
- section_name: "education"
- score: numeric score 0-100
- reasons: list of specific reasons for the score (what matches, what's good)
- missing_requirements: list of education requirements missing (e.g., specific degree, field of study, institution level)"""

    # Build user prompt
    user_prompt = f"""Score the candidate's education against this job description:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE EDUCATION:
{json.dumps(education_data, indent=2)}

Analyze how well the candidate's education matches the job requirements and provide a detailed score with reasons.

Return a JSON object with this exact structure:
{{
  "section_name": "education",
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
        logger.debug(f"Raw education scoring response: {response_text[:200]}...")
        
        # Parse JSON
        score_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_score = SectionScore(**score_data)
            # Ensure section_name is correct
            validated_score.section_name = "education"
            logger.info(f"Education scoring successful: {validated_score.score}/100")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(score_data, indent=2)}")
            raise ValueError(f"Education score data failed validation: {e}")
        
        # Return as dict for state
        return {
            "education_score": validated_score.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse education scoring response as JSON: {e}")
    except Exception as e:
        logger.error(f"Education scoring failed: {e}")
        raise


def education_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to optimize education section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - education_optimizations: list - List of SectionOptimization for each education entry
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with education_optimizations key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting education section optimization")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract education data
    education_data = [edu.model_dump() for edu in resume.education]
    
    if not education_data:
        logger.warning("No education data found, returning empty optimizations")
        return {"education_optimizations": []}
    
    # Get the LLM
    model = get_llm(temperature=0.3, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=4000)
    
    # Build system prompt
    system_prompt = """You are an expert resume writer specializing in ATS optimization. Your task is to optimize education entries to better match a job description.

Guidelines:
- Highlight relevant coursework, honors, or achievements if they match the JD
- Emphasize degree and field of study relevance
- Include GPA if it's strong (3.5+) and relevant
- Format consistently and professionally
- Don't fabricate information, but emphasize what's relevant
- For technical roles, emphasize technical degrees and coursework

Return a JSON array where each object has this structure:
{
  "section_name": "education",
  "original_content": "original degree, institution, dates, and details",
  "optimized_content": "optimized version emphasizing relevance to JD",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...]
}

Return ONLY the JSON array, nothing else."""

    # Build user prompt
    user_prompt = f"""Optimize these education entries for the following job:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE EDUCATION:
{json.dumps(education_data, indent=2)}

Rewrite each education entry to better match the job description. Emphasize relevant degrees, coursework, and achievements."""

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
        logger.debug(f"Raw education optimization response: {response_text[:300]}...")
        
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
                validated.section_name = "education"
                validated_optimizations.append(validated)
            except Exception as e:
                logger.warning(f"Failed to validate education optimization {idx}: {e}")
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
                        section_name="education",
                        original_content=original_content,
                        optimized_content=optimized_content,
                        improvements=opt_data.get("improvements", []),
                        keywords_added=opt_data.get("keywords_added", [])
                    )
                    validated_optimizations.append(fallback)
        
        logger.info(f"Education optimization successful: {len(validated_optimizations)} entries optimized")
        
        # Return as dict for state
        return {
            "education_optimizations": [opt.model_dump() for opt in validated_optimizations]
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse education optimization response as JSON: {e}")
    except Exception as e:
        logger.error(f"Education optimization failed: {e}")
        raise

