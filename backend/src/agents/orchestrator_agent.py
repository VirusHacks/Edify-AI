"""
Orchestrator Agent for Resume Optimization.

Analyzes job description emphasis and assigns dynamic weights to section agents.
Determines which sections (skills, experience, projects, education, summary) 
should receive more focus based on the job description.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.utils.logging_utils import get_logger
from src.utils.text_utils import truncate_for_prompt

logger = get_logger(__name__)


def orchestrator_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to analyze JD and assign section weights.
    
    Expects in state:
        - job_description: str - The job description text
        - job_key_skills: list - Key skills from JD
        - job_key_responsibilities: list - Key responsibilities from JD
        - job_role: str - Role/title from JD
        - job_seniority: str - Seniority level from JD
    
    Returns updated state with:
        - section_weights: dict - Weights for each section (must sum to 1.0)
        - focus_areas: list - Areas that need most attention
        - optimization_strategy: str - Overall strategy description
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with weights and strategy
    """
    job_description = state.get("job_description")
    job_key_skills = state.get("job_key_skills", [])
    job_key_responsibilities = state.get("job_key_responsibilities", [])
    job_role = state.get("job_role", "Unknown")
    job_seniority = state.get("job_seniority", "mid")
    
    if not job_description:
        raise ValueError("job_description is required in state")
    
    logger.info("Starting orchestrator analysis")
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Build system prompt
    system_prompt = """You are an expert resume optimization strategist. Analyze a job description and determine which resume sections should receive the most emphasis.

You need to assign weights to these sections:
- summary: Professional summary/objective
- skills: Technical and soft skills
- experience: Work experience and responsibilities
- projects: Personal or professional projects
- education: Educational background

The weights must sum to 1.0 (100%).

Consider:
- If JD emphasizes specific technologies → increase skills weight
- If JD emphasizes years of experience or responsibilities → increase experience weight
- If JD emphasizes projects or portfolios → increase projects weight
- If JD requires specific degrees/certifications → increase education weight
- Summary should always have some weight (0.05-0.15)

Return a JSON object with this exact structure:
{
  "sectionWeights": {
    "summary": 0.10,
    "skills": 0.35,
    "experience": 0.35,
    "projects": 0.15,
    "education": 0.05
  },
  "focusAreas": ["area1", "area2", ...],
  "optimizationStrategy": "Brief description of optimization approach"
}

The weights MUST sum to exactly 1.0. Return ONLY the JSON object, nothing else."""

    # Build user prompt
    user_prompt = f"""Analyze this job description and assign section weights:

JOB DESCRIPTION:
{jd_truncated}

EXTRACTED KEY DATA:
- Role: {job_role}
- Seniority: {job_seniority}
- Key Skills: {', '.join(job_key_skills[:10]) if job_key_skills else 'Not specified'}
- Key Responsibilities: {', '.join(job_key_responsibilities[:5]) if job_key_responsibilities else 'Not specified'}

Determine which sections should receive the most emphasis and assign weights accordingly."""

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
        logger.debug(f"Raw orchestrator response: {response_text[:200]}...")
        
        # Parse JSON
        strategy_data = json.loads(response_text)
        
        # Validate and normalize weights
        section_weights = strategy_data.get("sectionWeights", {})
        
        # Ensure all sections have weights
        default_weights = {
            "summary": 0.10,
            "skills": 0.30,
            "experience": 0.35,
            "projects": 0.15,
            "education": 0.10,
        }
        
        for section in ["summary", "skills", "experience", "projects", "education"]:
            if section not in section_weights:
                section_weights[section] = default_weights[section]
        
        # Normalize weights to sum to 1.0
        total_weight = sum(section_weights.values())
        if total_weight > 0:
            section_weights = {k: v / total_weight for k, v in section_weights.items()}
        else:
            section_weights = default_weights
        
        # Validate sum is close to 1.0
        weight_sum = sum(section_weights.values())
        if abs(weight_sum - 1.0) > 0.01:
            logger.warning(f"Weights sum to {weight_sum}, normalizing...")
            section_weights = {k: v / weight_sum for k, v in section_weights.items()}
        
        focus_areas = strategy_data.get("focusAreas", [])
        optimization_strategy = strategy_data.get("optimizationStrategy", "General optimization based on job requirements")
        
        logger.info(f"Orchestrator analysis complete: weights={section_weights}, focus={focus_areas}")
        
        # Return as dict for state
        return {
            "section_weights": section_weights,
            "focus_areas": focus_areas,
            "optimization_strategy": optimization_strategy,
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse orchestrator response as JSON: {e}")
    except Exception as e:
        logger.error(f"Orchestrator analysis failed: {e}")
        raise

