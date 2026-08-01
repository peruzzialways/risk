/**
 * Client-side data layer, replacing the old localStorage adapter.
 * Talks to the Next.js Route Handlers under /api/units/:unit/quotes, which
 * are the only thing allowed to reach Supabase.
 */
async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body - keep the generic message
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const jsonHeaders = { "Content-Type": "application/json" };

/** Build a quotesApi bound to one underwriting unit. */
export function makeQuotesApi(unitSlug) {
  const base = `/api/units/${unitSlug}/quotes`;
  return {
    list: () => fetch(base).then(handle),
    create: (record) =>
      fetch(base, { method: "POST", headers: jsonHeaders, body: JSON.stringify(record) }).then(handle),
    update: (id, patch) =>
      fetch(`${base}/${id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify(patch) }).then(handle),
    remove: (id) => fetch(`${base}/${id}`, { method: "DELETE" }).then(handle),
    clearAll: () => fetch(base, { method: "DELETE" }).then(handle),
  };
}
