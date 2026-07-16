"""Minimal test endpoint to verify Vercel deployment."""

from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vercel deployment working"}

@app.get("/test")
def test():
    return {"test": "success"}

handler = Mangum(app, lifespan="off")
