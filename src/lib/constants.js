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

export const RISK_CLASSES = [
  "All Risk",
  "Art Works All Risk",
  "Boiler",
  "Burglary",
  "Business Interruption",
  "CAR",
  "Combined Policy",
  "Delay In Start Up",
  "EAR",
  "Electronic Equipment",
  "Fire and Special Perils",
  "Fire only",
  "Householder",
  "IAR",
  "Plant All Risk",
  "Other",
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CURRENT_YEAR = new Date().getFullYear();

export const makeBlankForm = () => ({
  insured: "",
  broker: "",
  riskClass: RISK_CLASSES[0],
  month: MONTHS[new Date().getMonth()],
  year: String(CURRENT_YEAR),
  sumInsured: "",
  premium: "",
  status: "Pending",
  roComment: "",
});
