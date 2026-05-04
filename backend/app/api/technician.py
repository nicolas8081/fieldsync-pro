from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from supabase import Client

from app.deps import get_supabase_dep, technician_id_dep
from app.models.tickets import TechnicianStats, TechnicianUpdateTicketRequest, TicketPublic, TicketStatus
from app.services.ticket_maps import row_to_ticket

router = APIRouter(prefix="/technician", tags=["technician"])


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


ACTIVE_STATUSES = frozenset(
    {
        TicketStatus.assigned.value,
        TicketStatus.in_progress.value,
        TicketStatus.on_site.value,
    }
)


@router.get("/jobs", response_model=List[TicketPublic])
def list_technician_jobs(
    supabase: Client = Depends(get_supabase_dep),
    tech_id: UUID = Depends(technician_id_dep),
) -> List[TicketPublic]:
    res = (
        supabase.table("tickets")
        .select("*, customers(*)")
        .eq("technician_id", str(tech_id))
        .order("created_at", desc=True)
        .execute()
    )
    return [row_to_ticket(r) for r in (res.data or [])]


@router.get("/stats", response_model=TechnicianStats)
def technician_stats(
    supabase: Client = Depends(get_supabase_dep),
    tech_id: UUID = Depends(technician_id_dep),
) -> TechnicianStats:
    res = (
        supabase.table("tickets")
        .select("status")
        .eq("technician_id", str(tech_id))
        .execute()
    )
    rows = res.data or []
    active_tasks = 0
    on_site = 0
    scheduled = 0
    for r in rows:
        st = r.get("status")
        if st in ACTIVE_STATUSES:
            active_tasks += 1
        if st == TicketStatus.on_site.value:
            on_site += 1
        if st == TicketStatus.scheduled.value:
            scheduled += 1
    return TechnicianStats(active_tasks=active_tasks, on_site=on_site, scheduled=scheduled)


@router.patch("/tickets/{ticket_id}", response_model=TicketPublic)
def technician_update_ticket(
    ticket_id: UUID,
    body: TechnicianUpdateTicketRequest,
    supabase: Client = Depends(get_supabase_dep),
    tech_id: UUID = Depends(technician_id_dep),
) -> TicketPublic:
    cur = (
        supabase.table("tickets")
        .select("id, technician_id")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    if not cur.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    row = cur.data[0]
    if str(row.get("technician_id")) != str(tech_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket not assigned to you")

    upd = (
        supabase.table("tickets")
        .update({"status": body.status.value, "updated_at": _utc_now_iso()})
        .eq("id", str(ticket_id))
        .execute()
    )
    if not upd.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed")
    return row_to_ticket(upd.data[0])


@router.delete(
    "/tickets/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def technician_remove_job(
    ticket_id: UUID,
    supabase: Client = Depends(get_supabase_dep),
    tech_id: UUID = Depends(technician_id_dep),
) -> Response:
    cur = (
        supabase.table("tickets")
        .select("id, technician_id")
        .eq("id", str(ticket_id))
        .limit(1)
        .execute()
    )
    if not cur.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if str(cur.data[0].get("technician_id")) != str(tech_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket not assigned to you")

    supabase.table("tickets").update(
        {
            "technician_id": None,
            "status": TicketStatus.open.value,
            "updated_at": _utc_now_iso(),
        }
    ).eq("id", str(ticket_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
