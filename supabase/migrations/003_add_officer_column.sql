-- Run once in the Supabase SQL editor for the existing project.
-- Existing rows default to '' (shown as "Unassigned" in the officer-activity
-- chart and summary sheet) since they predate this field.
alter table quotes add column if not exists officer text not null default '';
