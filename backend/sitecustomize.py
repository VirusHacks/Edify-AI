"""
Site customization module.

This module is automatically imported by Python when it starts.
It sets up the Python path to ensure 'src' module is available.

This is critical for Vertex AI Agent Engine deployment where cloudpickle
needs to unpickle objects that reference 'src' modules.
"""
import sys
import os
from pathlib import Path

def _setup_path():
    """Add backend directory to Python path."""
    # Try to find the backend directory
    backend_dir = None
    
    # Strategy 1: Check current working directory
    try:
        cwd = Path(os.getcwd())
        if (cwd / "src").exists():
            backend_dir = cwd
        elif (cwd.parent / "src").exists():
            backend_dir = cwd.parent
    except:
        pass
    
    # Strategy 2: Check common deployment paths
    if backend_dir is None:
        for possible_path in ["/code", "/app", "/workspace", "/tmp"]:
            try:
                test_path = Path(possible_path)
                if (test_path / "src").exists():
                    backend_dir = test_path
                    break
                # Check subdirectories
                for subdir in test_path.iterdir():
                    if subdir.is_dir() and (subdir / "src").exists():
                        backend_dir = subdir
                        break
                if backend_dir:
                    break
            except:
                continue
    
    if backend_dir and (backend_dir / "src").exists():
        if str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))

# Set up path when this module is imported
_setup_path()

