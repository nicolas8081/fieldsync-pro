from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class TicketStatus(str, Enum):
    open = "open"
    assigned = "assigned"
    in_progress = "in_progress"
    on_site = "on_site"
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


class CustomerPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class TechnicianPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    active: bool = True


class TicketPublic(BaseModel):
    id: UUID
    customer_id: UUID
    title: str
    description: Optional[str] = None
    status: TicketStatus
    priority: Optional[str] = None
    technician_id: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    site_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TicketWithCustomer(TicketPublic):
    customer: Optional[CustomerPublic] = None
    technician: Optional[TechnicianPublic] = None


class MessagePublic(BaseModel):
    id: UUID
    ticket_id: UUID
    author_type: str
    author_id: Optional[UUID] = None
    body: str
    created_at: datetime


class CreateTicketRequest(BaseModel):
    customer_email: EmailStr
    customer_name: str
    customer_phone: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    site_address: Optional[str] = None


class AssignTicketRequest(BaseModel):
    technician_id: UUID


class AdminReplyRequest(BaseModel):
    message: str = Field(..., min_length=1)


class CreateTechnicianRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None


class TechnicianStats(BaseModel):
    active_tasks: int = Field(description="Assigned, in progress, or on site")
    on_site: int
    scheduled: int


class TechnicianUpdateTicketRequest(BaseModel):
    status: TicketStatus


class CustomerTicketDetailResponse(BaseModel):
    ticket: TicketPublic
    messages: List[MessagePublic]


class CustomerTicketSummary(TicketPublic):
    latest_admin_reply: Optional[str] = None
    latest_admin_reply_at: Optional[datetime] = None


class CustomerReplyRequest(BaseModel):
    message: str = Field(..., min_length=1)


class CustomerAccountPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class AdminTicketDetailResponse(BaseModel):
    ticket: TicketWithCustomer
    messages: List[MessagePublic]


class ChatInboxEntry(BaseModel):
    customer_email: str
    customer_name: str
    last_preview: str
    updated_at: datetime


class ChatThreadResponse(BaseModel):
    messages: List[MessagePublic]
