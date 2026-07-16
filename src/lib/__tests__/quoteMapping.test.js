import { describe, it, expect } from "vitest";
import { rowToQuote, quoteToRow } from "../quoteMapping.js";

const ROW = {
  id: "1", insured: "Alpha Mills", broker: "Crownfield", risk_class: "Fire only",
  month: "Jan", year: "2026", sum_insured: "100000000", premium: "1000000",
  status: "Incepted", ro_comment: "Bound", created_at: "2026-01-01T00:00:00Z",
};

describe("rowToQuote", () => {
  it("maps snake_case DB fields to camelCase and coerces numeric strings", () => {
    expect(rowToQuote(ROW)).toEqual({
      id: "1", insured: "Alpha Mills", broker: "Crownfield", riskClass: "Fire only",
      month: "Jan", year: 2026, sumInsured: 100000000, premium: 1000000,
      status: "Incepted", roComment: "Bound", createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("defaults missing broker/comment to empty strings", () => {
    const q = rowToQuote({ ...ROW, broker: null, ro_comment: null });
    expect(q.broker).toBe("");
    expect(q.roComment).toBe("");
  });
});

describe("quoteToRow", () => {
  it("maps a full camelCase quote to a snake_case row", () => {
    expect(
      quoteToRow({
        insured: "Alpha Mills", broker: "Crownfield", riskClass: "Fire only",
        month: "Jan", year: 2026, sumInsured: 100000000, premium: 1000000,
        status: "Incepted", roComment: "Bound",
      })
    ).toEqual({
      insured: "Alpha Mills", broker: "Crownfield", risk_class: "Fire only",
      month: "Jan", year: 2026, sum_insured: 100000000, premium: 1000000,
      status: "Incepted", ro_comment: "Bound",
    });
  });

  it("only includes keys that are present, for partial patches", () => {
    expect(quoteToRow({ status: "Pending" })).toEqual({ status: "Pending" });
    expect(quoteToRow({ roComment: "hi" })).toEqual({ ro_comment: "hi" });
  });

  it("ignores keys with no DB column, like id/createdAt", () => {
    expect(quoteToRow({ id: "x", createdAt: 1, status: "Pending" })).toEqual({ status: "Pending" });
  });
});
