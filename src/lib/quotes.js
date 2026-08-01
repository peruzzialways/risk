import { MONTHS, CURRENT_YEAR } from "./constants.js";

/** Apply risk class / month / status / officer / free-text filters to the register. */
export function filterQuotes(quotes, { riskClass = "All", month = "All", status = "All", officer = "All", search = "" } = {}) {
  const s = search.trim().toLowerCase();
  return quotes.filter(
    (q) =>
      (riskClass === "All" || q.riskClass === riskClass) &&
      (month === "All" || q.month === month) &&
      (status === "All" || q.status === status) &&
      (officer === "All" || q.officer === officer) &&
      (!s ||
        q.insured.toLowerCase().includes(s) ||
        (q.broker || "").toLowerCase().includes(s))
  );
}

/** Aggregate premium / sum insured / conversion figures for a set of quotes. */
export function computeTotals(rows) {
  const t = { premium: 0, sumInsured: 0, incepted: 0, pending: 0, inceptedPremium: 0 };
  for (const q of rows) {
    t.premium += q.premium;
    t.sumInsured += q.sumInsured;
    if (q.status === "Incepted") {
      t.incepted++;
      t.inceptedPremium += q.premium;
    } else {
      t.pending++;
    }
  }
  return t;
}

/** Conversion rate by count, 0-100. */
export const conversionRate = (rows) => {
  const t = computeTotals(rows);
  return rows.length ? Math.round((t.incepted / rows.length) * 100) : 0;
};

/** Jan-Dec rows for the stacked premium bar chart. */
export function monthlyChartData(rows) {
  return MONTHS.map((m) => {
    const monthRows = rows.filter((q) => q.month === m);
    return {
      month: m,
      Incepted: monthRows
        .filter((q) => q.status === "Incepted")
        .reduce((a, q) => a + q.premium, 0),
      Pending: monthRows
        .filter((q) => q.status === "Pending")
        .reduce((a, q) => a + q.premium, 0),
    };
  });
}

/** One row per risk class for the stacked premium-by-class comparison bar chart. */
export function riskClassChartData(rows, riskClasses) {
  return riskClasses.map((rc) => {
    const classRows = rows.filter((q) => q.riskClass === rc);
    return {
      riskClass: rc,
      Incepted: classRows
        .filter((q) => q.status === "Incepted")
        .reduce((a, q) => a + q.premium, 0),
      Pending: classRows
        .filter((q) => q.status === "Pending")
        .reduce((a, q) => a + q.premium, 0),
    };
  });
}

/** Quote count per officer, sorted busiest first, for the officer-activity pie chart. */
export function officerActivity(rows) {
  const counts = new Map();
  for (const q of rows) {
    const officer = q.officer || "Unassigned";
    counts.set(officer, (counts.get(officer) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([officer, count]) => ({ officer, count }))
    .sort((a, b) => b.count - a.count);
}

/** Validate the quote form. Returns an error string, or null when valid. */
export function validateQuote(form) {
  if (!form.insured || !form.insured.trim()) return "Enter the insured / risk name.";
  if (!form.officer || !form.officer.trim()) return "Enter the officer in charge.";
  const si = Number(form.sumInsured);
  if (form.sumInsured === "" || form.sumInsured == null || isNaN(si) || si < 0)
    return "Enter a valid sum insured.";
  const pr = Number(form.premium);
  if (form.premium === "" || form.premium == null || isNaN(pr) || pr < 0)
    return "Enter a valid premium.";
  const yr = Number(form.year);
  if (!form.year || isNaN(yr) || yr < 2000 || yr > 2100)
    return `Enter a valid year (e.g. ${CURRENT_YEAR}).`;
  return null;
}

/** Convert a validated form into a clean quote record (no id/createdAt). */
export function normalizeQuote(form) {
  return {
    insured: form.insured.trim(),
    broker: (form.broker || "").trim(),
    officer: form.officer.trim(),
    riskClass: form.riskClass,
    month: form.month,
    year: Number(form.year),
    sumInsured: Number(form.sumInsured),
    premium: Number(form.premium),
    status: form.status,
    roComment: (form.roComment || "").trim(),
  };
}
