"""
Summary Optimization Agent.

Optimizes the resume summary/objective section to better match job description
requirements using ATS-optimized language, action verbs, and relevant keywords.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import SectionOptimization
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt

logger = get_logger(__name__)


def summary_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to optimize summary section.
    
    Expects in state:
        - resume_structured: dict - Structured resume data
        - job_description: str - Job description text
    
    Returns updated state with:
        - summary_optimization: dict - SectionOptimization for summary
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with summary_optimization key
    """
    resume_structured = state.get("resume_structured")
    job_description = state.get("job_description")
    
    if not resume_structured or not job_description:
        raise ValueError("resume_structured and job_description are required in state")
    
    logger.info("Starting summary section optimization")
    
    # Extract current summary from resume text (from resume_text if available)
    resume_text = state.get("resume_text", "")
    current_summary = ""
    
    if resume_text:
        # Extract from first paragraph of resume
        paragraphs = resume_text.split('\n\n')
        if paragraphs:
            current_summary = paragraphs[0][:300]  # First 300 chars
    
    if not current_summary:
        current_summary = "Experienced professional seeking new opportunities."
    
    # Get the LLM
    model = get_llm(temperature=0.3, max_output_tokens=1024)
    
    # Truncate inputs
    jd_truncated = truncate_for_prompt(job_description, max_chars=4000)
    summary_truncated = current_summary[:500] if len(current_summary) > 500 else current_summary
    
    # Build system prompt
    system_prompt = """You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization. Your task is to rewrite a resume summary/objective to better match a job description.

Guidelines:
- Use strong action verbs (e.g., "Led", "Developed", "Implemented", "Optimized")
- Include relevant keywords from the job description naturally
- Keep it concise (2-4 sentences, 50-150 words)
- Highlight relevant experience and skills
- Match the seniority level mentioned in the JD
- Use professional, confident language
- Avoid generic phrases like "hard-working" or "team player"
- Focus on quantifiable achievements when possible
- Make it specific to the role

Return a JSON object with this exact structure:
{
  "section_name": "summary",
  "original_content": "original summary text",
  "optimized_content": "optimized summary text",
  "improvements": ["improvement1", "improvement2", ...],
  "keywords_added": ["keyword1", "keyword2", ...]
}

Return ONLY the JSON object, nothing else."""

    # Build user prompt
    user_prompt = f"""Optimize this resume summary for the following job:

CURRENT SUMMARY:
{summary_truncated}

JOB DESCRIPTION:
{jd_truncated}

Rewrite the summary to better match this job description while maintaining authenticity. Include relevant keywords naturally."""

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
        logger.debug(f"Raw summary optimization response: {response_text[:200]}...")
        
        # Parse JSON
        optimization_data = json.loads(response_text)
        
        # Fix: Ensure optimized_content is a string, not a list
        if isinstance(optimization_data.get("optimized_content"), list):
            optimization_data["optimized_content"] = " ".join(optimization_data["optimized_content"])
        
        # Validate by instantiating Pydantic model
        try:
            validated_optimization = SectionOptimization(**optimization_data)
            # Ensure section_name is correct
            validated_optimization.section_name = "summary"
            logger.info("Summary optimization successful")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(optimization_data, indent=2)}")
            raise ValueError(f"Summary optimization data failed validation: {e}")
        
        # Return as dict for state
        return {
            "summary_optimization": validated_optimization.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse summary optimization response as JSON: {e}")
    except Exception as e:
        logger.error(f"Summary optimization failed: {e}")
        raise

