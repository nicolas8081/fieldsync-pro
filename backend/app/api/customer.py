from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import EmailStr
from supabase import Client

from app.deps import get_supabase_dep
from app.models.tickets import (
    ChatThreadResponse,
    CreateTicketRequest,
    CustomerAccountPublic,
    CustomerReplyRequest,
    CustomerTicketDetailResponse,
    CustomerTicketSummary,
    MessagePublic,
    TicketPublic,
    TicketStatus,
)
from app.services.ticket_maps import row_to_message, row_to_ticket

router = APIRouter(prefix="/customer", tags=["customer"])


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _latest_admin_reply_map(supabase: Client, ticket_ids: List[str]) -> dict[str, dict]:
    if not ticket_ids:
        return {}
    res = (
        supabase.table("ticket_messages")
        .select("ticket_id, body, created_at, author_type")
        .in_("ticket_id", ticket_ids)
        .eq("author_type", "admin")
        .execute()
    )
    rows = sorted((res.data or []), key=lambda m: m["created_at"], reverse=True)
    best: dict[str, dict] = {}
    for m in rows:
        tid = str(m["ticket_id"])
        if tid not in best:
            best[tid] = m
    return best


@router.get("/account", response_model=CustomerAccountPublic)
def get_customer_account(
    email: EmailStr = Query(...),
    supabase: Client = Depends(get_supabase_dep),
) -> CustomerAccountPublic:
    em = str(email).strip().lower()
    res = (
        supabase.table("customers")
        .select("id, email, full_name, phone")
        .eq("email", em)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    r = rows[0]
    return CustomerAccountPublic(
        id=UUID(str(r["id"])),
        email=r["email"],
        full_name=r["full_name"],
        phone=r.get("phone"),
    )


@router.get("/tickets", response_model=List[CustomerTicketSummary])
def list_customer_tickets(
    customer_id: UUID = Query(..., description="Customer account id"),
    supabase: Client = Depends(get_supabase_dep),
) -> List[CustomerTicketSummary]:
    res = (
        supabase.table("tickets")
        .select("*")
        .eq("customer_id", str(customer_id))
        .order("created_at", desc=True)
        .execute()
    )
    rows = res.data or []
    ids = [str(r["id"]) for r in rows]
    admin_map = _latest_admin_reply_map(supabase, ids)
    out: List[CustomerTicketSummary] = []
    for r in rows:
        t = row_to_ticket(r)
        adm = admin_map.get(str(r["id"]))
        out.append(
            CustomerTicketSummary(
                **t.model_dump(),
                latest_admin_reply=adm["body"] if adm else None,
                latest_admin_reply_at=adm["created_at"] if adm else None,
            )
        )
    return out


def _get_or_create_customer_id(supabase: Client, body: CreateTicketRequest) -> UUID:
    em = str(body.customer_email).strip().lower()
    found = (
        supabase.table("customers")
        .select("id")
        .eq("email", em)
        .limit(1)
        .execute()
    )
    if found.data:
        return UUID(str(found.data[0]["id"]))
    ins = (
        supabase.table("customers")
        .insert(
            {
                "email": em,
                "full_name": body.customer_name,
                "phone": body.customer_phone,
            }
        )
        .execute()
    )
    if not ins.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create customer")
    return UUID(str(ins.data[0]["id"]))


@router.get("/tickets/{ticket_id}", response_model=CustomerTicketDetailResponse)
def get_customer_ticket(
    ticket_id: UUID,
    customer_id: UUID = Query(..., description="Must own this ticket"),
    supabase: Client = Depends(get_supabase_dep),
) -> CustomerTicketDetailResponse:
    res = (
        supabase.table("tickets")
        .select("*")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    row = rows[0]
    if str(row["customer_id"]) != str(customer_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")
    msg_res = (
        supabase.table("ticket_messages")
        .select("*")
        .eq("ticket_id", str(ticket_id))
        .order("created_at", desc=False)
        .execute()
    )
    messages = [row_to_message(m) for m in (msg_res.data or [])]
    return CustomerTicketDetailResponse(ticket=row_to_ticket(row), messages=messages)


@router.get("/support/thread", response_model=ChatThreadResponse)
def customer_support_thread(
    customer_id: UUID = Query(...),
    supabase: Client = Depends(get_supabase_dep),
) -> ChatThreadResponse:
    tk_res = (
        supabase.table("tickets")
        .select("id")
        .eq("customer_id", str(customer_id))
        .execute()
    )
    tids = [str(r["id"]) for r in (tk_res.data or [])]
    if not tids:
        return ChatThreadResponse(messages=[])
    msg_res = (
        supabase.table("ticket_messages")
        .select("*")
        .in_("ticket_id", tids)
        .order("created_at", desc=False)
        .execute()
    )
    messages = [row_to_message(m) for m in (msg_res.data or [])]
    return ChatThreadResponse(messages=messages)


@router.post("/tickets/{ticket_id}/reply", response_model=MessagePublic)
def customer_reply_to_ticket(
    ticket_id: UUID,
    body: CustomerReplyRequest,
    customer_id: UUID = Query(..., description="Must own this ticket"),
    supabase: Client = Depends(get_supabase_dep),
) -> MessagePublic:
    res = (
        supabase.table("tickets")
        .select("id, customer_id")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if str(res.data[0]["customer_id"]) != str(customer_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")

    ins = (
        supabase.table("ticket_messages")
        .insert(
            {
                "ticket_id": str(ticket_id),
                "author_type": "customer",
                "author_id": str(customer_id),
                "body": body.message.strip(),
            }
        )
        .execute()
    )
    supabase.table("tickets").update({"updated_at": _utc_now_iso()}).eq("id", str(ticket_id)).execute()
    if not ins.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save message")
    return row_to_message(ins.data[0])


@router.post("/createTickets", response_model=TicketPublic, status_code=status.HTTP_201_CREATED)
def create_ticket(
    body: CreateTicketRequest,
    supabase: Client = Depends(get_supabase_dep),
) -> TicketPublic:
    cid = _get_or_create_customer_id(supabase, body)
    now = _utc_now_iso()
    ins = (
        supabase.table("tickets")
        .insert(
            {
                "customer_id": str(cid),
                "title": body.title,
                "description": body.description,
                "status": TicketStatus.open.value,
                "priority": body.priority,
                "site_address": body.site_address,
                "created_at": now,
                "updated_at": now,
            }
        )
        .execute()
    )
    if not ins.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create ticket")
    return row_to_ticket(ins.data[0])
