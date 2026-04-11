"""
Text processing utilities for resume and job description handling.
"""

import re
import json
from typing import Optional


def normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace in text by collapsing multiple spaces/newlines.
    
    Args:
        text: Input text
    
    Returns:
        Text with normalized whitespace
    """
    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    # Strip leading/trailing whitespace
    return text.strip()


def truncate_for_prompt(text: str, max_chars: int = 10000) -> str:
    """
    Truncate text to fit within token/character limits for prompts.
    
    Args:
        text: Input text to truncate
        max_chars: Maximum characters (default: 10000)
    
    Returns:
        Truncated text with ellipsis if needed
    """
    if len(text) <= max_chars:
        return text
    
    # Truncate and add ellipsis
    truncated = text[:max_chars - 3]
    # Try to break at word boundary
    last_space = truncated.rfind(' ')
    if last_space > max_chars * 0.9:  # If we're close to the end
        truncated = truncated[:last_space]
    
    return truncated + "..."


def clean_resume_text(text: str) -> str:
    """
    Clean and normalize resume text for processing.
    
    Args:
        text: Raw resume text
    
    Returns:
        Cleaned resume text
    """
    # Normalize whitespace
    text = normalize_whitespace(text)
    # Remove excessive line breaks but preserve structure
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def clean_json_response(text: str) -> str:
    """
    Clean and extract JSON from LLM response text.
    Handles markdown code blocks, extra characters, and malformed JSON.
    
    Args:
        text: Raw response text that should contain JSON
    
    Returns:
        Cleaned JSON string ready for parsing
    """
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    # Try to extract JSON object using regex
    # Look for content between first { and last }
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        text = json_match.group(0)
    
    # Remove stray characters that appear before closing brackets/braces
    # Pattern 1: quote, whitespace, stray char(s), closing bracket
    # Example: "value"\n  腮] -> "value"\n]
    text = re.sub(r'(")\s*[^\s"\[\]{},:\w\-_\.]+\s*([\]}])', r'\1\2', text)
    # Pattern 2: word/quote, whitespace, stray char(s), closing bracket  
    # Example: Concepts\n  腮] -> Concepts\n]
    text = re.sub(r'(["\w])\s+[^\s"\[\]{},:\w\-_\.]+\s*([\]}])', r'\1\2', text)
    
    # More aggressive: remove any non-ASCII, non-JSON characters outside of strings
    # We'll do this by processing character by character while tracking string state
    cleaned = []
    in_string = False
    escape_next = False
    
    for i, char in enumerate(text):
        if escape_next:
            cleaned.append(char)
            escape_next = False
            continue
        
        if char == '\\':
            escape_next = True
            cleaned.append(char)
            continue
        
        if char == '"':
            in_string = not in_string
            cleaned.append(char)
            continue
        
        if in_string:
            # Inside string: keep all characters
            cleaned.append(char)
            continue
        
        # Outside string: filter invalid characters
        # Allow: JSON structure chars, whitespace, alphanumeric, and common JSON value chars
        if (char in ['{', '}', '[', ']', ',', ':', ' ', '\n', '\t', '\r'] or
            char.isalnum() or 
            char in ['-', '_', '.', '+', 'E', 'e', 't', 'r', 'u', 'f', 'a', 'l', 's', 'n', 'N']):
            cleaned.append(char)
        # Skip everything else (stray Unicode characters, etc.)
    
    text = ''.join(cleaned)
    
    # Fix common JSON issues
    # Remove trailing commas before closing brackets/braces
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    
    # Find the last valid closing brace to remove any trailing garbage
    brace_count = 0
    bracket_count = 0
    last_valid_pos = -1
    in_string = False
    escape_next = False
    
    for i, char in enumerate(text):
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        if not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and bracket_count == 0:
                    last_valid_pos = i
                    break
            elif char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
    
    # If we found a valid closing position, truncate everything after it
    if last_valid_pos > 0:
        text = text[:last_valid_pos + 1]
    
    return text.strip()

