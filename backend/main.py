from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="FieldSync Pro API",
    description="AI-Powered Field Service Management Backend",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# Dependency injection - provides Supabase client to endpoints
def get_supabase() -> Client:
    """Provides Supabase client to endpoints via dependency injection"""
    return supabase


# Import and register routers from app/api/
from app.api import diagnose

# Override the placeholder get_supabase in diagnose router
diagnose.get_supabase = get_supabase

# Register router
app.include_router(
    diagnose.router,
    prefix="/api",
    tags=["diagnosis"]
)


@app.get("/")
def root():
    return {
        "message": "FieldSync Pro API",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    """Health check - tests database connection"""
    try:
        # Test Supabase connection
        result = supabase.table("common_issues").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e),
            "environment": os.getenv("ENVIRONMENT", "development")
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)