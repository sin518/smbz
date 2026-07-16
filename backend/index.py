"""Vercel FastAPI entrypoint.

The application itself remains in ``app.main`` so local development and the
existing Railway deployment continue to use the same implementation.
"""

from mangum import Mangum
from app.main import app

# Vercel serverless function handler
handler = Mangum(app, lifespan="off")

__all__ = ["app", "handler"]
