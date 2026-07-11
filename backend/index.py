"""Vercel FastAPI entrypoint.

The application itself remains in ``app.main`` so local development and the
existing Railway deployment continue to use the same implementation.
"""

from app.main import app

__all__ = ["app"]
