"""
Resume Extraction Agent.

Extracts structured information from resume text using Vertex AI
with structured output to populate ResumeStructured schema.
"""

from typing import Dict, Any
import json
from src.config import get_llm
from src.models.schemas import ResumeStructured
from src.utils.logging_utils import get_logger
from src.utils.text_utils import clean_resume_text

logger = get_logger(__name__)


def extract_resume_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to extract structured resume data.
    
    Expects in state:
        - resume_text: str - The raw resume text
    
    Returns updated state with:
        - resume_structured: dict - Structured resume data compatible with ResumeStructured
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with resume_structured key
    """
    resume_text = state.get("resume_text")
    if not resume_text:
        raise ValueError("resume_text is required in state")
    
    logger.info("Starting resume extraction")
    
    # Clean the resume text
    cleaned_text = clean_resume_text(resume_text)
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=4096)
    
    # Get JSON schema from Pydantic model for prompt description
    raw_schema = ResumeStructured.model_json_schema()
    
    # Build system prompt with schema description
    system_prompt = """You are a resume parsing assistant. Extract information from the resume and populate the JSON schema fields accurately.

Rules:
- Extract all available information from the resume text
- If a field is not present in the resume, use null or empty list/string as appropriate
- For dates, preserve the format as written in the resume
- For skills, extract the skill name and infer level if possible (beginner/intermediate/expert)
- For experience, extract all job positions with their details
- For education, extract all degrees and certifications
- For projects, extract all projects mentioned
- Do not fabricate or infer information that is not explicitly stated
- Ignore any PII outside of the resume context
- Be precise and accurate in extraction
- Return ONLY valid JSON, no markdown, no code blocks, no explanatory text"""

    # Build user prompt with schema structure
    user_prompt = f"""Extract structured information from the following resume:

{cleaned_text}

Return a JSON object with this exact structure:
{{
  "contact_info": {{
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null"
  }},
  "skills": [
    {{
      "name": "string",
      "level": "string or null (beginner/intermediate/expert)",
      "years_experience": "number or null"
    }}
  ],
  "experience": [
    {{
      "job_title": "string or null",
      "company": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "is_current": "boolean or null",
      "responsibilities": ["string"]
    }}
  ],
  "education": [
    {{
      "degree": "string or null",
      "field_of_study": "string or null",
      "institution": "string or null",
      "start_date": "string or null",
      "end_date": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string or null",
      "description": "string or null",
      "technologies": ["string"],
      "impact": "string or null"
    }}
  ],
  "meta": {{
    "seniority_level": "string or null (junior/mid/senior)",
    "domains": ["string"],
    "languages": ["string"]
  }}
}}

Return ONLY the JSON object, nothing else."""

    try:
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        # Call Vertex AI with JSON output (no schema to avoid proto issues)
        response = model.generate_content(
            full_prompt,
            generation_config={
                "response_mime_type": "application/json",
            }
        )
        
        # Parse the JSON response
        response_text = response.text
        logger.debug(f"Raw extraction response: {response_text[:200]}...")
        
        # Parse JSON
        resume_data = json.loads(response_text)
        
        # Validate by instantiating Pydantic model
        try:
            validated_resume = ResumeStructured(**resume_data)
            logger.info("Resume extraction successful and validated")
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            logger.error(f"Invalid data: {json.dumps(resume_data, indent=2)}")
            raise ValueError(f"Extracted resume data failed validation: {e}")
        
        # Return as dict for state
        return {
            "resume_structured": validated_resume.model_dump()
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse extraction response as JSON: {e}")
    except Exception as e:
        logger.error(f"Resume extraction failed: {e}")
        raise

