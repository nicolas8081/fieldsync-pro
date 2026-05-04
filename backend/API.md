# FieldSync Pro — HTTP API summary

Base URL (local): `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

**Setup**

1. Run `sql/schema.sql` in the Supabase SQL Editor (creates `customers`, `technicians`, `tickets`, `ticket_messages`).
2. Set `.env`: `SUPABASE_URL`, `SUPABASE_KEY` (service role or key with access to these tables).
3. **Admin routes:** set `ADMIN_API_KEY` in `.env` and send header `X-Admin-Key: <value>`. If `ADMIN_API_KEY` is **unset**, admin endpoints are open (dev-only; set the key for any shared/staging/prod use).
4. **Technician routes:** HTTP Basic auth — **username** = technician `email`, **password** = the password set when the technician was created (`POST /admin/technicians`).

---

## Endpoint reference

| Area | Method | URL | Auth | Purpose |
|------|--------|-----|------|---------|
| Root | GET | `/` | — | API metadata |
| Health | GET | `/health` | — | Health + DB probe (`common_issues`) |
| Diagnosis | POST | `/api/diagnose` | — | AI / rules diagnosis (existing) |
| Customer | GET | `/customer/account` | — | Lookup customer by `email` query (returns id for the app) |
| Customer | GET | `/customer/tickets` | — | List tickets + optional latest admin reply preview (`customer_id` query) |
| Customer | GET | `/customer/tickets/{ticket_id}` | — | Ticket detail + message thread (`customer_id` query) |
| Customer | GET | `/customer/support/thread` | — | All ticket messages for this customer (`customer_id` query) |
| Customer | POST | `/customer/tickets/{ticket_id}/reply` | — | Customer message on a ticket (`customer_id` query, JSON `message`) |
| Customer | POST | `/customer/createTickets` | — | Create ticket (upserts customer by email) |
| Admin | GET | `/admin/technicians` | `X-Admin-Key`* | List technicians |
| Admin | POST | `/admin/technicians` | `X-Admin-Key`* | Create technician (email, password, name, phone) |
| Admin | GET | `/admin/tickets` | `X-Admin-Key`* | All tickets; query `scope` = `active`, `past`, or `all` |
| Admin | POST | `/admin/tickets/{ticket_id}/assign` | `X-Admin-Key`* | Assign ticket to technician (`technician_id` body) |
| Admin | GET | `/admin/tickets/{ticket_id}` | `X-Admin-Key`* | Ticket + embedded customer/technician + full message thread |
| Admin | GET | `/admin/chat/inbox` | `X-Admin-Key`* | Recent customer threads (by ticket messages) |
| Admin | GET | `/admin/chat/thread` | `X-Admin-Key`* | All messages for a customer email (`customer_email` query) |
| Admin | POST | `/admin/tickets/{ticket_id}/reply` | `X-Admin-Key`* | Post admin reply to customer (`message` body; optional `admin_user_id` query) |
| Technician | GET | `/technician/jobs` | HTTP Basic | Jobs assigned to this technician |
| Technician | GET | `/technician/stats` | HTTP Basic | Counts: `active_tasks`, `on_site`, `scheduled` |
| Technician | PATCH | `/technician/tickets/{ticket_id}` | HTTP Basic | Update ticket `status` (must be assigned to you) |
| Technician | DELETE | `/technician/tickets/{ticket_id}` | HTTP Basic | Remove job from your queue (unassign + status `open`) |

\*Only enforced when `ADMIN_API_KEY` is set in the environment.

---

## Request bodies (JSON)

- **`POST /customer/createTickets`** — `customer_email`, `customer_name`, optional `customer_phone`, `title`, optional `description`, `priority`, `site_address`
- **`POST /admin/technicians`** — `email`, `full_name`, `password` (min 8 chars), optional `phone`
- **`POST /admin/tickets/{ticket_id}/assign`** — `technician_id` (UUID)
- **`POST /admin/tickets/{ticket_id}/reply`** — `message` (string)
- **`PATCH /technician/tickets/{ticket_id}`** — `status` (`open` \| `assigned` \| `in_progress` \| `on_site` \| `scheduled` \| `completed` \| `cancelled`)

---

## Ticket status semantics

| Status | Typical use |
|--------|----------------|
| `open` | New or unassigned after technician removed job |
| `assigned` | Admin assigned a technician |
| `in_progress` | Work started |
| `on_site` | Technician on location |
| `scheduled` | Scheduled visit window |
| `completed` / `cancelled` | Past / closed (admin **past** filter) |

**Technician `stats`**

- `active_tasks`: tickets assigned to you with status `assigned`, `in_progress`, or `on_site`
- `on_site`: status `on_site`
- `scheduled`: status `scheduled`
