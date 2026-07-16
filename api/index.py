"""Vercel FastAPI entrypoint.

The application itself remains in ``app.main`` so local development and the
existing Railway deployment continue to use the same implementation.
"""

import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

try:
    from mangum import Mangum
    from app.main import app

    # Vercel serverless function handler (disable lifespan for serverless)
    handler = Mangum(app, lifespan="off")

except Exception as e:
    print(f"Failed to initialize app: {e}")
    import traceback
    traceback.print_exc()
    raise

__all__ = ["app", "handler"]
