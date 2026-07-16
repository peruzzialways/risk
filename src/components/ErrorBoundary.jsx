"use client";

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Hook up a monitoring service (e.g. Sentry) here in production
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F5F8", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1B2A41" }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#51617D", marginTop: 8 }}>
              Your register data is safe. Reload the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B2A41", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
