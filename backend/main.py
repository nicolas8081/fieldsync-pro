from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import os
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="FieldSync Pro API",
    description=(
        "AI-Powered Field Service Management Backend.\n\n"
        "**Admin routes** (`/admin/*`): when `ADMIN_API_KEY` is set on the server, send header "
        "`X-Admin-Key` with the same value. Swagger shows this as **AdminApiKey** — use **Authorize**."
    ),
    version="0.1.0",
)


def custom_openapi():
    """Ensure `/admin/*` operations declare `X-Admin-Key` so Swagger UI shows Authorize / lock."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schemes = openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schemes["AdminApiKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Admin-Key",
        "description": "Must match the server's ADMIN_API_KEY environment variable (if set).",
    }
    for path_key, path_item in openapi_schema.get("paths", {}).items():
        if not str(path_key).startswith("/admin"):
            continue
        for method, operation in path_item.items():
            if method not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue
            if not isinstance(operation, dict):
                continue
            entry = {"AdminApiKey": []}
            existing = operation.get("security")
            if not existing:
                operation["security"] = [entry]
            elif not any(isinstance(s, dict) and "AdminApiKey" in s for s in existing):
                operation["security"] = [*existing, entry]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# CORS: Browsers reject Access-Control-Allow-Origin: * together with Allow-Credentials: true.
# Expo Web (and most API clients here) do not need cookie credentials — false keeps * origins working.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

from app.api import admin, auth, customer, diagnose, technician

diagnose.get_supabase = get_supabase

app.include_router(
    diagnose.router,
    prefix="/api",
    tags=["diagnosis"],
)
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(admin.router)
app.include_router(technician.router)

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