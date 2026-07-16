import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { cleanSheetName, detailRows, summarize, summaryRow, buildWorkbook } from "../report.js";

const QUOTES = [
  { id: "a", insured: "Alpha Mills", broker: "Crownfield", riskClass: "Fire only", month: "Jan", year: 2026, sumInsured: 100, premium: 10, status: "Incepted", roComment: "Bound" },
  { id: "b", insured: "Beta Hotels", broker: "", riskClass: "IAR", month: "Mar", year: 2026, sumInsured: 200, premium: 20, status: "Pending", roComment: "" },
  { id: "c", insured: "Gamma Works", broker: "Meridian", riskClass: "CAR", month: "Mar", year: 2025, sumInsured: 300, premium: 30, status: "Incepted", roComment: "Paid" },
];

describe("cleanSheetName", () => {
  it("strips characters Excel forbids in sheet names", () => {
    expect(cleanSheetName("A/B\\C?D*E[F]G:H")).toBe("ABCDEFGH");
  });

  it("truncates to 31 characters", () => {
    expect(cleanSheetName("X".repeat(40))).toHaveLength(31);
  });

  it("never returns an empty name", () => {
    expect(cleanSheetName("////")).toBe("Sheet");
  });
});

describe("detailRows", () => {
  it("maps every field of the risk to report columns", () => {
    const [row] = detailRows([QUOTES[0]]);
    expect(row).toEqual({
      "Insured / Risk": "Alpha Mills",
      "Broker / Source": "Crownfield",
      "Risk Class": "Fire only",
      Month: "Jan",
      Year: 2026,
      "Sum Insured (\u20A6)": 100,
      "Premium (\u20A6)": 10,
      "Conversion Status": "Incepted",
      "RO Comment": "Bound",
    });
  });
});

describe("summarize / summaryRow", () => {
  it("aggregates counts, amounts and conversion rate", () => {
    const s = summarize(QUOTES);
    expect(s).toEqual({
      count: 3,
      sumInsured: 600,
      premium: 60,
      inceptedCount: 2,
      pendingCount: 1,
      inceptedPremium: 40,
      rate: 67,
    });
  });

  it("produces a labelled summary row", () => {
    const row = summaryRow("Mar", "Month", QUOTES.filter((q) => q.month === "Mar"));
    expect(row.Month).toBe("Mar");
    expect(row["No. of Quotes"]).toBe(2);
    expect(row["Total Premium (\u20A6)"]).toBe(50);
    expect(row["Conversion Rate (%)"]).toBe(50);
  });

  it("returns zeros for empty groups", () => {
    const row = summaryRow("Dec", "Month", []);
    expect(row["No. of Quotes"]).toBe(0);
    expect(row["Conversion Rate (%)"]).toBe(0);
  });
});

describe("buildWorkbook", () => {
  const wb = buildWorkbook(QUOTES);

  it("always includes the register-wide and summary sheets", () => {
    expect(wb.SheetNames).toContain("All Risks");
    expect(wb.SheetNames).toContain("Summary by Class");
    expect(wb.SheetNames).toContain("Summary by Month");
    expect(wb.SheetNames).toContain("Summary by Year");
  });

  it("adds a full-detail sheet per risk class with records only", () => {
    expect(wb.SheetNames).toContain("Fire only");
    expect(wb.SheetNames).toContain("IAR");
    expect(wb.SheetNames).toContain("CAR");
    expect(wb.SheetNames).not.toContain("Boiler");
  });

  it("adds per-month and per-year detail sheets for active periods only", () => {
    expect(wb.SheetNames).toContain("Month - Jan");
    expect(wb.SheetNames).toContain("Month - Mar");
    expect(wb.SheetNames).not.toContain("Month - Dec");
    expect(wb.SheetNames).toContain("Year - 2025");
    expect(wb.SheetNames).toContain("Year - 2026");
  });

  it("writes the correct rows into the All Risks sheet", () => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["All Risks"]);
    expect(rows).toHaveLength(3);
    expect(rows[0]["Insured / Risk"]).toBe("Alpha Mills");
    expect(rows[2]["Premium (\u20A6)"]).toBe(30);
  });

  it("summary by class ends with a TOTAL row matching the register", () => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Summary by Class"]);
    const total = rows[rows.length - 1];
    expect(total["Risk Class"]).toBe("TOTAL");
    expect(total["No. of Quotes"]).toBe(3);
    expect(total["Total Sum Insured (\u20A6)"]).toBe(600);
  });

  it("per-year sheets contain only that year's risks", () => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Year - 2025"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]["Insured / Risk"]).toBe("Gamma Works");
  });
});
