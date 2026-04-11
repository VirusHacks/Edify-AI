"""
Configuration module for Vertex AI and LangGraph setup.

Reads environment variables and provides helpers to initialize
Vertex AI generative model clients compatible with LangGraph.
"""

import os
from typing import Optional
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account

# Load environment variables
load_dotenv()

# Environment variables
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
VERTEX_AI_LOCATION = os.getenv("VERTEX_AI_LOCATION", "us-central1")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
STAGING_BUCKET = os.getenv("STAGING_BUCKET")  # GCS bucket for staging files (e.g., gs://bucket-name)

# Initialize Vertex AI with credentials if provided
if GOOGLE_CLOUD_PROJECT:
    if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
        # Use service account key file
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_APPLICATION_CREDENTIALS
        )
        vertexai.init(
            project=GOOGLE_CLOUD_PROJECT,
            location=VERTEX_AI_LOCATION,
            credentials=credentials
        )
    else:
        # Use Application Default Credentials (requires gcloud auth)
        vertexai.init(project=GOOGLE_CLOUD_PROJECT, location=VERTEX_AI_LOCATION)


def get_llm(
    model_name: Optional[str] = None,
    temperature: float = 0.1,
    max_output_tokens: int = 2048,
) -> GenerativeModel:
    """
    Get a Vertex AI GenerativeModel instance compatible with LangGraph.
    
    Args:
        model_name: Model name (defaults to GEMINI_MODEL_NAME from env)
        temperature: Temperature for generation (default: 0.1)
        max_output_tokens: Maximum output tokens (default: 2048)
    
    Returns:
        GenerativeModel instance configured for structured output
    
    Raises:
        ValueError: If GOOGLE_CLOUD_PROJECT is not set
    """
    if not GOOGLE_CLOUD_PROJECT:
        raise ValueError(
            "GOOGLE_CLOUD_PROJECT environment variable must be set. "
            "Please set it in your .env file or environment."
        )
    
    model_name = model_name or GEMINI_MODEL_NAME
    
    return GenerativeModel(
        model_name=model_name,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )


def get_project_id() -> str:
    """Get the Google Cloud project ID."""
    if not GOOGLE_CLOUD_PROJECT:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable must be set")
    return GOOGLE_CLOUD_PROJECT


def get_location() -> str:
    """Get the Vertex AI location."""
    return VERTEX_AI_LOCATION


def get_staging_bucket() -> Optional[str]:
    """Get the staging bucket for Vertex AI deployments."""
    return STAGING_BUCKET

