import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { quotesApi } from "../lib/quotesApi.js";

// recharts doesn't render meaningfully in jsdom; replace with inert stubs
vi.mock("recharts", () => {
  const Box = ({ children }) => <div data-testid="chart">{children}</div>;
  const Nil = () => null;
  return {
    ResponsiveContainer: Box, PieChart: Box, BarChart: Box,
    Pie: Nil, Cell: Nil, Bar: Nil, Tooltip: Nil,
    XAxis: Nil, YAxis: Nil, CartesianGrid: Nil, Legend: Nil,
  };
});

// In-memory stand-in for the real /api/quotes backend, so App.jsx's calls to
// quotesApi round-trip against a fake but realistic data layer.
vi.mock("../lib/quotesApi.js", () => {
  let db = [];
  let nextId = 1;
  const quotesApi = {
    list: vi.fn(() => Promise.resolve(db)),
    create: vi.fn((record) => {
      const created = { id: `q${nextId++}`, createdAt: Date.now(), ...record };
      db = [created, ...db];
      return Promise.resolve(created);
    }),
    update: vi.fn((id, patch) => {
      db = db.map((q) => (q.id === id ? { ...q, ...patch } : q));
      return Promise.resolve(db.find((q) => q.id === id));
    }),
    remove: vi.fn((id) => {
      db = db.filter((q) => q.id !== id);
      return Promise.resolve(null);
    }),
    clearAll: vi.fn(() => {
      db = [];
      return Promise.resolve(null);
    }),
    __seed: (rows) => { db = rows; },
    __reset: () => { db = []; nextId = 1; },
  };
  return { quotesApi };
});

const TWO_QUOTES = [
  { id: "a1", insured: "Alpha Mills", broker: "Crownfield", riskClass: "Fire only", month: "Jan", year: 2026, sumInsured: 100000000, premium: 1000000, status: "Incepted", roComment: "Bound", createdAt: 1 },
  { id: "b2", insured: "Beta Hotels", broker: "Direct", riskClass: "IAR", month: "Mar", year: 2026, sumInsured: 200000000, premium: 2000000, status: "Pending", roComment: "Awaiting docs", createdAt: 2 },
];

beforeEach(() => {
  quotesApi.__reset();
  vi.clearAllMocks();
});

describe("App", () => {
  it("shows the empty state when there is no saved data", async () => {
    render(<App />);
    expect(await screen.findByText(/the register is empty/i)).toBeInTheDocument();
  });

  it("loads persisted quotes from the API on start", async () => {
    quotesApi.__seed(TWO_QUOTES);
    render(<App />);
    expect(await screen.findByText("Alpha Mills")).toBeInTheDocument();
    expect(screen.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("adds a new quote through the form and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click((await screen.findAllByRole("button", { name: /log new quote/i }))[0]);

    await user.type(screen.getByLabelText(/insured \/ risk name/i), "Testline Factories");
    await user.selectOptions(screen.getByLabelText(/risk class \*/i), "Burglary");
    await user.selectOptions(screen.getByLabelText(/quote month/i), "Feb");
    await user.type(screen.getByLabelText(/sum insured/i), "5000000");
    await user.type(screen.getByLabelText(/premium/i), "50000");
    await user.click(screen.getByRole("button", { name: /add to register/i }));

    expect(await screen.findByText("Testline Factories")).toBeInTheDocument();
    expect(quotesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ insured: "Testline Factories", riskClass: "Burglary", month: "Feb", premium: 50000, status: "Pending" })
    );
  });

  it("blocks submission and shows an error when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click((await screen.findAllByRole("button", { name: /log new quote/i }))[0]);
    await user.click(screen.getByRole("button", { name: /add to register/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/insured/i);
    expect(quotesApi.create).not.toHaveBeenCalled();
  });

  it("filters the table by risk class", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Alpha Mills");

    await user.selectOptions(screen.getByLabelText("Risk class filter"), "IAR");
    expect(screen.queryByText("Alpha Mills")).not.toBeInTheDocument();
    expect(screen.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("filters the table by month", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Alpha Mills");

    await user.selectOptions(screen.getByLabelText("Month filter"), "Jan");
    expect(screen.getByText("Alpha Mills")).toBeInTheDocument();
    expect(screen.queryByText("Beta Hotels")).not.toBeInTheDocument();
  });

  it("toggles conversion status from the table and persists the change", async () => {
    quotesApi.__seed([TWO_QUOTES[1]]); // one Pending quote
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Beta Hotels");

    await user.click(screen.getByRole("button", { name: /pending/i }));
    expect(await screen.findByRole("button", { name: /incepted/i })).toBeInTheDocument();
    expect(quotesApi.update).toHaveBeenCalledWith("b2", { status: "Incepted" });
  });

  it("edits the RO comment inline", async () => {
    quotesApi.__seed([TWO_QUOTES[0]]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Alpha Mills");

    await user.click(screen.getByRole("button", { name: "Bound" }));
    const box = screen.getByLabelText(/edit ro comment/i);
    await user.clear(box);
    await user.type(box, "Premium received in full");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Premium received in full")).toBeInTheDocument();
    expect(quotesApi.update).toHaveBeenCalledWith("a1", { roComment: "Premium received in full" });
  });

  it("deletes a quote", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Alpha Mills");

    const row = screen.getByText("Alpha Mills").closest("tr");
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    expect(screen.queryByText("Alpha Mills")).not.toBeInTheDocument();
    expect(quotesApi.remove).toHaveBeenCalledWith("a1");
  });

  it("shows the Excel report button only when the register has data", async () => {
    render(<App />);
    await screen.findByText(/the register is empty/i);
    expect(screen.queryByRole("button", { name: /excel report/i })).not.toBeInTheDocument();
  });

  it("recovers from a failed initial load by showing an empty register with a save error", async () => {
    quotesApi.list.mockRejectedValueOnce(new Error("network down"));
    render(<App />);
    expect(await screen.findByText(/the register is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/save failed/i)).toBeInTheDocument();
  });
});
