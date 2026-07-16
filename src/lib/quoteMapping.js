/**
 * Convert between the Supabase `quotes` row shape (snake_case, as stored in
 * Postgres) and the camelCase shape the UI and lib/quotes.js already use.
 */

const FIELD_MAP = {
  insured: "insured",
  broker: "broker",
  riskClass: "risk_class",
  month: "month",
  year: "year",
  sumInsured: "sum_insured",
  premium: "premium",
  status: "status",
  roComment: "ro_comment",
};

/** DB row -> camelCase quote. Postgres `numeric` columns come back as strings, so coerce them. */
export function rowToQuote(row) {
  return {
    id: row.id,
    insured: row.insured,
    broker: row.broker || "",
    riskClass: row.risk_class,
    month: row.month,
    year: Number(row.year),
    sumInsured: Number(row.sum_insured),
    premium: Number(row.premium),
    status: row.status,
    roComment: row.ro_comment || "",
    createdAt: row.created_at,
  };
}

/** camelCase quote (full or partial) -> DB row for insert/update. Unknown keys are dropped. */
export function quoteToRow(quote) {
  const row = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (quote[camel] !== undefined) row[snake] = quote[camel];
  }
  return row;
}
