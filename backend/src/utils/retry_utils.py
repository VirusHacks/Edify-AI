"""
Retry utilities for handling API rate limits and transient errors.
"""

import time
import random
from typing import Callable, TypeVar, Optional
from google.api_core import retry
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
from src.utils.logging_utils import get_logger

logger = get_logger(__name__)

T = TypeVar('T')


def exponential_backoff_retry(
    func: Callable[[], T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: bool = True
) -> T:
    """
    Retry a function with exponential backoff on rate limit errors.
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        backoff_factor: Multiplier for delay on each retry
        jitter: Add random jitter to delay
    
    Returns:
        Result of the function call
    
    Raises:
        Last exception if all retries fail
    """
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except (ResourceExhausted, ServiceUnavailable) as e:
            last_exception = e
            
            if attempt < max_retries:
                # Calculate delay with exponential backoff
                delay = min(initial_delay * (backoff_factor ** attempt), max_delay)
                
                # Add jitter to prevent thundering herd
                if jitter:
                    delay = delay * (0.5 + random.random() * 0.5)
                
                error_msg = str(e)
                if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                    logger.warning(
                        f"Rate limit hit (attempt {attempt + 1}/{max_retries + 1}). "
                        f"Retrying in {delay:.2f} seconds..."
                    )
                else:
                    logger.warning(
                        f"Service unavailable (attempt {attempt + 1}/{max_retries + 1}). "
                        f"Retrying in {delay:.2f} seconds..."
                    )
                
                time.sleep(delay)
            else:
                logger.error(f"All {max_retries + 1} retry attempts failed")
                raise
        except Exception as e:
            # For non-retryable errors, raise immediately
            logger.error(f"Non-retryable error: {e}")
            raise
    
    # Should never reach here, but just in case
    if last_exception:
        raise last_exception
    
    raise RuntimeError("Unexpected retry loop exit")


def add_delay_between_calls(delay_seconds: float = 2.0):
    """
    Decorator to add a delay between function calls to avoid rate limits.
    
    Args:
        delay_seconds: Delay in seconds between calls
    """
    def decorator(func: Callable) -> Callable:
        last_call_time = [0.0]
        
        def wrapper(*args, **kwargs):
            current_time = time.time()
            time_since_last_call = current_time - last_call_time[0]
            
            if time_since_last_call < delay_seconds:
                sleep_time = delay_seconds - time_since_last_call
                logger.debug(f"Rate limiting: waiting {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
            
            last_call_time[0] = time.time()
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

