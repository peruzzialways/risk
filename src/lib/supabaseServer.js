import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key. Never import this
 * file from a "use client" component - it must only run inside Route
 * Handlers, where the key stays on the server and RLS is bypassed on purpose
 * (the `quotes` table has no policies, so this is the only way in).
 */
let client;

export function getSupabaseServerClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
