import { notFound } from "next/navigation";
import { UNITS, getUnit } from "@/lib/units.js";
import UnitRegister from "@/components/UnitRegister.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";

export function generateStaticParams() {
  return UNITS.map((u) => ({ unit: u.slug }));
}

export function generateMetadata({ params }) {
  const unit = getUnit(params.unit);
  return { title: unit ? `${unit.name} — Quotation & Risk Register` : "Unit not found" };
}

export default function UnitPage({ params }) {
  const unit = getUnit(params.unit);
  if (!unit) notFound();

  return (
    <ErrorBoundary>
      <UnitRegister unit={unit} />
    </ErrorBoundary>
  );
}
