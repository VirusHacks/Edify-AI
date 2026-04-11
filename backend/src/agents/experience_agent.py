"""
Experience Scoring Agent.

Scores how well the candidate's work experience matches the job description requirements.
"""

from typing import Dict, Any, List
import json
from src.config import get_llm
from src.models.schemas import SectionScore, ResumeStructured, SectionOptimization
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt
from src.utils.schema_utils import clean_schema_for_vertex_ai

logger = get_logger(__name__)


def experience_scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to score experience section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - experience_score: dict - SectionScore for experience
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with experience_score key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting experience section scoring")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract experience data
    experience_data = [exp.model_dump() for exp in resume.experience]
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Build system prompt
    system_prompt = """You are an expert technical recruiter. You score the candidate's WORK EXPERIENCE section against the job description for a specific dimension.

Scoring Rules (0-100):
- 90-100: Strong match. Candidate has relevant experience in similar roles, industries, or with required technologies. Experience duration and depth align well.
- 60-89: Partial match. Candidate has some relevant experience but may lack specific industry experience, role level, or key responsibilities.
- 30-59: Weak match. Candidate has limited relevant experience or experience in different domains/roles.
- 0-29: Almost no alignment. Candidate lacks relevant work experience.

Return a JSON object strictly matching the provided schema with:
- section_name: "experience"
- score: numeric score 0-100
- reasons: list of specific reasons for the score (what matches, what's good)
- missing_requirements: list of experience requirements missing (e.g., specific roles, industries, years of experience)"""

    # Build user prompt
    user_prompt = f"""Score the candidate's work experience against this job description:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE EXPERIENCE:
{json.dumps(experience_data, indent=2)}

Analyze how well the candidate's work experience matches the job requirements and provide a detailed score with reasons.

Return a JSON object with this exact structure:
{{
  "section_name": "experience",
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
        logger.debug(f"Raw experience scoring response: {response_text[:200]}...")
        
        # Parse JSON
        score_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_score = SectionScore(**score_data)
            # Ensure section_name is correct
            validated_score.section_name = "experience"
            logger.info(f"Experience scoring successful: {validated_score.score}/100")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(score_data, indent=2)}")
            raise ValueError(f"Experience score data failed validation: {e}")
        
        # Return as dict for state
        return {
            "experience_score": validated_score.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse experience scoring response as JSON: {e}")
    except Exception as e:
        logger.error(f"Experience scoring failed: {e}")
        raise


def experience_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to optimize experience section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - experience_optimizations: list - List of SectionOptimization for each experience entry
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with experience_optimizations key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting experience section optimization")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract experience data
    experience_data = [exp.model_dump() for exp in resume.experience]
    
    if not experience_data:
        logger.warning("No experience data found, returning empty optimizations")
        return {"experience_optimizations": []}
    
    # Get the LLM
    model = get_llm(temperature=0.3, max_output_tokens=4096)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=4000)
    
    # Build system prompt
    system_prompt = """You are an expert resume writer specializing in ATS optimization. Your task is to rewrite work experience entries to better match a job description.

Guidelines:
- Use strong action verbs (Led, Developed, Implemented, Optimized, Increased, Reduced, etc.)
- Include quantifiable metrics and achievements (numbers, percentages, scale)
- Incorporate relevant keywords from the job description naturally
- Match responsibilities to those mentioned in the JD
- Keep professional tone and authenticity
- Focus on impact and results, not just duties
- Each bullet point should be concise (1-2 lines)
- Prioritize most relevant experiences

Return a JSON array where each object has this structure:
{
  "section_name": "experience",
  "original_content": "original job title, company, dates, and responsibilities",
  "optimized_content": "optimized version with better action verbs and keywords",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...]
}

Return ONLY the JSON array, nothing else."""

    # Build user prompt
    user_prompt = f"""Optimize these work experience entries for the following job:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE EXPERIENCE:
{json.dumps(experience_data, indent=2)}

Rewrite each experience entry to better match the job description. Optimize the responsibilities/bullet points with action verbs, metrics, and relevant keywords."""

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
        logger.debug(f"Raw experience optimization response: {response_text[:300]}...")
        
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
                validated.section_name = "experience"
                validated_optimizations.append(validated)
            except Exception as e:
                logger.warning(f"Failed to validate experience optimization {idx}: {e}")
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
                        section_name="experience",
                        original_content=original_content,
                        optimized_content=optimized_content,
                        improvements=opt_data.get("improvements", []),
                        keywords_added=opt_data.get("keywords_added", [])
                    )
                    validated_optimizations.append(fallback)
        
        logger.info(f"Experience optimization successful: {len(validated_optimizations)} entries optimized")
        
        # Return as dict for state
        return {
            "experience_optimizations": [opt.model_dump() for opt in validated_optimizations]
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse experience optimization response as JSON: {e}")
    except Exception as e:
        logger.error(f"Experience optimization failed: {e}")
        raise

