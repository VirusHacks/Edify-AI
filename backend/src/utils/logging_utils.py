"""
Logging utilities for structured logging.
"""

import logging
import sys
from typing import Dict, Any
from datetime import datetime


def setup_logging(level: str = "INFO") -> None:
    """
    Configure standard logging with structured output.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)


def log_structured(
    logger: logging.Logger,
    level: str,
    message: str,
    **kwargs: Any
) -> None:
    """
    Log a structured message with additional context.
    
    Args:
        logger: Logger instance
        level: Log level (info, warning, error, etc.)
        message: Main log message
        **kwargs: Additional structured data
    """
    log_func = getattr(logger, level.lower(), logger.info)
    
    if kwargs:
        context = " | ".join(f"{k}={v}" for k, v in kwargs.items())
        log_func(f"{message} | {context}")
    else:
        log_func(message)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        Logger instance
    """
    return logging.getLogger(name)

