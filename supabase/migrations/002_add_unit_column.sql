-- Run once in the Supabase SQL editor for the existing project (schema.sql
-- already has this column for brand-new setups). Safe to run against a
-- table that already has data: existing rows default to 'commercial-property'
-- so they stay correctly filed under that unit.
alter table quotes add column if not exists unit text not null default 'commercial-property';
create index if not exists idx_quotes_unit on quotes(unit);
