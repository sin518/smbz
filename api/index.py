"""Vercel FastAPI entrypoint.

The application itself remains in ``app.main`` so local development and the
existing Railway deployment continue to use the same implementation.
"""

import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from mangum import Mangum
from app.main import app

# Vercel serverless function handler
handler = Mangum(app, lifespan="off")

__all__ = ["app", "handler"]
