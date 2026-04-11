"""
Vertex AI Agent Engine Deployment.

Deploys the LangGraph multi-agent system to Vertex AI Agent Engine
for production use.
"""

# CRITICAL: Set up Python path BEFORE any imports from src
# This ensures 'src' module is available when cloudpickle unpickles
import sys
import os
from pathlib import Path

# Set up path first (before importing bootstrap or anything from src)
def _setup_path_immediately():
    """Set up Python path immediately, before any src imports."""
    # Find backend directory
    try:
        current_file = Path(__file__).resolve()
        backend_dir = current_file.parent.parent.parent  # Go up from src/deploy/agent_engine_deploy.py
        if (backend_dir / "src").exists():
            if str(backend_dir) not in sys.path:
                sys.path.insert(0, str(backend_dir))
            return backend_dir
    except (NameError, AttributeError):
        pass
    
    # Fallback: check common paths
    for possible_path in [Path("/code"), Path("/app"), Path(os.getcwd())]:
        try:
            if (possible_path / "src").exists():
                if str(possible_path) not in sys.path:
                    sys.path.insert(0, str(possible_path))
                return possible_path
        except:
            continue
    
    return None

_setup_path_immediately()

from typing import Dict, Any, Optional
import vertexai
from vertexai import agent_engines

# Now import src modules (path should be set up)
from src.config import get_project_id, get_location, get_staging_bucket, GEMINI_MODEL_NAME
from src.graph.orchestrator import build_langgraph_app
from src.utils.logging_utils import get_logger, setup_logging

logger = get_logger(__name__)
setup_logging()


def create_agent_engine(
    display_name: str = "resume-matcher-langgraph",
    model_name: Optional[str] = None,
    temperature: float = 0.1,
    max_output_tokens: int = 2048,
) -> Any:
    """
    Create and deploy a LangGraph agent to Vertex AI Agent Engine.
    
    Args:
        display_name: Display name for the agent engine
        model_name: Model name (defaults to GEMINI_MODEL_NAME from config)
        temperature: Temperature for generation
        max_output_tokens: Maximum output tokens
    
    Returns:
        Deployed Agent Engine instance
    
    Raises:
        ValueError: If project ID is not configured
    """
    project_id = get_project_id()
    location = get_location()
    model_name = model_name or GEMINI_MODEL_NAME
    staging_bucket = get_staging_bucket()
    
    if not staging_bucket:
        raise ValueError(
            "STAGING_BUCKET environment variable must be set for deployment. "
            "This should be a Google Cloud Storage bucket (e.g., gs://your-bucket-name). "
            "Create one with: gsutil mb -p {project_id} -l {location} gs://your-bucket-name"
            .format(project_id=project_id, location=location)
        )
    
    logger.info(f"Initializing Vertex AI: project={project_id}, location={location}, staging_bucket={staging_bucket}")
    
    # Initialize Vertex AI with staging bucket
    vertexai.init(
        project=project_id,
        location=location,
        staging_bucket=staging_bucket
    )
    
    # Create a runnable builder function
    # Build the graph inside the builder to avoid serialization issues
    def runnable_builder(model: Any, **kwargs: Any) -> Any:
        """
        Builder function that returns the LangGraph app.
        
        This is called by the Agent Engine to get the runnable.
        We build the graph here to avoid capturing non-serializable objects.
        We ensure the path is set up before building the graph.
        """
        # Ensure path is set up (in case it wasn't set up during unpickling)
        import sys
        import os
        from pathlib import Path
        
        # Try to find and add backend directory to path
        backend_dir = None
        try:
            # Check if src is already importable
            import src
            return build_langgraph_app()
        except ImportError:
            pass
        
        # Try to find backend directory
        for possible_path in [
            Path("/code"),
            Path("/app"),
            Path(os.getcwd()),
            Path(os.getcwd()).parent,
        ]:
            try:
                if (possible_path / "src").exists():
                    backend_dir = possible_path
                    break
                # Also check subdirectories
                if possible_path.exists():
                    for subdir in possible_path.iterdir():
                        if subdir.is_dir() and (subdir / "src").exists():
                            backend_dir = subdir
                            break
                    if backend_dir:
                        break
            except:
                continue
        
        if backend_dir and str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))
        
        # Now build the graph (path should be set up)
        graph_app = build_langgraph_app()
        return graph_app
    
    try:
        # Create LanggraphAgent
        logger.info(f"Creating LanggraphAgent with model: {model_name}")
        agent = agent_engines.LanggraphAgent(
            model=model_name,
            runnable_builder=runnable_builder,
            model_kwargs={
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            },
        )
        
        # Deploy to Agent Engine
        logger.info(f"Deploying agent engine: {display_name}")
        
        # Specify requirements for the agent engine
        # These packages will be installed in the agent engine environment
        requirements = [
            "google-cloud-aiplatform[agent_engines]>=1.60.0",
            "langgraph>=0.2.0",
            "langchain-core>=0.3.0",
            "pydantic>=2.0.0",
            "python-dotenv>=1.0.0",
            "typing-extensions>=4.8.0",
        ]
        
        # Get the path to the backend directory to include in deployment
        # We need the parent directory so that 'src' can be imported as a module
        # The code uses 'from src.xxx import ...', so we need backend/ in the path
        current_file = Path(__file__).resolve()
        backend_dir = current_file.parent.parent.parent  # Go up from src/deploy/agent_engine_deploy.py
        src_dir = backend_dir / "src"
        
        if not src_dir.exists():
            raise ValueError(f"Source directory not found: {src_dir}")
        
        logger.info(f"Including source code from backend directory: {backend_dir}")
        logger.info(f"Source directory: {src_dir}")
        
        # Include the backend directory and important files
        # The backend directory ensures 'src' can be imported
        # We also include sitecustomize.py and __init__.py to ensure path setup
        extra_packages = [
            str(backend_dir),  # Parent directory so 'src' module is importable
        ]
        
        # Also ensure sitecustomize.py is included (it sets up path automatically)
        sitecustomize_file = backend_dir / "sitecustomize.py"
        if sitecustomize_file.exists():
            logger.info(f"Including sitecustomize.py: {sitecustomize_file}")
        
        engine = agent_engines.create(
            agent_engine=agent,  # Correct parameter name
            display_name=display_name,
            requirements=requirements,  # Pass requirements directly, not in config
            extra_packages=extra_packages,  # Include source code
        )
        
        logger.info(f"Agent Engine deployed successfully!")
        logger.info(f"Resource name: {engine.resource_name}")
        
        return engine
        
    except Exception as e:
        logger.error(f"Failed to deploy agent engine: {e}")
        raise


def call_agent_engine_locally(
    engine: Any,
    resume_text: str,
    job_description: str,
) -> Dict[str, Any]:
    """
    Call the deployed agent engine locally for testing.
    
    Args:
        engine: Deployed Agent Engine instance
        resume_text: Resume text to analyze
        job_description: Job description text
    
    Returns:
        Query response with final_score and other state data
    """
    logger.info("Calling agent engine locally...")
    
    # Prepare input state
    input_state = {
        "resume_text": resume_text,
        "job_description": job_description,
    }
    
    try:
        # Query the agent engine
        response = engine.query(input_state)
        
        logger.info("Agent engine query successful")
        return response
        
    except Exception as e:
        logger.error(f"Failed to query agent engine: {e}")
        raise


if __name__ == "__main__":
    """
    Example usage for deployment.
    
    Run with:
        python -m src.deploy.agent_engine_deploy
    """
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "deploy":
        # Deploy the agent
        try:
            engine = create_agent_engine()
            print(f"\n✅ Deployment successful!")
            print(f"Resource name: {engine.resource_name}")
            print(f"\nTo test locally, use:")
            print(f"  python -m src.deploy.agent_engine_deploy test")
        except Exception as e:
            print(f"\n❌ Deployment failed: {e}")
            sys.exit(1)
    
    elif len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test the deployed agent
        import os
        from pathlib import Path
        
        resource_name = os.getenv("VERTEX_AGENT_ENGINE_RESOURCE")
        
        if not resource_name:
            print("❌ Error: VERTEX_AGENT_ENGINE_RESOURCE not set in environment")
            print("\nTo test, set the resource name:")
            print("  export VERTEX_AGENT_ENGINE_RESOURCE='projects/YOUR_PROJECT/locations/us-central1/agentEngines/RESOURCE_ID'")
            print("  python -m src.deploy.agent_engine_deploy test")
            sys.exit(1)
        
        try:
            # Get the deployed engine
            engine = agent_engines.get_agent_engine(resource_name=resource_name)
            
            # Test with sample data
            samples_dir = Path(__file__).parent.parent.parent / "samples"
            resume_path = samples_dir / "resume.txt"
            jd_path = samples_dir / "jd.txt"
            
            if not resume_path.exists() or not jd_path.exists():
                print("❌ Error: Sample files not found")
                print(f"Expected: {resume_path} and {jd_path}")
                sys.exit(1)
            
            resume_text = resume_path.read_text()
            job_description = jd_path.read_text()
            
            print("Testing deployed agent engine...")
            print(f"Resource: {resource_name}\n")
            
            response = call_agent_engine_locally(
                engine=engine,
                resume_text=resume_text,
                job_description=job_description,
            )
            
            print("✅ Test successful!\n")
            print("Results:")
            final_score = response.get("final_score", {})
            print(f"  Overall Score: {final_score.get('overall_score', 'N/A')}/100")
            print(f"  Section Scores: {len(final_score.get('section_scores', []))}")
            print(f"  Comments: {len(final_score.get('comments', []))}")
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    
    else:
        print("Usage:")
        print("  python -m src.deploy.agent_engine_deploy deploy  # Deploy agent")
        print("  python -m src.deploy.agent_engine_deploy test    # Test agent")

