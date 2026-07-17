import { describe, it, expect, vi, beforeEach } from "vitest";
import { quotesApi } from "../quotesApi.js";

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("quotesApi", () => {
  it("list() GETs /api/quotes and returns the parsed JSON", async () => {
    global.fetch.mockResolvedValue(jsonResponse([{ id: "1" }]));
    const result = await quotesApi.list();
    expect(global.fetch).toHaveBeenCalledWith("/api/quotes");
    expect(result).toEqual([{ id: "1" }]);
  });

  it("create() POSTs the record as JSON", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: "1" }, 201));
    await quotesApi.create({ insured: "Alpha" });
    expect(global.fetch).toHaveBeenCalledWith("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insured: "Alpha" }),
    });
  });

  it("update() PATCHes the specific quote", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ id: "1", status: "Incepted" }));
    await quotesApi.update("1", { status: "Incepted" });
    expect(global.fetch).toHaveBeenCalledWith("/api/quotes/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Incepted" }),
    });
  });

  it("remove() DELETEs the specific quote", async () => {
    global.fetch.mockResolvedValue(jsonResponse(null, 204));
    await quotesApi.remove("1");
    expect(global.fetch).toHaveBeenCalledWith("/api/quotes/1", { method: "DELETE" });
  });

  it("clearAll() DELETEs the whole register", async () => {
    global.fetch.mockResolvedValue(jsonResponse(null, 204));
    await quotesApi.clearAll();
    expect(global.fetch).toHaveBeenCalledWith("/api/quotes", { method: "DELETE" });
  });

  it("throws with the server's error message on failure", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: "Enter the insured / risk name." }, 400));
    await expect(quotesApi.create({})).rejects.toThrow(/insured/i);
  });

  it("throws a generic message when the error response has no JSON body", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject(new Error("no body")) });
    await expect(quotesApi.list()).rejects.toThrow(/500/);
  });
});
