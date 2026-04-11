"""
Backend package initialization.

This module sets up the Python path to ensure 'src' module is importable.
This is critical for Vertex AI Agent Engine deployment where cloudpickle
needs to unpickle objects that reference 'src' modules.
"""
import sys
import os
from pathlib import Path

# Add this directory (backend/) to Python path so 'src' can be imported
_backend_dir = Path(__file__).parent.resolve()
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

