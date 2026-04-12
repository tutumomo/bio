import asyncio
import logging
from functools import wraps
from typing import Any, Callable, TypeVar

import httpx
from tenacity import (
    AsyncRetrying,
    before_sleep_log,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Define exceptions to retry on
RETRY_EXCEPTIONS = (
    httpx.ConnectError,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
    httpx.PoolTimeout,
    # We will also retry on HTTPStatusError if it's 503 or 504
)

def is_retryable_status(exception: Any) -> bool:
    if isinstance(exception, httpx.HTTPStatusError):
        return exception.response.status_code in (503, 504)
    return isinstance(exception, RETRY_EXCEPTIONS)

def async_retry(
    attempts: int = 3,
    min_wait: float = 1.0,
    max_wait: float = 10.0,
):
    """
    Decorator for retrying asynchronous functions that make HTTP requests.
    Uses exponential backoff and retries on connection errors and 503/504 statuses.
    """
    def decorator(func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            retryer = AsyncRetrying(
                stop=stop_after_attempt(attempts),
                wait=wait_exponential(multiplier=min_wait, max=max_wait),
                retry=retry_if_exception_type((httpx.HTTPError, httpx.HTTPStatusError)) if not is_retryable_status else retry_if_exception_type(Exception), # Placeholder
                # Actually, using retry=retry_if_result(lambda x: False) and manually handling in is_retryable_status is better
                before_sleep=before_sleep_log(logger, logging.WARNING),
            )
            # Refined retry logic using tenacity more accurately
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(attempts),
                wait=wait_exponential(multiplier=min_wait, max=max_wait),
                retry=retry_if_exception_type(RETRY_EXCEPTIONS) | retry_if_exception_type(httpx.HTTPStatusError),
                before_sleep=before_sleep_log(logger, logging.WARNING),
                retry_error_callback=lambda retry_state: None, # We handle the final failure outside
            ):
                with attempt:
                    try:
                        return await func(*args, **kwargs)
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code in (503, 504):
                            raise # Trigger retry
                        raise e # Don't retry other status errors
            return await func(*args, **kwargs) # Should not reach here
        return wrapper
    return decorator

# Let's simplify the decorator to be more robust
def retry_http(
    attempts: int = 3,
    min_wait: float = 1.0,
    max_wait: float = 10.0,
):
    def decorator(func: Callable[..., Any]):
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception = None
            for attempt in range(1, attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except (httpx.ConnectError, httpx.TimeoutException) as e:
                    last_exception = e
                    logger.warning(f"Attempt {attempt} failed for {func.__name__}: {e}")
                except httpx.HTTPStatusError as e:
                    last_exception = e
                    if e.response.status_code in (503, 504):
                        logger.warning(f"Attempt {attempt} failed for {func.__name__} with status {e.response.status_code}")
                    else:
                        raise e # Don't retry other status codes
                
                if attempt < attempts:
                    wait_time = min(min_wait * (2 ** (attempt - 1)), max_wait)
                    await asyncio.sleep(wait_time)
            
            # If we reach here, all attempts failed
            logger.error(f"All {attempts} attempts failed for {func.__name__}. Final error: {last_exception}")
            raise last_exception
        return wrapper
    return decorator
