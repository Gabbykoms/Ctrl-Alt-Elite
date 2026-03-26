import httpx
import logging
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings

logger = logging.getLogger(__name__)

# Tells FastAPI to look for "Authorization: Bearer <token>" on the request
_bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> dict:
    """
    Validate a Supabase Bearer token by calling Supabase's /auth/v1/user endpoint.

    Returns the Supabase user dict on success.
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    token = credentials.credentials

    if not settings.AI_SUPABASE_URL or not settings.AI_SUPABASE_KEY:
        # If Supabase is not configured, fail closed (deny all) rather than open
        logger.error("AI_SUPABASE_URL or AI_SUPABASE_KEY is not set — cannot validate tokens")
        raise HTTPException(
            status_code=503,
            detail="Authentication service is not configured.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.AI_SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.AI_SUPABASE_KEY,
                },
            )

        if response.status_code == 200:
            return response.json()

        # Token invalid or expired
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying token with Supabase: {e}")
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_authenticated_db(user: dict = Depends(get_current_user)) -> Session:
    """
    Authenticated database session dependency.
    Auth is verified BEFORE the DB connection is opened,
    preventing DB errors from leaking to unauthenticated callers.
    """
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()