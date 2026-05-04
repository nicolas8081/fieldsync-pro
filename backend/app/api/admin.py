from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.core.security import hash_password
from app.deps import get_supabase_dep, verify_admin_key
from app.models.tickets import (
    AdminReplyRequest,
    AdminTicketDetailResponse,
    AssignTicketRequest,
    ChatInboxEntry,
    ChatThreadResponse,
    CreateTechnicianRequest,
    MessagePublic,
    TechnicianPublic,
    TicketStatus,
    TicketWithCustomer,
)
from app.services.ticket_maps import (
    embed_ticket,
    row_to_message,
    row_to_ticket,
    ticket_row_without_embed,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/technicians", response_model=List[TechnicianPublic])
def list_technicians(
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> List[TechnicianPublic]:
    res = (
        supabase.table("technicians")
        .select("id, email, full_name, phone, active, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    rows = res.data or []
    return [
        TechnicianPublic(
            id=UUID(str(r["id"])),
            email=r["email"],
            full_name=r["full_name"],
            phone=r.get("phone"),
            active=r.get("active", True),
        )
        for r in rows
    ]


@router.post("/technicians", response_model=TechnicianPublic, status_code=status.HTTP_201_CREATED)
def create_technician(
    body: CreateTechnicianRequest,
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> TechnicianPublic:
    row = {
        "email": str(body.email),
        "full_name": body.full_name,
        "phone": body.phone,
        "password_hash": hash_password(body.password),
    }
    try:
        ins = supabase.table("technicians").insert(row).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create technician: {e!s}",
        ) from e
    if not ins.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Insert failed")
    r = ins.data[0]
    return TechnicianPublic(
        id=UUID(str(r["id"])),
        email=r["email"],
        full_name=r["full_name"],
        phone=r.get("phone"),
        active=r.get("active", True),
    )


@router.get("/tickets", response_model=List[TicketWithCustomer])
def list_admin_tickets(
    scope: Literal["active", "past", "all"] = Query("all"),
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> List[TicketWithCustomer]:
    res = (
        supabase.table("tickets")
        .select("*, customers(*), technicians(*)")
        .order("created_at", desc=True)
        .execute()
    )
    rows = res.data or []
    done = {TicketStatus.completed.value, TicketStatus.cancelled.value}

    def include(r: dict) -> bool:
        st = r.get("status")
        if scope == "active":
            return st not in done
        if scope == "past":
            return st in done
        return True

    rows = [r for r in rows if include(r)]
    out: List[TicketWithCustomer] = []
    for row in rows:
        try:
            out.append(embed_ticket(row))
        except Exception:
            t = row_to_ticket(ticket_row_without_embed(row))
            out.append(TicketWithCustomer(**t.model_dump(), customer=None, technician=None))
    return out


@router.get("/tickets/{ticket_id}", response_model=AdminTicketDetailResponse)
def get_admin_ticket(
    ticket_id: UUID,
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> AdminTicketDetailResponse:
    res = (
        supabase.table("tickets")
        .select("*, customers(*), technicians(*)")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    try:
        ticket_obj = embed_ticket(row)
    except Exception:
        t = row_to_ticket(ticket_row_without_embed(row))
        ticket_obj = TicketWithCustomer(**t.model_dump(), customer=None, technician=None)
    msg_res = (
        supabase.table("ticket_messages")
        .select("*")
        .eq("ticket_id", str(ticket_id))
        .order("created_at", desc=False)
        .execute()
    )
    messages = [row_to_message(m) for m in (msg_res.data or [])]
    return AdminTicketDetailResponse(ticket=ticket_obj, messages=messages)


@router.get("/chat/inbox", response_model=List[ChatInboxEntry])
def admin_chat_inbox(
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> List[ChatInboxEntry]:
    msg_res = (
        supabase.table("ticket_messages")
        .select("ticket_id, body, created_at")
        .order("created_at", desc=True)
        .limit(400)
        .execute()
    )
    msgs = msg_res.data or []
    if not msgs:
        return []
    ticket_ids = list({str(m["ticket_id"]) for m in msgs})
    t_res = (
        supabase.table("tickets")
        .select("id, customer_id, customers(email, full_name)")
        .in_("id", ticket_ids)
        .execute()
    )
    tmap: dict[str, tuple[str, str]] = {}
    for t in t_res.data or []:
        c = t.get("customers")
        if isinstance(c, list) and c:
            c = c[0]
        if isinstance(c, dict):
            tmap[str(t["id"])] = (c.get("email") or "unknown", c.get("full_name") or "Customer")

    seen: set[str] = set()
    out: List[ChatInboxEntry] = []
    for m in msgs:
        tid = str(m["ticket_id"])
        if tid not in tmap:
            continue
        email, name = tmap[tid]
        el = email.lower()
        if el in seen:
            continue
        seen.add(el)
        out.append(
            ChatInboxEntry(
                customer_email=email,
                customer_name=name,
                last_preview=(m.get("body") or "")[:280],
                updated_at=m["created_at"],
            )
        )
    return out


@router.get("/chat/thread", response_model=ChatThreadResponse)
def admin_chat_thread(
    customer_email: str = Query(..., description="Customer email to load messages for"),
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> ChatThreadResponse:
    norm = customer_email.strip().lower()
    c_res = (
        supabase.table("customers")
        .select("id")
        .eq("email", norm)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        return ChatThreadResponse(messages=[])
    cid = c_res.data[0]["id"]
    tk_res = (
        supabase.table("tickets")
        .select("id")
        .eq("customer_id", str(cid))
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


@router.post("/tickets/{ticket_id}/assign", response_model=TicketWithCustomer)
def assign_ticket(
    ticket_id: UUID,
    body: AssignTicketRequest,
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> TicketWithCustomer:
    tech_check = (
        supabase.table("technicians")
        .select("id, active")
        .eq("id", str(body.technician_id))
        .limit(1)
        .execute()
    )
    if not tech_check.data or not tech_check.data[0].get("active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inactive technician")

    upd = (
        supabase.table("tickets")
        .update(
            {
                "technician_id": str(body.technician_id),
                "status": TicketStatus.assigned.value,
                "updated_at": _utc_now_iso(),
            }
        )
        .eq("id", str(ticket_id))
        .execute()
    )
    if not upd.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    res = (
        supabase.table("tickets")
        .select("*, customers(*), technicians(*)")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return embed_ticket(row)


@router.post("/tickets/{ticket_id}/reply", response_model=MessagePublic)
def admin_reply(
    ticket_id: UUID,
    body: AdminReplyRequest,
    admin_user_id: Optional[UUID] = Query(None, description="Optional admin user id stored on message"),
    _: None = Depends(verify_admin_key),
    supabase: Client = Depends(get_supabase_dep),
) -> MessagePublic:
    exists = (
        supabase.table("tickets").select("id").eq("id", str(ticket_id)).limit(1).execute()
    )
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    ins = (
        supabase.table("ticket_messages")
        .insert(
            {
                "ticket_id": str(ticket_id),
                "author_type": "admin",
                "author_id": str(admin_user_id) if admin_user_id else None,
                "body": body.message,
            }
        )
        .execute()
    )
    supabase.table("tickets").update({"updated_at": _utc_now_iso()}).eq("id", str(ticket_id)).execute()

    if not ins.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save reply")
    return row_to_message(ins.data[0])
