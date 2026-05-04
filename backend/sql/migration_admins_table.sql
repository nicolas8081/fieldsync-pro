-- Run once in Supabase SQL Editor for existing projects without `admins`.
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admins disable row level security;

-- PostgREST must pick up new tables or logins fail with `PGRST205` ("not in schema cache").
notify pgrst, 'reload schema';
