"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { C, RISK_CLASSES, MONTHS, CURRENT_YEAR, makeBlankForm } from "../lib/constants.js";
import { fmtN, fmtCompact } from "../lib/format.js";
import {
  filterQuotes, computeTotals, conversionRate, monthlyChartData,
  validateQuote, normalizeQuote,
} from "../lib/quotes.js";
import { exportWorkbook } from "../lib/report.js";
import { quotesApi } from "../lib/quotesApi.js";

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */
function StatusChip({ status, onClick }) {
  const incepted = status === "Incepted";
  return (
    <button
      onClick={onClick}
      title="Click to toggle conversion status"
      className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-transform hover:scale-105"
      style={{
        background: incepted ? C.tealSoft : C.amberSoft,
        color: incepted ? C.teal : C.amber,
        border: `1px solid ${incepted ? C.teal : C.amber}33`,
      }}
    >
      {incepted ? "● Incepted" : "○ Pending"}
    </button>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="min-w-0 rounded-xl px-4 py-4 sm:px-5"
      style={{ background: C.card, border: `1px solid ${C.line}` }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.inkSoft }}>
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-semibold truncate"
        style={{ color: accent || C.ink, fontVariantNumeric: "tabular-nums" }}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs" style={{ color: C.inkSoft }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkSoft }}>
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.line}`, background: "#FBFCFE",
  color: C.ink, fontSize: 14, outline: "none",
};

/** RO comment cell/field, shared by the desktop table row and the mobile card. */
function CommentCell({ quote, editing, draft, onDraftChange, onStartEdit, onSave, onCancel }) {
  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={2}
          style={{ ...inputStyle, fontSize: 13 }}
          aria-label="Edit RO comment"
          autoFocus
        />
        <div className="mt-1 flex gap-2">
          <button onClick={onSave} className="text-xs font-semibold text-white px-2.5 py-1 rounded" style={{ background: C.teal }}>Save</button>
          <button onClick={onCancel} className="text-xs font-semibold px-2.5 py-1 rounded" style={{ color: C.inkSoft }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onStartEdit}
      className="text-left text-xs leading-snug hover:underline"
      style={{ color: quote.roComment ? C.ink : C.inkSoft }}
      title="Click to edit comment"
    >
      {quote.roComment || "Add comment…"}
    </button>
  );
}

/** Edit / Delete buttons, shared by the desktop table row and the mobile card. */
function RowActions({ onEdit, onDelete }) {
  return (
    <>
      <button onClick={onEdit} className="text-xs font-semibold mr-3 hover:underline" style={{ color: C.ink }}>Edit</button>
      <button onClick={onDelete} className="text-xs font-semibold hover:underline" style={{ color: C.red }}>Delete</button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

  const [filterClass, setFilterClass] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(makeBlankForm());
  const [formError, setFormError] = useState("");

  const [commentEditId, setCommentEditId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  /* ---------- load ---------- */
  useEffect(() => {
    (async () => {
      try {
        const rows = await quotesApi.list();
        setQuotes(rows);
      } catch {
        // Register couldn't be loaded - start with an empty view rather than crash
        setSaveError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- resync on failure ---------- */
  const resync = async () => {
    try {
      setQuotes(await quotesApi.list());
    } catch {
      // leave the current (possibly stale) view in place
    }
  };

  /* ---------- actions ---------- */
  const openAdd = () => { setForm(makeBlankForm()); setEditingId(null); setFormError(""); setShowForm(true); };

  const openEdit = (q) => {
    setForm({
      insured: q.insured, broker: q.broker || "", riskClass: q.riskClass,
      month: q.month, year: String(q.year || CURRENT_YEAR),
      sumInsured: String(q.sumInsured), premium: String(q.premium),
      status: q.status, roComment: q.roComment || "",
    });
    setEditingId(q.id); setFormError(""); setShowForm(true);
  };

  const submitForm = async () => {
    const error = validateQuote(form);
    if (error) { setFormError(error); return; }
    const record = normalizeQuote(form);

    try {
      if (editingId) {
        const updated = await quotesApi.update(editingId, record);
        setQuotes((prev) => prev.map((q) => (q.id === editingId ? updated : q)));
      } else {
        const created = await quotesApi.create(record);
        setQuotes((prev) => [created, ...prev]);
      }
      setSaveError(false);
      setShowForm(false);
    } catch {
      setSaveError(true);
      await resync();
    }
  };

  const toggleStatus = async (id) => {
    const target = quotes.find((q) => q.id === id);
    if (!target) return;
    const nextStatus = target.status === "Incepted" ? "Pending" : "Incepted";
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: nextStatus } : q)));
    try {
      const updated = await quotesApi.update(id, { status: nextStatus });
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setSaveError(false);
    } catch {
      setSaveError(true);
      await resync();
    }
  };

  const deleteQuote = async (id) => {
    const prevQuotes = quotes;
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    try {
      await quotesApi.remove(id);
      setSaveError(false);
    } catch {
      setSaveError(true);
      setQuotes(prevQuotes);
    }
  };

  const saveComment = async (id) => {
    const roComment = commentDraft.trim();
    setCommentEditId(null);
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, roComment } : q)));
    try {
      const updated = await quotesApi.update(id, { roComment });
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setSaveError(false);
    } catch {
      setSaveError(true);
      await resync();
    }
  };

  const clearAll = async () => {
    setConfirmClear(false);
    const prevQuotes = quotes;
    setQuotes([]);
    try {
      await quotesApi.clearAll();
      setSaveError(false);
    } catch {
      setSaveError(true);
      setQuotes(prevQuotes);
    }
  };

  /* ---------- derived ---------- */
  const filtered = useMemo(
    () => filterQuotes(quotes, { riskClass: filterClass, month: filterMonth, status: filterStatus, search }),
    [quotes, filterClass, filterMonth, filterStatus, search]
  );

  const totals = useMemo(() => computeTotals(filtered), [filtered]);
  const convRate = conversionRate(filtered);

  const pieData = [
    { name: "Incepted (converted)", value: totals.incepted, color: C.teal },
    { name: "Pending (unconverted)", value: totals.pending, color: C.amber },
  ];

  const premiumProgress = totals.premium
    ? Math.round((totals.inceptedPremium / totals.premium) * 100)
    : 0;

  const progressPieData = [
    { name: "Incepted premium", value: totals.inceptedPremium, color: C.teal },
    { name: "Outstanding premium", value: totals.premium - totals.inceptedPremium, color: C.amber },
  ];

  const monthlyData = useMemo(() => monthlyChartData(filtered), [filtered]);

  const activeFilters = filterClass !== "All" || filterMonth !== "All" || filterStatus !== "All" || search;

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <div className="text-sm font-medium" style={{ color: C.inkSoft }}>Loading register…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: C.paper, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: C.ink }}>
      {/* ---------------- Masthead ---------------- */}
      <header className="px-4 py-5 sm:px-6" style={{ background: C.ink }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8FA3C4" }}>
              Commercial Property Risk Unit
            </div>
            <h1 className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}>
              Quotation &amp; Risk Register
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {saveError && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#3A2224", color: "#F3B8B4" }}>
                Save failed — changes may not persist
              </span>
            )}
            {quotes.length > 0 && (
              <button
                onClick={() => exportWorkbook(quotes)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105"
                style={{ background: "transparent", color: "#FFFFFF", border: "1px solid #4C5F80" }}
                title="Download the full register as an Excel workbook"
              >
                ⬇ Excel report
              </button>
            )}
            <button
              onClick={openAdd}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105"
              style={{ background: "#FFFFFF", color: C.ink }}
            >
              + Log new quote
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ---------------- Filters ---------------- */}
        <section
          className="mt-6 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <div className="w-full sm:w-[210px]">
            <Field label="Risk class">
              <select aria-label="Risk class filter" value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={inputStyle}>
                <option>All</option>
                {RISK_CLASSES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div className="w-[calc(50%-6px)] sm:w-[110px]">
            <Field label="Month">
              <select aria-label="Month filter" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={inputStyle}>
                <option>All</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <div className="w-[calc(50%-6px)] sm:w-[140px]">
            <Field label="Conversion status">
              <select aria-label="Conversion status filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
                <option>All</option>
                <option>Incepted</option>
                <option>Pending</option>
              </select>
            </Field>
          </div>
          <div className="w-full sm:w-[200px]">
            <Field label="Search insured / broker">
              <input
                aria-label="Search insured or broker" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Crestline" style={inputStyle}
              />
            </Field>
          </div>
          {activeFilters && (
            <button
              onClick={() => { setFilterClass("All"); setFilterMonth("All"); setFilterStatus("All"); setSearch(""); }}
              className="sm:ml-auto text-sm font-semibold underline"
              style={{ color: C.inkSoft }}
            >
              Clear filters
            </button>
          )}
        </section>

        {/* ---------------- Stat strip ---------------- */}
        <section className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Quotes in view" value={filtered.length} sub={`${quotes.length} in register`} />
          <StatCard label="Total premium" value={fmtCompact(totals.premium)} sub={fmtN(totals.premium)} />
          <StatCard label="Total sum insured" value={fmtCompact(totals.sumInsured)} sub={fmtN(totals.sumInsured)} />
          <StatCard label="Conversion rate" value={`${convRate}%`} sub={`${totals.incepted} incepted · ${totals.pending} pending`} accent={C.teal} />
          <StatCard label="Incepted premium" value={fmtCompact(totals.inceptedPremium)} sub="Premium on converted risks" accent={C.teal} />
        </section>

        {/* ---------------- Charts ---------------- */}
        {filtered.length > 0 && (
          <section className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut: converted vs unconverted */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <h2 className="text-sm font-semibold" style={{ color: C.ink }}>Converted vs unconverted</h2>
              <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>Count of risks in current view</p>
              <div className="relative" style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} quote${v === 1 ? "" : "s"}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-semibold" style={{ color: C.teal, fontVariantNumeric: "tabular-nums" }}>{convRate}%</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>converted</div>
                </div>
              </div>
              <div className="flex justify-center gap-5 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: C.teal }} />Incepted ({totals.incepted})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: C.amber }} />Pending ({totals.pending})</span>
              </div>
            </div>

            {/* Pie: premium conversion progress */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <h2 className="text-sm font-semibold" style={{ color: C.ink }}>Conversion progress — premium</h2>
              <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                {premiumProgress}% of quoted premium in view has been incepted
              </p>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={88}
                      paddingAngle={2}
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                      label={({ percent }) => `${Math.round(percent * 100)}%`}
                    >
                      {progressPieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [fmtN(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-5 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: C.teal }} />Incepted ({fmtCompact(totals.inceptedPremium)})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: C.amber }} />Outstanding ({fmtCompact(totals.premium - totals.inceptedPremium)})</span>
              </div>
            </div>

            {/* Bar: premium by month */}
            <div className="lg:col-span-2 rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <h2 className="text-sm font-semibold" style={{ color: C.ink }}>Premium by month</h2>
              <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>Stacked by conversion status</p>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
                    <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip formatter={(v) => fmtN(v)} cursor={{ fill: C.navyChip }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Incepted" stackId="a" fill={C.teal} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Pending" stackId="a" fill={C.amber} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Table / empty state ---------------- */}
        <section className="mt-5 rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {quotes.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                The register is empty
              </div>
              <p className="text-sm mt-1" style={{ color: C.inkSoft }}>
                Log the unit's first quotation to get started.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.ink }}>
                  + Log new quote
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center px-6">
              <div className="text-base font-semibold">No quotes match the current filters</div>
              <p className="text-sm mt-1" style={{ color: C.inkSoft }}>Adjust the risk class, month, or status filters to see results.</p>
            </div>
          ) : (
            <>
              {/* Mobile: one card per quote (below sm) */}
              <div className="sm:hidden divide-y" data-testid="quotes-cards" style={{ borderColor: C.line }}>
                {filtered.map((q) => (
                  <div key={q.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{q.insured}</div>
                        {q.broker && <div className="text-xs truncate" style={{ color: C.inkSoft }}>{q.broker}</div>}
                      </div>
                      <StatusChip status={q.status} onClick={() => toggleStatus(q.id)} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded font-medium" style={{ background: C.navyChip, color: C.ink }}>
                        {q.riskClass}
                      </span>
                      <span style={{ color: C.inkSoft }}>{q.month} {q.year || CURRENT_YEAR}</span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <div>
                        <div className="text-xs" style={{ color: C.inkSoft }}>Sum insured</div>
                        <div style={{ fontVariantNumeric: "tabular-nums" }}>{fmtN(q.sumInsured)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: C.inkSoft }}>Premium</div>
                        <div className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtN(q.premium)}</div>
                      </div>
                    </div>

                    <CommentCell
                      quote={q}
                      editing={commentEditId === q.id}
                      draft={commentDraft}
                      onDraftChange={setCommentDraft}
                      onStartEdit={() => { setCommentEditId(q.id); setCommentDraft(q.roComment || ""); }}
                      onSave={() => saveComment(q.id)}
                      onCancel={() => setCommentEditId(null)}
                    />

                    <div className="flex justify-end pt-1">
                      <RowActions onEdit={() => openEdit(q)} onDelete={() => deleteQuote(q.id)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet: full table (sm and up) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 900 }}>
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.inkSoft, background: "#F7F9FC" }}>
                      <th className="px-4 py-3 font-semibold">Insured / Risk</th>
                      <th className="px-4 py-3 font-semibold">Risk class</th>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold text-right">Sum insured</th>
                      <th className="px-4 py-3 font-semibold text-right">Premium</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold" style={{ minWidth: 220 }}>RO comment</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q, i) => (
                      <tr key={q.id} style={{ borderTop: `1px solid ${C.line}`, background: i % 2 ? "#FBFCFE" : "#FFFFFF" }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{q.insured}</div>
                          {q.broker && <div className="text-xs" style={{ color: C.inkSoft }}>{q.broker}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: C.navyChip, color: C.ink }}>
                            {q.riskClass}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{q.month} {q.year || CURRENT_YEAR}</td>
                        <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtN(q.sumInsured)}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtN(q.premium)}</td>
                        <td className="px-4 py-3">
                          <StatusChip status={q.status} onClick={() => toggleStatus(q.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <CommentCell
                            quote={q}
                            editing={commentEditId === q.id}
                            draft={commentDraft}
                            onDraftChange={setCommentDraft}
                            onStartEdit={() => { setCommentEditId(q.id); setCommentDraft(q.roComment || ""); }}
                            onSave={() => saveComment(q.id)}
                            onCancel={() => setCommentEditId(null)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <RowActions onEdit={() => openEdit(q)} onDelete={() => deleteQuote(q.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ---------------- Footer utilities ---------------- */}
        {quotes.length > 0 && (
          <div className="mt-4 flex justify-end">
            {confirmClear ? (
              <span className="text-xs flex flex-wrap items-center justify-end gap-2" style={{ color: C.inkSoft }}>
                Delete all {quotes.length} quotes permanently?
                <button onClick={clearAll} className="font-semibold" style={{ color: C.red }}>Yes, clear register</button>
                <button onClick={() => setConfirmClear(false)} className="font-semibold" style={{ color: C.ink }}>Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="text-xs hover:underline" style={{ color: C.inkSoft }}>
                Clear all data
              </button>
            )}
          </div>
        )}
      </main>

      {/* ---------------- Add / edit modal ---------------- */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(20,30,48,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl p-4 my-6 sm:p-6" style={{ background: C.card }} role="dialog" aria-modal="true">
            <h2 className="text-xl" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}>
              {editingId ? "Edit quotation" : "Log new quotation"}
            </h2>
            <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkSoft }}>
              Entries are saved to the shared register database automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Insured / risk name *">
                  <input style={inputStyle} value={form.insured} onChange={(e) => setForm({ ...form, insured: e.target.value })} placeholder="e.g. Crestline Hotels & Suites" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Broker / source">
                  <input style={inputStyle} value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} placeholder="e.g. Crownfield Brokers, or Direct" />
                </Field>
              </div>
              <Field label="Risk class *">
                <select style={inputStyle} value={form.riskClass} onChange={(e) => setForm({ ...form, riskClass: e.target.value })}>
                  {RISK_CLASSES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Quote month *">
                <select style={inputStyle} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Quote year *">
                <input
                  style={inputStyle} type="number" min="2000" max="2100"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder={String(CURRENT_YEAR)}
                />
              </Field>
              <Field label="Sum insured (₦) *">
                <input style={inputStyle} type="number" min="0" value={form.sumInsured} onChange={(e) => setForm({ ...form, sumInsured: e.target.value })} placeholder="e.g. 850000000" />
              </Field>
              <Field label="Premium (₦) *">
                <input style={inputStyle} type="number" min="0" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} placeholder="e.g. 4250000" />
              </Field>
              <Field label="Conversion status">
                <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Pending</option>
                  <option>Incepted</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Relationship officer's comment">
                  <textarea style={inputStyle} rows={3} value={form.roComment} onChange={(e) => setForm({ ...form, roComment: e.target.value })} placeholder="Status of the risk, follow-ups, client feedback…" />
                </Field>
              </div>
            </div>

            {formError && <div className="mt-3 text-sm font-medium" role="alert" style={{ color: C.red }}>{formError}</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: C.inkSoft }}>
                Cancel
              </button>
              <button onClick={submitForm} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.ink }}>
                {editingId ? "Save changes" : "Add to register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
