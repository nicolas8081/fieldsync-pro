from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CustomerSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=50)


class PortalLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class PortalLoginResponse(BaseModel):
    role: Literal["customer", "technician", "admin"]
    email: str
    display_name: str
    customer_id: Optional[UUID] = None
    technician_id: Optional[UUID] = None
    admin_user_id: Optional[UUID] = Field(default=None)


class BootstrapAdminRequest(BaseModel):
    """One-time bootstrap when `admins` is empty — requires ADMIN_BOOTSTRAP_SECRET in server .env."""

    bootstrap_secret: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=200)


class CreatePortalAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=200)
    active: bool = Field(default=True)


class AdminPortalPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    active: bool = True
