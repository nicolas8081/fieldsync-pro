-- Run once in Supabase SQL editor if `customers` already exists without `password_hash`.
alter table public.customers
  add column if not exists password_hash text;
