"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { C } from "../lib/constants.js";
import { UNITS } from "../lib/units.js";

const selectStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.line}`, background: "#FBFCFE",
  color: C.ink, fontSize: 14, outline: "none",
};

export default function DepartmentHome() {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  const handleSelect = (slug) => {
    setSelected(slug);
    if (slug) router.push(`/units/${slug}`);
  };

  return (
    <div className="min-h-screen" style={{ background: C.paper, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: C.ink }}>
      <header className="px-4 py-5 sm:px-6" style={{ background: C.ink }}>
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Image src="/leadway-emblem.png" alt="Leadway Assurance" width={51} height={44} priority />
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8FA3C4" }}>
              Leadway Assurance
            </div>
            <h1 className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}>
              General Business Underwriting Department
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <section className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Choose your unit
          </h2>
          <p className="text-sm mt-1" style={{ color: C.inkSoft }}>
            Select the underwriting unit you want to work in. Each unit has its own quotation and risk register.
          </p>
          <div className="mt-4 max-w-sm">
            <select
              aria-label="Select underwriting unit"
              value={selected}
              onChange={(e) => handleSelect(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select a unit…</option>
              {UNITS.map((u) => (
                <option key={u.slug} value={u.slug}>{u.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UNITS.map((u) => (
            <Link
              key={u.slug}
              href={`/units/${u.slug}`}
              className="block rounded-xl p-5 transition-transform hover:scale-[1.01]"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.inkSoft }}>
                Underwriting unit
              </div>
              <div className="mt-1 text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                {u.name}
              </div>
              <p className="text-sm mt-2" style={{ color: C.inkSoft }}>
                {u.riskClasses.length} risk classes · Quotation &amp; risk register
              </p>
              <div className="mt-4 text-sm font-semibold" style={{ color: C.teal }}>
                Open workspace →
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
