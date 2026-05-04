from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from app.models.tickets import (
    CustomerPublic,
    MessagePublic,
    TechnicianPublic,
    TicketPublic,
    TicketStatus,
    TicketWithCustomer,
)


def _uuid(val: Any) -> UUID:
    return val if isinstance(val, UUID) else UUID(str(val))


def row_to_customer(row: Dict[str, Any]) -> CustomerPublic:
    return CustomerPublic(
        id=_uuid(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        phone=row.get("phone"),
    )


def row_to_technician_public(row: Dict[str, Any]) -> TechnicianPublic:
    return TechnicianPublic(
        id=_uuid(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        phone=row.get("phone"),
        active=row.get("active", True),
    )


def row_to_ticket(row: Dict[str, Any]) -> TicketPublic:
    return TicketPublic(
        id=_uuid(row["id"]),
        customer_id=_uuid(row["customer_id"]),
        title=row["title"],
        description=row.get("description"),
        status=TicketStatus(row["status"]),
        priority=row.get("priority"),
        technician_id=_uuid(row["technician_id"]) if row.get("technician_id") else None,
        scheduled_at=row.get("scheduled_at"),
        site_address=row.get("site_address"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def row_to_message(row: Dict[str, Any]) -> MessagePublic:
    return MessagePublic(
        id=_uuid(row["id"]),
        ticket_id=_uuid(row["ticket_id"]),
        author_type=row["author_type"],
        author_id=_uuid(row["author_id"]) if row.get("author_id") else None,
        body=row["body"],
        created_at=row["created_at"],
    )


def embed_ticket(
    row: Dict[str, Any],
    customers_key: str = "customers",
    technicians_key: str = "technicians",
) -> TicketWithCustomer:
    base = {k: v for k, v in row.items() if k not in (customers_key, technicians_key)}
    t = row_to_ticket(base)
    cust = row.get(customers_key)
    tech = row.get(technicians_key)
    if isinstance(cust, list) and cust:
        cust = cust[0]
    if isinstance(tech, list) and tech:
        tech = tech[0]
    return TicketWithCustomer(
        **t.model_dump(),
        customer=row_to_customer(cust) if isinstance(cust, dict) else None,
        technician=row_to_technician_public(tech) if isinstance(tech, dict) else None,
    )


def ticket_row_without_embed(row: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in row.items() if k not in ("customers", "technicians")}
