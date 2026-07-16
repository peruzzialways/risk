import "@testing-library/jest-dom";

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks
if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Reset persisted state between tests
beforeEach(() => {
  window.localStorage.clear();
});
