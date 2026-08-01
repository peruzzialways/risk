/* Design tokens */
export const C = {
  ink: "#1B2A41",
  inkSoft: "#51617D",
  paper: "#F3F5F8",
  card: "#FFFFFF",
  line: "#DFE5EE",
  teal: "#0E7C6B",
  tealSoft: "#E1F1ED",
  amber: "#B45309",
  amberSoft: "#FBEFDD",
  red: "#B3261E",
  navyChip: "#EAEEF5",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CURRENT_YEAR = new Date().getFullYear();

/**
 * Validated categorical palette (identity encoding - e.g. one color per
 * officer), fixed order for CVD safety. Past 8 series, fold into "Other"
 * (OTHER_COLOR) rather than generating a 9th hue.
 */
export const CATEGORICAL_COLORS = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"];
export const OTHER_COLOR = "#898781";

export const makeBlankForm = (riskClasses) => ({
  insured: "",
  broker: "",
  officer: "",
  riskClass: riskClasses[0],
  month: MONTHS[new Date().getMonth()],
  year: String(CURRENT_YEAR),
  sumInsured: "",
  premium: "",
  status: "Pending",
  roComment: "",
});
