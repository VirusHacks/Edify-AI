"""
Local testing entrypoint for the LangGraph multi-agent system.

Tests the system without deploying to Vertex AI Agent Engine.
"""

import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from src.graph.orchestrator import build_langgraph_app
from src.utils.logging_utils import setup_logging, get_logger
from src.models.schemas import FinalScore

# Load environment variables
load_dotenv()

# Setup logging
setup_logging("INFO")
logger = get_logger(__name__)


def main():
    """Main function to run local testing."""
    # Get file paths from command line or use defaults
    if len(sys.argv) >= 3:
        resume_path = sys.argv[1]
        jd_path = sys.argv[2]
    else:
        # Default to samples directory
        samples_dir = Path(__file__).parent / "samples"
        resume_path = samples_dir / "resume.txt"
        jd_path = samples_dir / "jd.txt"
        
        if not resume_path.exists() or not jd_path.exists():
            print("Usage: python main_local_test.py [resume.txt] [jd.txt]")
            print("\nOr create sample files in the samples/ directory:")
            print(f"  - {resume_path}")
            print(f"  - {jd_path}")
            sys.exit(1)
    
    # Read files
    try:
        logger.info(f"Reading resume from: {resume_path}")
        with open(resume_path, "r", encoding="utf-8") as f:
            resume_text = f.read()
        
        logger.info(f"Reading job description from: {jd_path}")
        with open(jd_path, "r", encoding="utf-8") as f:
            job_description = f.read()
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to read files: {e}")
        sys.exit(1)
    
    # Build the LangGraph app
    logger.info("Building LangGraph application...")
    try:
        app = build_langgraph_app()
    except Exception as e:
        logger.error(f"Failed to build LangGraph app: {e}")
        sys.exit(1)
    
    # Prepare initial state
    initial_state = {
        "resume_text": resume_text,
        "job_description": job_description,
    }
    
    # Invoke the graph
    logger.info("Invoking LangGraph application...")
    try:
        result = app.invoke(initial_state)
        
        # Extract and display final score
        final_score_dict = result.get("final_score")
        if final_score_dict:
            final_score = FinalScore(**final_score_dict)
            
            print("\n" + "=" * 80)
            print("RESUME MATCHING RESULTS")
            print("=" * 80)
            print(f"\nOverall Score: {final_score.overall_score}/100")
            
            print("\nSection Scores:")
            print("-" * 80)
            for section_score in final_score.section_scores:
                print(f"\n{section_score.section_name.upper()}: {section_score.score}/100")
                if section_score.reasons:
                    print("  Reasons:")
                    for reason in section_score.reasons:
                        print(f"    • {reason}")
                if section_score.missing_requirements:
                    print("  Missing Requirements:")
                    for missing in section_score.missing_requirements:
                        print(f"    - {missing}")
            
            print("\n" + "-" * 80)
            print("Overall Comments:")
            for comment in final_score.comments:
                print(f"  • {comment}")
            
            print("\n" + "=" * 80)
            
            # Also print as JSON for programmatic use
            print("\nJSON Output:")
            print(json.dumps(final_score.model_dump(), indent=2))
            
        else:
            logger.warning("No final_score found in result")
            print("\nResult keys:", list(result.keys()))
            print("\nFull result:")
            print(json.dumps(result, indent=2, default=str))
        
        logger.info("Test completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to invoke LangGraph app: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

