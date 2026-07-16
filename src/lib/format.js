/** Full Naira amount with thousands separators, e.g. ₦1,500,000 */
export const fmtN = (n) =>
  "\u20A6" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

/** Compact Naira amount, e.g. ₦2.50bn / ₦4.3m / ₦3k */
export const fmtCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return "\u20A6" + (v / 1e9).toFixed(2) + "bn";
  if (v >= 1e6) return "\u20A6" + (v / 1e6).toFixed(1) + "m";
  if (v >= 1e3) return "\u20A6" + (v / 1e3).toFixed(0) + "k";
  return "\u20A6" + v.toFixed(0);
};
