/**
 * Client-side data layer, replacing the old localStorage adapter.
 * Talks to the Next.js Route Handlers under /api/quotes, which are the only
 * thing allowed to reach Supabase.
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

export const quotesApi = {
  list: () => fetch("/api/quotes").then(handle),
  create: (record) =>
    fetch("/api/quotes", { method: "POST", headers: jsonHeaders, body: JSON.stringify(record) }).then(handle),
  update: (id, patch) =>
    fetch(`/api/quotes/${id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify(patch) }).then(handle),
  remove: (id) => fetch(`/api/quotes/${id}`, { method: "DELETE" }).then(handle),
  loadSample: () => fetch("/api/quotes/sample", { method: "POST" }).then(handle),
  clearAll: () => fetch("/api/quotes", { method: "DELETE" }).then(handle),
};
