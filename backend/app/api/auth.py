"""Portal auth: customer signup, unified login (customer / technician / optional admin portal)."""
from __future__ import annotations

import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr
from supabase import Client

from app.core.security import hash_password, verify_password
from app.deps import get_supabase_dep
from app.models.auth import (
    AdminPortalPublic,
    BootstrapAdminRequest,
    CustomerSignupRequest,
    PortalLoginRequest,
    PortalLoginResponse,
)
from app.models.tickets import CustomerAccountPublic

router = APIRouter(prefix="/auth", tags=["auth"])


def _norm_email(v: EmailStr | str) -> str:
    return str(v).strip().lower()


def _signup_db_error(exc: Exception, operation: str) -> HTTPException:
    """Turn Supabase / Postgres failures into actionable HTTP errors."""
    raw = getattr(exc, "message", None) or str(exc)
    low = raw.lower()
    hint = ""
    if "password_hash" in low or ('column' in low and 'does not exist' in low):
        hint = (
            " The `customers` table needs a password column. Run `backend/sql/migration_add_customer_password.sql` "
            "in the Supabase SQL Editor (or re-apply `schema.sql` on a fresh project)."
        )
    elif any(x in low for x in ("duplicate", "unique", "23505")):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email is already registered. Try logging in.",
        )
    elif "row-level security" in low or "42501" in raw:
        hint = " Use SUPABASE_KEY=service_role in backend/.env, or disable RLS on app tables for dev."

    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Could not {operation}: {raw}{hint}",
    )


@router.post("/signup/customer", response_model=CustomerAccountPublic, status_code=status.HTTP_201_CREATED)
def signup_customer(body: CustomerSignupRequest, supabase: Client = Depends(get_supabase_dep)) -> CustomerAccountPublic:
    """Register a customer account. If the email exists with no password yet (e.g. ticket flow), claim and set password."""
    em = _norm_email(body.email)
    hashed = hash_password(body.password)

    try:
        # Select * so older DBs without password_hash column don't fail the query outright.
        found = (
            supabase.table("customers")
            .select("*")
            .eq("email", em)
            .limit(1)
            .execute()
        )
    except Exception as e:
        raise _signup_db_error(e, "look up customer") from e

    rows = found.data or []

    try:
        if not rows:
            supabase.table("customers").insert(
                {
                    "email": em,
                    "full_name": body.full_name.strip(),
                    "phone": body.phone.strip() if body.phone and body.phone.strip() else None,
                    "password_hash": hashed,
                }
            ).execute()
        else:
            r0 = rows[0]
            if r0.get("password_hash"):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This email is already registered. Log in instead.",
                )
            supabase.table("customers").update(
                {
                    "full_name": body.full_name.strip(),
                    "phone": body.phone.strip()
                    if body.phone and body.phone.strip()
                    else r0.get("phone"),
                    "password_hash": hashed,
                }
            ).eq("id", str(r0["id"])).execute()

        fetched = (
            supabase.table("customers")
            .select("id, email, full_name, phone")
            .eq("email", em)
            .limit(1)
            .execute()
        )
        rd = fetched.data or []
        if not rd:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Account was not saved correctly (reload returned no row). Check Supabase RLS and service_role key.",
            )
        r = rd[0]
    except HTTPException:
        raise
    except Exception as e:
        raise _signup_db_error(e, "save customer account") from e

    return CustomerAccountPublic(
        id=UUID(str(r["id"])),
        email=r["email"],
        full_name=r["full_name"],
        phone=r.get("phone"),
    )


@router.post("/bootstrap-admin", response_model=AdminPortalPublic, status_code=status.HTTP_201_CREATED)
def bootstrap_first_admin(
    body: BootstrapAdminRequest,
    supabase: Client = Depends(get_supabase_dep),
) -> AdminPortalPublic:
    """Create the **first** portal admin row. Requires ADMIN_BOOTSTRAP_SECRET in `.env`. Later admins use POST /admin/admins."""
    expected = (os.getenv("ADMIN_BOOTSTRAP_SECRET") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Set ADMIN_BOOTSTRAP_SECRET in backend .env (any long random string), restart the API, then POST again.",
        )
    if body.bootstrap_secret.strip() != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap secret")

    existing = (
        supabase.table("admins")
        .select("id")
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="admins already has rows — log in as admin and use POST /admin/admins, or seed via SQL.",
        )

    em = _norm_email(body.email)
    try:
        supabase.table("admins").insert(
            {
                "email": em,
                "full_name": body.full_name.strip(),
                "password_hash": hash_password(body.password),
            }
        ).execute()
    except Exception as e:
        msg = str(e).lower()
        if "admins" in msg and (
            "does not exist" in msg or "schema cache" in msg or "pgrst205" in msg
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Create/expose table `admins`: run backend/sql/migration_admins_table.sql in Supabase, "
                    "then execute `NOTIFY pgrst, 'reload schema';` and retry."
                ),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create admin: {e!s}",
        ) from e

    fetched = (
        supabase.table("admins")
        .select("id, email, full_name, active")
        .eq("email", em)
        .limit(1)
        .execute()
    )
    row = (fetched.data or [None])[0]
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Bootstrap insert did not persist")
    return AdminPortalPublic(
        id=UUID(str(row["id"])),
        email=str(row["email"]),
        full_name=str(row["full_name"]),
        active=bool(row.get("active", True)),
    )


@router.post("/login", response_model=PortalLoginResponse)
def portal_login(body: PortalLoginRequest, supabase: Client = Depends(get_supabase_dep)) -> PortalLoginResponse:
    """Unified login by email/password. Detects admin portal (optional env), technician, then customer."""
    em = _norm_email(body.email)
    # Strip after Pydantic validation — avoids 401 from accidental spaces/newlines when pasting on mobile.
    pw = body.password.strip()
    if not pw:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password is required.")

    admin_pw = (os.getenv("ADMIN_PORTAL_PASSWORD") or "").strip()
    if admin_pw:
        admin_email_raw = (os.getenv("ADMIN_PORTAL_EMAIL") or "admin@fieldsync.local").strip()
        ae = _norm_email(admin_email_raw)
        if em == ae and pw == admin_pw:
            return PortalLoginResponse(
                role="admin",
                email=str(body.email).strip(),
                display_name="Admin",
                customer_id=None,
                technician_id=None,
                admin_user_id=None,
            )

    a_rows: list = []
    try:
        a_res = (
            supabase.table("admins")
            .select("id, email, full_name, active, password_hash")
            .eq("email", em)
            .limit(1)
            .execute()
        )
        a_rows = a_res.data or []
    except Exception as ex:
        raw = str(getattr(ex, "message", None) or getattr(ex, "args", None) or ex).lower()
        if (
            "pgrst205" in raw
            or (("schema cache" in raw or "could not find" in raw) and "admins" in raw)
            or ("relation" in raw and "admins" in raw)
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Portal admins (`admins` table) are not available via Supabase PostgREST. "
                    "Run `backend/sql/migration_admins_table.sql`, then execute "
                    "`NOTIFY pgrst, 'reload schema';` in the Supabase SQL Editor and retry `/auth/login`. "
                    "See RUNNING.md."
                ),
            ) from ex
        _dev = (os.getenv("ENVIRONMENT") or "").strip().lower() in ("development", "dev")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                f"Could not read `admins` from database: {ex!s}"
                if _dev
                else "Could not verify admin login (database error). Try again or check server logs."
            ),
        ) from ex
    for admin_row in a_rows:
        if not admin_row.get("active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account inactive")
        ph = admin_row.get("password_hash")
        if ph and verify_password(pw, ph):
            return PortalLoginResponse(
                role="admin",
                email=str(admin_row["email"]),
                display_name=str(admin_row["full_name"]),
                customer_id=None,
                technician_id=None,
                admin_user_id=UUID(str(admin_row["id"])),
            )

    t_res = (
        supabase.table("technicians")
        .select("id, email, full_name, password_hash, active")
        .ilike("email", str(body.email).strip())
        .limit(1)
        .execute()
    )
    t_rows = t_res.data or []
    if t_rows:
        tech = t_rows[0]
        if not tech.get("active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Technician inactive")
        if verify_password(pw, tech["password_hash"]):
            return PortalLoginResponse(
                role="technician",
                email=str(tech["email"]),
                display_name=str(tech["full_name"]),
                customer_id=None,
                technician_id=UUID(str(tech["id"])),
                admin_user_id=None,
            )

    c_res = (
        supabase.table("customers")
        .select("*")
        .eq("email", em)
        .limit(1)
        .execute()
    )
    c_rows = c_res.data or []
    if c_rows:
        cust = c_rows[0]
        ch = cust.get("password_hash")
        if not ch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Finish signup to set a password for this customer email.",
            )
        if verify_password(pw, ch):
            return PortalLoginResponse(
                role="customer",
                email=str(cust["email"]),
                display_name=str(cust["full_name"]),
                customer_id=UUID(str(cust["id"])),
                technician_id=None,
                admin_user_id=None,
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )
