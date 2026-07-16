-- Run once in the Supabase SQL editor for this project.
create extension if not exists pgcrypto;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  insured text not null,
  broker text not null default '',
  risk_class text not null,
  month text not null,
  year integer not null,
  sum_insured numeric not null,
  premium numeric not null,
  status text not null default 'Pending',
  ro_comment text not null default '',
  created_at timestamptz not null default now()
);

alter table quotes enable row level security;
-- No policies are added on purpose: this table is only ever reached through
-- the service-role key inside the app's Next.js server routes, so RLS blocks
-- every direct client request by default (there is no login yet to gate access).

-- Table-level grants are separate from RLS - service_role needs these
-- explicitly to bypass RLS and reach the table at all.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.quotes to service_role;
