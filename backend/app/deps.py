import os
from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from supabase import Client

from app.core.security import verify_password

http_basic = HTTPBasic()


def get_supabase_dep() -> Client:
    from main import supabase

    return supabase


async def verify_admin_key(
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> None:
    expected = (os.getenv("ADMIN_API_KEY") or "").strip()
    if not expected:
        return
    got = (x_admin_key or "").strip()
    if got != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Key header",
        )


async def get_current_technician(
    credentials: Annotated[HTTPBasicCredentials, Depends(http_basic)],
    supabase: Annotated[Client, Depends(get_supabase_dep)],
) -> dict:
    # Case-insensitive match so mobile login matches DB email regardless of casing.
    username = credentials.username.strip()
    res = (
        supabase.table("technicians")
        .select("id, email, password_hash, active, full_name")
        .ilike("email", username)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid technician credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    tech = rows[0]
    if not tech.get("active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Technician inactive")
    if not verify_password(credentials.password, tech["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid technician credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return tech


def technician_id_dep(
    technician: Annotated[dict, Depends(get_current_technician)],
) -> UUID:
    return UUID(str(technician["id"]))
