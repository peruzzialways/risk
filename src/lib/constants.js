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
  "Fire and Special Perils",
  "Fire only",
  "IAR",
  "BI",
  "Burglary",
  "CAR",
  "EAR",
  "Plant All Risk",
  "Electronic Equipment",
  "Boiler",
  "Householder",
  "All Risk",
  "Delay In Start Up",
  "Art Works All Risk",
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

const SAMPLE_ROWS = [
  { insured: "Adekunle Manufacturing Ltd", broker: "Crownfield Brokers", riskClass: "Fire and Special Perils", month: "Jan", sumInsured: 850000000, premium: 4250000, status: "Incepted", roComment: "Renewal confirmed, premium received in full." },
  { insured: "Harbourpoint Logistics", broker: "Direct", riskClass: "Burglary", month: "Feb", sumInsured: 120000000, premium: 960000, status: "Pending", roComment: "Client requested revised excess terms; awaiting response." },
  { insured: "Crestline Hotels & Suites", broker: "Meridian Risk Services", riskClass: "IAR", month: "Feb", sumInsured: 2400000000, premium: 14400000, status: "Incepted", roComment: "Incepted after survey. Sprinkler recommendation noted." },
  { insured: "Bluewave Power Projects", broker: "Crownfield Brokers", riskClass: "CAR", month: "Mar", sumInsured: 5600000000, premium: 42000000, status: "Pending", roComment: "Competing quote from market; RO negotiating rate." },
  { insured: "Sterling Foods Processing", broker: "Meridian Risk Services", riskClass: "BI", month: "Mar", sumInsured: 950000000, premium: 5700000, status: "Incepted", roComment: "Bound with 12-month indemnity period." },
  { insured: "Nova Data Centres", broker: "Direct", riskClass: "Electronic Equipment", month: "Apr", sumInsured: 680000000, premium: 6120000, status: "Incepted", roComment: "Client paid 100%. Cover note issued." },
  { insured: "Ridgeway Estates", broker: "Palmgrove Insurance Brokers", riskClass: "Householder", month: "May", sumInsured: 75000000, premium: 375000, status: "Pending", roComment: "Awaiting KYC documents from insured." },
  { insured: "Zephyr Engineering Works", broker: "Crownfield Brokers", riskClass: "Plant All Risk", month: "Jun", sumInsured: 430000000, premium: 3870000, status: "Pending", roComment: "Follow-up call scheduled; budget approval pending." },
  { insured: "Lighthouse Galleries", broker: "Direct", riskClass: "Art Works All Risk", month: "Jun", sumInsured: 310000000, premium: 4650000, status: "Incepted", roComment: "Valuation certificates received. Policy issued." },
  { insured: "Summit Breweries Expansion", broker: "Meridian Risk Services", riskClass: "Delay In Start Up", month: "Jul", sumInsured: 1800000000, premium: 19800000, status: "Pending", roComment: "Reinsurance support being arranged before inception." },
];

/** Sample rows with the current year applied, ready for server-side insert (no id/createdAt - the database assigns those). */
export const sampleRowsForInsert = () => SAMPLE_ROWS.map((q) => ({ ...q, year: CURRENT_YEAR }));
