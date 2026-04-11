"""
Bootstrap module to set up Python path before any imports.

This module must be imported first to ensure 'src' module is available.
It sets up sys.path before any other imports happen.

This is critical for Vertex AI Agent Engine deployment where cloudpickle
unpickles objects that reference 'src' modules.
"""
import sys
import os
from pathlib import Path

# Set up path before any other imports
def _setup_path():
    """Add backend directory to Python path."""
    # Try multiple strategies to find the backend directory
    backend_dir = None
    
    # Strategy 1: Use __file__ if available (when running locally or in deployed env)
    try:
        current_file = Path(__file__).resolve()
        # Go up from src/deploy/bootstrap.py to backend/
        backend_dir = current_file.parent.parent.parent
        if (backend_dir / "src").exists():
            if str(backend_dir) not in sys.path:
                sys.path.insert(0, str(backend_dir))
            return backend_dir
    except (NameError, AttributeError):
        pass
    
    # Strategy 2: Check current working directory
    try:
        cwd = Path(os.getcwd())
        if (cwd / "src").exists():
            backend_dir = cwd
        elif (cwd.parent / "src").exists():
            backend_dir = cwd.parent
    except:
        pass
    
    # Strategy 3: Check common deployment paths where extra_packages might place code
    if backend_dir is None:
        for possible_path in ["/code", "/app", "/workspace", "/tmp"]:
            try:
                test_path = Path(possible_path)
                # Check if src exists directly or in a subdirectory
                if (test_path / "src").exists():
                    backend_dir = test_path
                    break
                # Also check subdirectories (extra_packages might extract to a subdir)
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
        return backend_dir
    
    # Strategy 4: Add all possible paths (fallback)
    # This ensures that even if we can't find the exact path,
    # we add common locations where the code might be
    common_paths = [
        Path("/code"),
        Path("/app"),
        Path("/workspace"),
    ]
    
    try:
        cwd = Path(os.getcwd())
        common_paths.append(cwd)
        common_paths.append(cwd.parent)
    except:
        pass
    
    for path in common_paths:
        try:
            if path.exists() and str(path) not in sys.path:
                sys.path.insert(0, str(path))
        except:
            continue
    
    return None

# Call setup immediately when module is imported
# This ensures path is set up before any other imports
_setup_path()

# Also set up path when this module is imported by cloudpickle during unpickling
# This is a safety measure to ensure path is set up even if called during unpickling
if 'src' not in [p.name for p in Path(sys.path[0]).iterdir() if p.is_dir()] if sys.path else True:
    _setup_path()

