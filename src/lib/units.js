/**
 * Central registry of underwriting units. Every unit-aware part of the app
 * (routes, API, dropdowns) reads from this list - adding a new unit means
 * adding one entry here, nothing else.
 */

const COMMERCIAL_PROPERTY_RISK_CLASSES = [
  "All Risks",
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
  "Others",
];

export const UNITS = [
  {
    slug: "commercial-property",
    name: "Commercial Property Underwriting Unit",
    riskClasses: COMMERCIAL_PROPERTY_RISK_CLASSES,
  },
  {
    slug: "marine-transportation",
    name: "Marine and Transportation Unit",
    riskClasses: ["GIT", "Marine Insurance", "Motor Insurance", "Others"],
  },
  {
    slug: "financial-casualty-liability",
    name: "Financial Exposure, Casualty and Liability Unit",
    riskClasses: [
      "Group Personal Accident (GPA)",
      "Employer's Liability (EL)",
      "Money Insurance",
      "Public Liability",
      "Fidelity Guarantee",
      "Cyber Liability",
      "Corporate Protection Plan",
      "Bond",
      "Professional Indemnity",
      "Healthcare Professional Indemnity",
      "Occupiers Liability",
      "Builders Liablity",
 "General Third Party Liability (GTPA)",
      "Bailee",
      "Product Liability",
      "Others",
    ],
  },
  {
    // Commercial Property's list, with "Motor" inserted alphabetically
    // (between IAR and Plant All Risk); "Others" stays last.
    slug: "retail",
    name: "Retail Unit",
    riskClasses: [
      "All Risks",
      "Art Works All Risk",
      "Public Liabilty",
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
      "Motor",
      "Plant All Risk",
      "Others",
    ],
  },
];

export const getUnit = (slug) => UNITS.find((u) => u.slug === slug);
