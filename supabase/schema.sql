-- Run once in the Supabase SQL editor for a brand-new project. If the
-- `quotes` table already exists, run the files in supabase/migrations/
-- instead, in order.
create extension if not exists pgcrypto;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  unit text not null default 'commercial-property',
  insured text not null,
  broker text not null default '',
  officer text not null default '',
  risk_class text not null,
  month text not null,
  year integer not null,
  sum_insured numeric not null,
  premium numeric not null,
  status text not null default 'Pending',
  ro_comment text not null default '',
  created_at timestamptz not null default now()
);

-- `unit` stays free text (validated only at the app layer against
-- src/lib/units.js) so adding a new underwriting unit later is a pure code
-- change - no migration required.
create index idx_quotes_unit on quotes(unit);

alter table quotes enable row level security;
-- No policies are added on purpose: this table is only ever reached through
-- the service-role key inside the app's Next.js server routes, so RLS blocks
-- every direct client request by default (there is no login yet to gate access).

-- Table-level grants are separate from RLS - service_role needs these
-- explicitly to bypass RLS and reach the table at all.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.quotes to service_role;
