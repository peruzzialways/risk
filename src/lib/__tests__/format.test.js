import { describe, it, expect } from "vitest";
import { fmtN, fmtCompact, fmtDate } from "../format.js";

describe("fmtN", () => {
  it("formats full naira amounts with thousands separators", () => {
    expect(fmtN(1500000)).toBe("\u20A61,500,000");
    expect(fmtN(850000000)).toBe("\u20A6850,000,000");
  });

  it("handles zero, null and undefined safely", () => {
    expect(fmtN(0)).toBe("\u20A60");
    expect(fmtN(null)).toBe("\u20A60");
    expect(fmtN(undefined)).toBe("\u20A60");
  });
});

describe("fmtCompact", () => {
  it("formats billions with two decimals", () => {
    expect(fmtCompact(2500000000)).toBe("\u20A62.50bn");
  });

  it("formats millions with one decimal", () => {
    expect(fmtCompact(1200000)).toBe("\u20A61.2m");
  });

  it("formats thousands with no decimals", () => {
    expect(fmtCompact(3000)).toBe("\u20A63k");
  });

  it("formats sub-thousand values as plain naira", () => {
    expect(fmtCompact(950)).toBe("\u20A6950");
    expect(fmtCompact(0)).toBe("\u20A60");
  });
});

describe("fmtDate", () => {
  it("formats an ISO timestamp as day, short month, year", () => {
    expect(fmtDate("2026-07-17T21:19:25.909874+00:00")).toBe("17 Jul 2026");
  });

  it("formats an epoch-ms value", () => {
    expect(fmtDate(Date.UTC(2024, 0, 15, 12, 0, 0))).toBe("15 Jan 2024");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
    expect(fmtDate("not-a-date")).toBe("");
  });
});
