import * as XLSX from "xlsx";
import { MONTHS, CURRENT_YEAR } from "./constants.js";
import { fmtDate } from "./format.js";

/** Excel sheet names: max 31 chars, no \ / ? * [ ] : characters. */
export const cleanSheetName = (name) =>
  String(name).replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet";

/** Map quote records to full-information report rows. */
export const detailRows = (rows) =>
  rows.map((q) => ({
    "Insured / Risk": q.insured,
    "Broker / Source": q.broker || "",
    Officer: q.officer || "",
    "Risk Class": q.riskClass,
    Month: q.month,
    Year: q.year || CURRENT_YEAR,
    "Date Logged": fmtDate(q.createdAt),
    "Sum Insured (₦)": q.sumInsured,
    "Premium (₦)": q.premium,
    "Conversion Status": q.status,
    "RO Comment": q.roComment || "",
  }));

/** Aggregate figures for a group of quotes. */
export const summarize = (rows) => {
  const incepted = rows.filter((q) => q.status === "Incepted");
  return {
    count: rows.length,
    sumInsured: rows.reduce((a, q) => a + q.sumInsured, 0),
    premium: rows.reduce((a, q) => a + q.premium, 0),
    inceptedCount: incepted.length,
    pendingCount: rows.length - incepted.length,
    inceptedPremium: incepted.reduce((a, q) => a + q.premium, 0),
    rate: rows.length ? Math.round((incepted.length / rows.length) * 100) : 0,
  };
};

export const summaryRow = (label, labelKey, rows) => {
  const s = summarize(rows);
  return {
    [labelKey]: label,
    "No. of Quotes": s.count,
    "Total Sum Insured (₦)": s.sumInsured,
    "Total Premium (₦)": s.premium,
    Incepted: s.inceptedCount,
    Pending: s.pendingCount,
    "Incepted Premium (₦)": s.inceptedPremium,
    "Conversion Rate (%)": s.rate,
  };
};

const DETAIL_WIDTHS = [30, 24, 20, 24, 8, 8, 14, 18, 16, 18, 45];
const SUMMARY_WIDTHS = [26, 14, 22, 20, 10, 10, 22, 20];

const addSheet = (wb, name, rows, widths) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (widths) ws["!cols"] = widths.map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName(name));
};

/**
 * Build the full report workbook:
 *  - "All Risks" full detail
 *  - Summary by Class / Month / Year
 *  - Full-detail sheet per risk class, per month, per year (non-empty only)
 * `riskClasses` is the owning unit's risk class list (each unit offers a
 * different set), used to drive the per-class summary and detail sheets.
 */
export function buildWorkbook(quotes, riskClasses) {
  const wb = XLSX.utils.book_new();
  const years = [...new Set(quotes.map((q) => q.year || CURRENT_YEAR))].sort();
  const officers = [...new Set(quotes.map((q) => q.officer).filter(Boolean))].sort();

  addSheet(wb, "All Risks", detailRows(quotes), DETAIL_WIDTHS);

  addSheet(
    wb,
    "Summary by Officer",
    [
      ...officers.map((o) => summaryRow(o, "Officer", quotes.filter((q) => q.officer === o))),
      summaryRow("TOTAL", "Officer", quotes),
    ],
    SUMMARY_WIDTHS
  );

  addSheet(
    wb,
    "Summary by Class",
    [
      ...riskClasses.map((rc) =>
        summaryRow(rc, "Risk Class", quotes.filter((q) => q.riskClass === rc))
      ),
      summaryRow("TOTAL", "Risk Class", quotes),
    ],
    SUMMARY_WIDTHS
  );

  addSheet(
    wb,
    "Summary by Month",
    [
      ...MONTHS.map((m) => summaryRow(m, "Month", quotes.filter((q) => q.month === m))),
      summaryRow("TOTAL", "Month", quotes),
    ],
    SUMMARY_WIDTHS
  );

  addSheet(
    wb,
    "Summary by Year",
    [
      ...years.map((y) =>
        summaryRow(String(y), "Year", quotes.filter((q) => (q.year || CURRENT_YEAR) === y))
      ),
      summaryRow("TOTAL", "Year", quotes),
    ],
    SUMMARY_WIDTHS
  );

  riskClasses.forEach((rc) => {
    const rows = quotes.filter((q) => q.riskClass === rc);
    if (rows.length) addSheet(wb, rc, detailRows(rows), DETAIL_WIDTHS);
  });

  MONTHS.forEach((m) => {
    const rows = quotes.filter((q) => q.month === m);
    if (rows.length) addSheet(wb, "Month - " + m, detailRows(rows), DETAIL_WIDTHS);
  });

  years.forEach((y) => {
    const rows = quotes.filter((q) => (q.year || CURRENT_YEAR) === y);
    if (rows.length) addSheet(wb, "Year - " + y, detailRows(rows), DETAIL_WIDTHS);
  });

  return wb;
}

/** Build and trigger the browser download. `unit` ({ name, riskClasses }) drives the per-class sheets and filename prefix. */
export function exportWorkbook(quotes, unit) {
  if (!quotes.length) return;
  const wb = buildWorkbook(quotes, unit?.riskClasses || []);
  const stamp = new Date().toISOString().slice(0, 10);
  const prefix = unit?.name ? `${unit.name.replace(/[^a-zA-Z0-9]+/g, "_")}_` : "";
  XLSX.writeFile(wb, `${prefix}Risk_Quotation_Report_${stamp}.xlsx`);
}
