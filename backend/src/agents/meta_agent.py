"""
Meta Information Scoring Agent.

Scores how well the candidate's metadata (seniority, domains, languages) matches the job description.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import SectionScore, ResumeStructured
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt
from src.utils.schema_utils import clean_schema_for_vertex_ai

logger = get_logger(__name__)


def meta_scoring_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to score meta information section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - meta_score: dict - SectionScore for meta information
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with meta_score key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting meta information section scoring")
    
    # Parse resume structured data
    try:
        resume = ResumeStructured(**resume_structured)
    except Exception as e:
        logger.error(f"Failed to parse resume_structured: {e}")
        raise ValueError(f"Invalid resume_structured data: {e}")
    
    # Extract meta data
    meta_data = resume.meta.model_dump()
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Build system prompt
    system_prompt = """You are an expert technical recruiter. You score the candidate's META INFORMATION (seniority level, domains, languages) against the job description for a specific dimension.

Scoring Rules (0-100):
- 90-100: Strong match. Candidate's seniority level, domain experience, and languages align well with job requirements.
- 60-89: Partial match. Candidate has some alignment in seniority, domains, or languages but may have gaps.
- 30-59: Weak match. Candidate's meta information doesn't align well with job requirements.
- 0-29: Almost no alignment. Candidate's seniority, domains, or languages don't match job requirements.

Return a JSON object strictly matching the provided schema with:
- section_name: "meta"
- score: numeric score 0-100
- reasons: list of specific reasons for the score (what matches, what's good)
- missing_requirements: list of meta requirements missing (e.g., specific seniority level, domain experience, language requirements)"""

    # Build user prompt
    user_prompt = f"""Score the candidate's meta information against this job description:

JOB DESCRIPTION:
{jd_truncated}

CANDIDATE META INFORMATION:
{json.dumps(meta_data, indent=2)}

Analyze how well the candidate's seniority level, domain experience, and languages match the job requirements and provide a detailed score with reasons.

Return a JSON object with this exact structure:
{{
  "section_name": "meta",
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
        logger.debug(f"Raw meta scoring response: {response_text[:200]}...")
        
        # Parse JSON
        score_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_score = SectionScore(**score_data)
            # Ensure section_name is correct
            validated_score.section_name = "meta"
            logger.info(f"Meta scoring successful: {validated_score.score}/100")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(score_data, indent=2)}")
            raise ValueError(f"Meta score data failed validation: {e}")
        
        # Return as dict for state
        return {
            "meta_score": validated_score.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse meta scoring response as JSON: {e}")
    except Exception as e:
        logger.error(f"Meta scoring failed: {e}")
        raise

