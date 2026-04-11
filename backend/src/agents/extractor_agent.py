"""
Extractor Agent for Resume Optimization.

Extracts clean resume text and parses job description for key requirements
including skills, responsibilities, role, seniority, and tech stack.
"""

from typing import Dict, Any
import json
import re
from src.config import get_llm
from src.utils.logging_utils import get_logger
from src.utils.text_utils import clean_resume_text, truncate_for_prompt, clean_json_response

logger = get_logger(__name__)


def extractor_optimization_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function to extract clean resume text and parse JD requirements.
    
    Expects in state:
        - resume_text: str - The raw resume text
        - job_description: str - The job description text
    
    Returns updated state with:
        - resume_text_clean: str - Cleaned resume text
        - job_key_skills: list - Key skills from JD
        - job_key_responsibilities: list - Key responsibilities from JD
        - job_role: str - Role/title from JD
        - job_seniority: str - Seniority level from JD
        - job_tech_stack: list - Technologies mentioned in JD
    
    Args:
        state: LangGraph state dictionary
    
    Returns:
        Updated state with extracted data
    """
    resume_text = state.get("resume_text")
    job_description = state.get("job_description")
    
    if not resume_text:
        raise ValueError("resume_text is required in state")
    if not job_description:
        raise ValueError("job_description is required in state")
    
    logger.info("Starting extraction for optimization")
    
    # Clean the resume text
    cleaned_resume = clean_resume_text(resume_text)
    
    # Truncate JD if needed
    jd_truncated = truncate_for_prompt(job_description, max_chars=8000)
    
    # Get the LLM
    model = get_llm(temperature=0.1, max_output_tokens=2048)
    
    # Build system prompt
    system_prompt = """You are an expert recruiter and job description parser. Extract key information from the job description to help optimize a resume.

Your task is to extract:
1. Key skills required (technical and soft skills)
2. Key responsibilities and duties
3. Job role/title
4. Seniority level (junior/mid/senior/lead/principal)
5. Technologies and tech stack mentioned

Return a JSON object with this exact structure:
{
  "jobKeySkills": ["skill1", "skill2", ...],
  "jobKeyResponsibilities": ["responsibility1", "responsibility2", ...],
  "role": "Job Title",
  "seniority": "junior|mid|senior|lead|principal",
  "techStack": ["tech1", "tech2", ...]
}

Be thorough and extract all relevant information. Return ONLY the JSON object, nothing else."""

    # Build user prompt
    user_prompt = f"""Extract key requirements from this job description:

{jd_truncated}

Return a JSON object with the structure specified above."""

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
        logger.debug(f"Raw extraction response: {response_text[:200]}...")
        
        # Clean the JSON response before parsing
        cleaned_json = clean_json_response(response_text)
        logger.debug(f"Cleaned JSON: {cleaned_json[:200]}...")
        
        # Parse JSON with multiple fallback strategies
        extracted_data = None
        parse_error = None
        
        # Strategy 1: Try parsing the cleaned JSON as-is
        try:
            extracted_data = json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            parse_error = e
            logger.warning(f"Initial JSON parse failed: {e}")
            
            # Strategy 2: More aggressive cleaning - remove any non-ASCII characters outside strings
            try:
                # Remove any characters that aren't valid JSON outside of strings
                more_cleaned = []
                in_str = False
                escape = False
                for char in cleaned_json:
                    if escape:
                        more_cleaned.append(char)
                        escape = False
                        continue
                    if char == '\\':
                        escape = True
                        more_cleaned.append(char)
                        continue
                    if char == '"':
                        in_str = not in_str
                        more_cleaned.append(char)
                        continue
                    if in_str:
                        more_cleaned.append(char)
                    else:
                        # Outside string: only allow ASCII printable JSON chars
                        if ord(char) < 128 and (char.isprintable() or char in '\n\t\r'):
                            more_cleaned.append(char)
                
                more_cleaned_str = ''.join(more_cleaned)
                # Remove trailing commas
                more_cleaned_str = re.sub(r',(\s*[}\]])', r'\1', more_cleaned_str)
                # Find last valid }
                last_brace = more_cleaned_str.rfind('}')
                if last_brace > 0:
                    more_cleaned_str = more_cleaned_str[:last_brace + 1]
                
                extracted_data = json.loads(more_cleaned_str)
                logger.info("Successfully parsed JSON after aggressive ASCII-only cleaning")
            except (json.JSONDecodeError, Exception) as e2:
                logger.warning(f"Aggressive cleaning also failed: {e2}")
                
                # Strategy 3: Try to extract just the JSON object by finding matching braces
                try:
                    # Find first { and last matching }
                    first_brace = cleaned_json.find('{')
                    if first_brace >= 0:
                        brace_count = 0
                        last_brace = -1
                        in_str = False
                        escape = False
                        for i in range(first_brace, len(cleaned_json)):
                            char = cleaned_json[i]
                            if escape:
                                escape = False
                                continue
                            if char == '\\':
                                escape = True
                                continue
                            if char == '"':
                                in_str = not in_str
                                continue
                            if not in_str:
                                if char == '{':
                                    brace_count += 1
                                elif char == '}':
                                    brace_count -= 1
                                    if brace_count == 0:
                                        last_brace = i
                                        break
                        
                        if last_brace > first_brace:
                            final_json = cleaned_json[first_brace:last_brace + 1]
                            # Remove any stray characters before brackets/braces
                            final_json = re.sub(r'(["\w])\s+[^\s"\[\]{},:\w\-_\.]+\s*([\]}])', r'\1\2', final_json)
                            final_json = re.sub(r',(\s*[}\]])', r'\1', final_json)
                            extracted_data = json.loads(final_json)
                            logger.info("Successfully parsed JSON after brace matching extraction")
                        else:
                            raise ValueError(f"Could not find matching braces: {parse_error}")
                    else:
                        raise ValueError(f"No opening brace found: {parse_error}")
                except (json.JSONDecodeError, Exception) as e3:
                    logger.error(f"All JSON parsing strategies failed. Last error: {e3}")
                    logger.error(f"Original response: {response_text[:500]}")
                    logger.error(f"Cleaned JSON: {cleaned_json[:500]}")
                    raise ValueError(f"Failed to parse extraction response as JSON after all strategies: {parse_error}")
        
        if extracted_data is None:
            raise ValueError("Failed to extract JSON data")
        
        # Validate required fields
        required_fields = ["jobKeySkills", "jobKeyResponsibilities", "role", "seniority", "techStack"]
        for field in required_fields:
            if field not in extracted_data:
                logger.warning(f"Missing field {field} in extraction, using defaults")
                if field == "jobKeySkills":
                    extracted_data[field] = []
                elif field == "jobKeyResponsibilities":
                    extracted_data[field] = []
                elif field == "techStack":
                    extracted_data[field] = []
                elif field == "role":
                    extracted_data[field] = "Unknown"
                elif field == "seniority":
                    extracted_data[field] = "mid"
        
        logger.info(f"Extraction successful: role={extracted_data.get('role')}, seniority={extracted_data.get('seniority')}")
        
        # Return as dict for state
        return {
            "resume_text_clean": cleaned_resume,
            "job_key_skills": extracted_data.get("jobKeySkills", []),
            "job_key_responsibilities": extracted_data.get("jobKeyResponsibilities", []),
            "job_role": extracted_data.get("role", "Unknown"),
            "job_seniority": extracted_data.get("seniority", "mid"),
            "job_tech_stack": extracted_data.get("techStack", []),
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response text: {response_text}")
        raise ValueError(f"Failed to parse extraction response as JSON: {e}")
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise

