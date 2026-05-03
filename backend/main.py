from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import os
import traceback
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print("UNHANDLED ERROR:")
    print(tb)
    return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": tb})

# Supabase client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> Client:
    return supabase

from app.api import diagnose
diagnose.get_supabase = get_supabase

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
    try:
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