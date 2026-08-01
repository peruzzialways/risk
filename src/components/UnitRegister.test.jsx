import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UnitRegister from "./UnitRegister.jsx";
import { makeQuotesApi } from "../lib/quotesApi.js";
import { getUnit } from "../lib/units.js";

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

// In-memory stand-in for the real /api/units/:unit/quotes backend, so
// UnitRegister's calls to its quotesApi round-trip against a fake but
// realistic data layer. makeQuotesApi ignores the unit slug it's called
// with and always returns this same mock object, since these tests only
// ever mount one unit at a time.
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
  return { makeQuotesApi: () => quotesApi };
});

const unit = getUnit("commercial-property");
const quotesApi = makeQuotesApi(unit.slug);

const TWO_QUOTES = [
  { id: "a1", insured: "Alpha Mills", broker: "Crownfield", officer: "Ada Okafor", riskClass: "Fire only", month: "Jan", year: 2026, sumInsured: 100000000, premium: 1000000, status: "Incepted", roComment: "Bound", createdAt: 1 },
  { id: "b2", insured: "Beta Hotels", broker: "Direct", officer: "Ben Musa", riskClass: "IAR", month: "Mar", year: 2026, sumInsured: 200000000, premium: 2000000, status: "Pending", roComment: "Awaiting docs", createdAt: 2 },
];

beforeEach(() => {
  quotesApi.__reset();
  vi.clearAllMocks();
});

describe("UnitRegister", () => {
  it("shows the empty state when there is no saved data", async () => {
    render(<UnitRegister unit={unit} />);
    expect(await screen.findByText(/the register is empty/i)).toBeInTheDocument();
  });

  it("shows the unit's name in the header", async () => {
    render(<UnitRegister unit={unit} />);
    expect(await screen.findByRole("heading", { name: unit.name })).toBeInTheDocument();
  });

  it("loads persisted quotes from the API on start", async () => {
    quotesApi.__seed(TWO_QUOTES);
    render(<UnitRegister unit={unit} />);
    // jsdom doesn't evaluate the sm: breakpoint CSS, so both the mobile card
    // list and the desktop table render at once - scope to the table, which
    // is the one unique landmark between them.
    const table = within(await screen.findByRole("table"));
    expect(table.getByText("Alpha Mills")).toBeInTheDocument();
    expect(table.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("adds a new quote through the form and persists it", async () => {
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    await user.click((await screen.findAllByRole("button", { name: /log new quote/i }))[0]);

    await user.type(screen.getByLabelText(/insured \/ risk name/i), "Testline Factories");
    await user.type(screen.getByLabelText(/officer in charge/i), "Chidi Eze");
    await user.selectOptions(screen.getByLabelText(/risk class \*/i), "Burglary");
    await user.selectOptions(screen.getByLabelText(/quote month/i), "Feb");
    await user.type(screen.getByLabelText(/sum insured/i), "5000000");
    await user.type(screen.getByLabelText(/premium/i), "50000");
    await user.click(screen.getByRole("button", { name: /add to register/i }));

    const table = within(await screen.findByRole("table"));
    expect(await table.findByText("Testline Factories")).toBeInTheDocument();
    expect(quotesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ insured: "Testline Factories", officer: "Chidi Eze", riskClass: "Burglary", month: "Feb", premium: 50000, status: "Pending" })
    );
  });

  it("blocks submission and shows an error when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    await user.click((await screen.findAllByRole("button", { name: /log new quote/i }))[0]);
    await user.click(screen.getByRole("button", { name: /add to register/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/insured/i);
    expect(quotesApi.create).not.toHaveBeenCalled();
  });

  it("blocks submission when the officer in charge is missing", async () => {
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    await user.click((await screen.findAllByRole("button", { name: /log new quote/i }))[0]);
    await user.type(screen.getByLabelText(/insured \/ risk name/i), "Testline Factories");
    await user.type(screen.getByLabelText(/sum insured/i), "5000000");
    await user.type(screen.getByLabelText(/premium/i), "50000");
    await user.click(screen.getByRole("button", { name: /add to register/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/officer/i);
    expect(quotesApi.create).not.toHaveBeenCalled();
  });

  it("filters the table by risk class", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Alpha Mills");

    await user.selectOptions(screen.getByLabelText("Risk class filter"), "IAR");
    expect(table.queryByText("Alpha Mills")).not.toBeInTheDocument();
    expect(table.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("filters the table by month", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Alpha Mills");

    await user.selectOptions(screen.getByLabelText("Month filter"), "Jan");
    expect(table.getByText("Alpha Mills")).toBeInTheDocument();
    expect(table.queryByText("Beta Hotels")).not.toBeInTheDocument();
  });

  it("filters the table by officer", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Alpha Mills");

    await user.selectOptions(screen.getByLabelText("Officer filter"), "Ben Musa");
    expect(table.queryByText("Alpha Mills")).not.toBeInTheDocument();
    expect(table.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("shows each quote's officer in the table", async () => {
    quotesApi.__seed(TWO_QUOTES);
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    expect(await table.findByText("Ada Okafor")).toBeInTheDocument();
    expect(table.getByText("Ben Musa")).toBeInTheDocument();
  });

  it("toggles conversion status from the table and persists the change", async () => {
    quotesApi.__seed([TWO_QUOTES[1]]); // one Pending quote
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Beta Hotels");

    await user.click(table.getByRole("button", { name: /pending/i }));
    expect(await table.findByRole("button", { name: /incepted/i })).toBeInTheDocument();
    expect(quotesApi.update).toHaveBeenCalledWith("b2", { status: "Incepted" });
  });

  it("edits the RO comment inline", async () => {
    quotesApi.__seed([TWO_QUOTES[0]]);
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Alpha Mills");

    await user.click(table.getByRole("button", { name: "Bound" }));
    const box = table.getByLabelText(/edit ro comment/i);
    await user.clear(box);
    await user.type(box, "Premium received in full");
    await user.click(table.getByRole("button", { name: /^save$/i }));

    expect(await table.findByText("Premium received in full")).toBeInTheDocument();
    expect(quotesApi.update).toHaveBeenCalledWith("a1", { roComment: "Premium received in full" });
  });

  it("deletes a quote", async () => {
    quotesApi.__seed(TWO_QUOTES);
    const user = userEvent.setup();
    render(<UnitRegister unit={unit} />);
    const table = within(await screen.findByRole("table"));
    await table.findByText("Alpha Mills");

    const row = table.getByText("Alpha Mills").closest("tr");
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    expect(table.queryByText("Alpha Mills")).not.toBeInTheDocument();
    expect(quotesApi.remove).toHaveBeenCalledWith("a1");
  });

  it("also renders the mobile card list (shown below the sm breakpoint via CSS)", async () => {
    quotesApi.__seed(TWO_QUOTES);
    render(<UnitRegister unit={unit} />);
    const cards = within(await screen.findByTestId("quotes-cards"));
    expect(await cards.findByText("Alpha Mills")).toBeInTheDocument();
    expect(cards.getByText("Beta Hotels")).toBeInTheDocument();
  });

  it("shows the Excel report button only when the register has data", async () => {
    render(<UnitRegister unit={unit} />);
    await screen.findByText(/the register is empty/i);
    expect(screen.queryByRole("button", { name: /excel report/i })).not.toBeInTheDocument();
  });

  it("recovers from a failed initial load by showing an empty register with a save error", async () => {
    quotesApi.list.mockRejectedValueOnce(new Error("network down"));
    render(<UnitRegister unit={unit} />);
    expect(await screen.findByText(/the register is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/save failed/i)).toBeInTheDocument();
  });
});
