"""
Setup script for the resume matching backend package.

This installs the 'src' module as a proper Python package,
making it importable in the deployed environment.
"""
from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

setup(
    name="resume-matcher-backend",
    version="0.1.0",
    description="Multi-agent resume-JD matching system using LangGraph and Vertex AI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Your Name",
    author_email="your.email@example.com",
    packages=find_packages(include=["src", "src.*"]),
    python_requires=">=3.9,<3.14",
    install_requires=[
        "google-cloud-aiplatform[agent_engines]>=1.60.0",
        "langgraph>=0.2.0",
        "langchain-core>=0.3.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
        "typing-extensions>=4.8.0",
    ],
    package_dir={"": "."},  # Root directory contains src/
    include_package_data=True,
)

