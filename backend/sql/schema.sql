-- Run this in the Supabase SQL Editor (once per project).
-- FieldSync Pro: customers, technicians, tickets, messages.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in (
      'open', 'assigned', 'in_progress', 'on_site', 'scheduled', 'completed', 'cancelled'
    )),
  priority text,
  technician_id uuid references public.technicians (id) on delete set null,
  scheduled_at timestamptz,
  site_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_customer on public.tickets (customer_id);
create index if not exists idx_tickets_technician on public.tickets (technician_id);
create index if not exists idx_tickets_status on public.tickets (status);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_type text not null check (author_type in ('customer', 'admin', 'technician')),
  author_id uuid,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket on public.ticket_messages (ticket_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
--
-- The Python backend should use the **service_role** API key in SUPABASE_KEY
-- (Dashboard → Project Settings → API → **service_role** secret). That key
-- bypasses RLS and is appropriate only on your server — never put it in the mobile app.
--
-- If you used the **anon** key instead, inserts will fail with "violates row-level
-- security policy". Fix by switching SUPABASE_KEY to **service_role**, OR run the
-- statements below so these tables allow the API key you use (typical for local MVP).
-- ---------------------------------------------------------------------------
alter table public.technicians disable row level security;
alter table public.customers disable row level security;
alter table public.tickets disable row level security;
alter table public.ticket_messages disable row level security;
