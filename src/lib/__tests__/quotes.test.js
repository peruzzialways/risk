import { describe, it, expect } from "vitest";
import {
  filterQuotes,
  computeTotals,
  conversionRate,
  monthlyChartData,
  riskClassChartData,
  officerActivity,
  validateQuote,
  normalizeQuote,
} from "../quotes.js";

const QUOTES = [
  { id: "a", insured: "Alpha Mills", broker: "Crownfield", officer: "Ada Okafor", riskClass: "Fire only", month: "Jan", year: 2026, sumInsured: 100, premium: 10, status: "Incepted", roComment: "" },
  { id: "b", insured: "Beta Hotels", broker: "Direct", officer: "Ben Musa", riskClass: "IAR", month: "Jan", year: 2026, sumInsured: 200, premium: 20, status: "Pending", roComment: "" },
  { id: "c", insured: "Gamma Works", broker: "Meridian", officer: "Ada Okafor", riskClass: "CAR", month: "Mar", year: 2025, sumInsured: 300, premium: 30, status: "Incepted", roComment: "" },
  { id: "d", insured: "Delta Foods", broker: "Crownfield", officer: "Ben Musa", riskClass: "Fire only", month: "Mar", year: 2026, sumInsured: 400, premium: 40, status: "Pending", roComment: "" },
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

  it("filters by officer", () => {
    expect(filterQuotes(QUOTES, { officer: "Ada Okafor" }).map((q) => q.id)).toEqual(["a", "c"]);
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

describe("riskClassChartData", () => {
  const riskClasses = ["Fire only", "IAR", "CAR", "Boiler"];

  it("returns one row per risk class given, in that order", () => {
    const rows = riskClassChartData(QUOTES, riskClasses);
    expect(rows.map((r) => r.riskClass)).toEqual(riskClasses);
  });

  it("splits premium by conversion status per class", () => {
    const rows = riskClassChartData(QUOTES, riskClasses);
    expect(rows.find((r) => r.riskClass === "Fire only")).toMatchObject({ Incepted: 10, Pending: 40 });
    expect(rows.find((r) => r.riskClass === "CAR")).toMatchObject({ Incepted: 30, Pending: 0 });
  });

  it("returns zeros for a class with no activity", () => {
    const rows = riskClassChartData(QUOTES, riskClasses);
    expect(rows.find((r) => r.riskClass === "Boiler")).toMatchObject({ Incepted: 0, Pending: 0 });
  });
});

describe("officerActivity", () => {
  it("counts quotes per officer, busiest first", () => {
    expect(officerActivity(QUOTES)).toEqual([
      { officer: "Ada Okafor", count: 2 },
      { officer: "Ben Musa", count: 2 },
    ]);
  });

  it("buckets quotes with no officer as Unassigned", () => {
    const rows = [...QUOTES, { id: "e", insured: "Epsilon", officer: "", riskClass: "CAR", month: "Jan", year: 2026, sumInsured: 1, premium: 1, status: "Pending", roComment: "" }];
    expect(officerActivity(rows).find((r) => r.officer === "Unassigned")).toEqual({ officer: "Unassigned", count: 1 });
  });

  it("returns an empty list for an empty register", () => {
    expect(officerActivity([])).toEqual([]);
  });
});

describe("validateQuote", () => {
  const valid = {
    insured: "Alpha Mills", broker: "", officer: "Ada Okafor", riskClass: "Fire only",
    month: "Jan", year: "2026", sumInsured: "100", premium: "10",
    status: "Pending", roComment: "",
  };

  it("accepts a valid form", () => {
    expect(validateQuote(valid)).toBeNull();
  });

  it("rejects missing insured name", () => {
    expect(validateQuote({ ...valid, insured: "  " })).toMatch(/insured/i);
  });

  it("rejects missing officer", () => {
    expect(validateQuote({ ...valid, officer: "" })).toMatch(/officer/i);
    expect(validateQuote({ ...valid, officer: "   " })).toMatch(/officer/i);
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
      insured: "  Alpha Mills  ", broker: " Crownfield ", officer: " Ada Okafor ", riskClass: "CAR",
      month: "Mar", year: "2026", sumInsured: "300", premium: "30",
      status: "Incepted", roComment: "  bound  ",
    });
    expect(record).toEqual({
      insured: "Alpha Mills", broker: "Crownfield", officer: "Ada Okafor", riskClass: "CAR",
      month: "Mar", year: 2026, sumInsured: 300, premium: 30,
      status: "Incepted", roComment: "bound",
    });
  });
});
