import { describe, it, expect } from "vitest";
import {
  filterQuotes,
  computeTotals,
  conversionRate,
  monthlyChartData,
  validateQuote,
  normalizeQuote,
} from "../quotes.js";

const QUOTES = [
  { id: "a", insured: "Alpha Mills", broker: "Crownfield", riskClass: "Fire only", month: "Jan", year: 2026, sumInsured: 100, premium: 10, status: "Incepted", roComment: "" },
  { id: "b", insured: "Beta Hotels", broker: "Direct", riskClass: "IAR", month: "Jan", year: 2026, sumInsured: 200, premium: 20, status: "Pending", roComment: "" },
  { id: "c", insured: "Gamma Works", broker: "Meridian", riskClass: "CAR", month: "Mar", year: 2025, sumInsured: 300, premium: 30, status: "Incepted", roComment: "" },
  { id: "d", insured: "Delta Foods", broker: "Crownfield", riskClass: "Fire only", month: "Mar", year: 2026, sumInsured: 400, premium: 40, status: "Pending", roComment: "" },
];

describe("filterQuotes", () => {
  it("returns everything with default filters", () => {
    expect(filterQuotes(QUOTES)).toHaveLength(4);
  });

  it("filters by risk class", () => {
    const out = filterQuotes(QUOTES, { riskClass: "Fire only" });
    expect(out.map((q) => q.id)).toEqual(["a", "d"]);
  });

  it("filters by month", () => {
    expect(filterQuotes(QUOTES, { month: "Mar" }).map((q) => q.id)).toEqual(["c", "d"]);
  });

  it("filters by conversion status", () => {
    expect(filterQuotes(QUOTES, { status: "Incepted" }).map((q) => q.id)).toEqual(["a", "c"]);
  });

  it("searches insured and broker case-insensitively", () => {
    expect(filterQuotes(QUOTES, { search: "beta" }).map((q) => q.id)).toEqual(["b"]);
    expect(filterQuotes(QUOTES, { search: "CROWNFIELD" }).map((q) => q.id)).toEqual(["a", "d"]);
  });

  it("combines filters (AND semantics)", () => {
    const out = filterQuotes(QUOTES, { riskClass: "Fire only", month: "Mar", status: "Pending" });
    expect(out.map((q) => q.id)).toEqual(["d"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterQuotes(QUOTES, { riskClass: "Boiler" })).toEqual([]);
  });
});

describe("computeTotals / conversionRate", () => {
  it("sums premium and sum insured", () => {
    const t = computeTotals(QUOTES);
    expect(t.premium).toBe(100);
    expect(t.sumInsured).toBe(1000);
  });

  it("counts incepted vs pending and incepted premium", () => {
    const t = computeTotals(QUOTES);
    expect(t.incepted).toBe(2);
    expect(t.pending).toBe(2);
    expect(t.inceptedPremium).toBe(40); // 10 + 30
  });

  it("computes conversion rate as a rounded percentage", () => {
    expect(conversionRate(QUOTES)).toBe(50);
    expect(conversionRate([QUOTES[0]])).toBe(100);
  });

  it("handles an empty register without dividing by zero", () => {
    expect(computeTotals([])).toEqual({ premium: 0, sumInsured: 0, incepted: 0, pending: 0, inceptedPremium: 0 });
    expect(conversionRate([])).toBe(0);
  });
});

describe("monthlyChartData", () => {
  it("returns one row per calendar month", () => {
    const rows = monthlyChartData(QUOTES);
    expect(rows).toHaveLength(12);
    expect(rows[0].month).toBe("Jan");
    expect(rows[11].month).toBe("Dec");
  });

  it("splits premium by conversion status per month", () => {
    const rows = monthlyChartData(QUOTES);
    const jan = rows.find((r) => r.month === "Jan");
    const mar = rows.find((r) => r.month === "Mar");
    expect(jan).toMatchObject({ Incepted: 10, Pending: 20 });
    expect(mar).toMatchObject({ Incepted: 30, Pending: 40 });
  });

  it("returns zeros for months with no activity", () => {
    const dec = monthlyChartData(QUOTES).find((r) => r.month === "Dec");
    expect(dec).toMatchObject({ Incepted: 0, Pending: 0 });
  });
});

describe("validateQuote", () => {
  const valid = {
    insured: "Alpha Mills", broker: "", riskClass: "Fire only",
    month: "Jan", year: "2026", sumInsured: "100", premium: "10",
    status: "Pending", roComment: "",
  };

  it("accepts a valid form", () => {
    expect(validateQuote(valid)).toBeNull();
  });

  it("rejects missing insured name", () => {
    expect(validateQuote({ ...valid, insured: "  " })).toMatch(/insured/i);
  });

  it("rejects invalid sum insured", () => {
    expect(validateQuote({ ...valid, sumInsured: "" })).toMatch(/sum insured/i);
    expect(validateQuote({ ...valid, sumInsured: "abc" })).toMatch(/sum insured/i);
    expect(validateQuote({ ...valid, sumInsured: "-5" })).toMatch(/sum insured/i);
  });

  it("rejects invalid premium", () => {
    expect(validateQuote({ ...valid, premium: "abc" })).toMatch(/premium/i);
  });

  it("accepts zero amounts", () => {
    expect(validateQuote({ ...valid, sumInsured: "0", premium: "0" })).toBeNull();
  });

  it("rejects out-of-range years", () => {
    expect(validateQuote({ ...valid, year: "1990" })).toMatch(/year/i);
    expect(validateQuote({ ...valid, year: "3000" })).toMatch(/year/i);
    expect(validateQuote({ ...valid, year: "" })).toMatch(/year/i);
  });
});

describe("normalizeQuote", () => {
  it("trims strings and coerces numbers", () => {
    const record = normalizeQuote({
      insured: "  Alpha Mills  ", broker: " Crownfield ", riskClass: "CAR",
      month: "Mar", year: "2026", sumInsured: "300", premium: "30",
      status: "Incepted", roComment: "  bound  ",
    });
    expect(record).toEqual({
      insured: "Alpha Mills", broker: "Crownfield", riskClass: "CAR",
      month: "Mar", year: 2026, sumInsured: 300, premium: 30,
      status: "Incepted", roComment: "bound",
    });
  });
});
