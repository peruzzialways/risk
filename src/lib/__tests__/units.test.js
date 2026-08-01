import { describe, it, expect } from "vitest";
import { UNITS, getUnit } from "../units.js";

describe("UNITS", () => {
  it("has four underwriting units", () => {
    expect(UNITS).toHaveLength(4);
  });

  it("has a unique slug per unit", () => {
    const slugs = UNITS.map((u) => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every unit a non-empty, duplicate-free risk class list", () => {
    for (const unit of UNITS) {
      expect(unit.riskClasses.length).toBeGreaterThan(0);
      expect(new Set(unit.riskClasses).size).toBe(unit.riskClasses.length);
    }
  });

  it("includes the Marine and Transportation risk classes in the order given", () => {
    const marine = UNITS.find((u) => u.slug === "marine-transportation");
    expect(marine.riskClasses).toEqual(["GIT", "Marine Insurance", "Motor Insurance", "Others"]);
  });

  it("includes the Financial Exposure, Casualty and Liability risk classes in the order given", () => {
    const unit = UNITS.find((u) => u.slug === "financial-casualty-liability");
    expect(unit.riskClasses).toEqual([
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
    ]);
  });

  it("gives Retail the Commercial Property classes plus Motor", () => {
    const cpu = UNITS.find((u) => u.slug === "commercial-property");
    const retail = UNITS.find((u) => u.slug === "retail");
    expect(retail.riskClasses).toContain("Motor");
    for (const riskClass of cpu.riskClasses) {
      expect(retail.riskClasses).toContain(riskClass);
    }
  });
});

describe("getUnit", () => {
  it("resolves a known slug", () => {
    expect(getUnit("commercial-property")?.name).toBe("Commercial Property Underwriting Unit");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getUnit("not-a-real-unit")).toBeUndefined();
  });
});
