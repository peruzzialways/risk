# Quotation & Risk Register

A dashboard for a Commercial Property Risk Unit's day-to-day quotation activities and risk submissions. Log quotes, track conversion (Incepted / Pending), filter by risk class and month, monitor total premium and sum insured, and export a full multi-sheet Excel report.

## Features

- Quote submission form capturing insured/risk name, broker or source, risk class (16 classes: All Risk, Art Works All Risk, Boiler, Burglary, Business Interruption, CAR, Combined Policy, Delay In Start Up, EAR, Electronic Equipment, Fire and Special Perils, Fire only, Householder, IAR, Plant All Risk, Other), month, year, sum insured, premium, conversion status, and the Relationship Officer's comment.
- Filters by risk class, month (Jan–Dec), conversion status, and free-text search across insured and broker names. All totals, charts, and the register table respond together.
- Stat strip showing quotes in view, total premium, total sum insured, conversion rate, and incepted premium.
- Donut chart of converted vs unconverted risks, a premium-progress pie, and a stacked premium-by-month bar chart.
- One-click Excel report: an "All Risks" full-detail sheet, Summary by Class / Month / Year, plus a full-detail sheet per active risk class, per active month, and per year.
- Inline status toggling and RO comment editing directly in the register table.
- The register is shared: it lives in a Postgres database (Supabase), not the browser, so everyone sees the same data. There is no login yet - anyone with the app URL can view and edit it.

## Stack

Next.js 14 (App Router) + React 18, Tailwind CSS, Recharts, and a Supabase Postgres database. The browser never talks to Supabase directly - all reads/writes go through the app's own Next.js Route Handlers under `src/app/api/quotes/`, which use a server-only Supabase service-role key. The `quotes` table has row-level security enabled with no policies, so that key is the only way in.

## Getting started

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql` (creates the `quotes` table, enables RLS, and grants the service role access).
3. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   SUPABASE_URL=              # Settings -> API -> Project URL
   SUPABASE_SERVICE_ROLE_KEY= # Settings -> API -> service_role / secret key (server-only, never expose this to the browser)
   ```
4. Install and run:
   ```bash
   npm install
   npm run dev        # local dev server at http://localhost:3000
   ```

## Testing

```bash
npm test           # run the full suite once
npm run test:watch # watch mode
npm run test:coverage
```

Tests run with Vitest, independently of the Next.js build. The suite covers:

- `src/lib/__tests__/format.test.js` — Naira formatting (full and compact).
- `src/lib/__tests__/quotes.test.js` — filtering, totals, conversion rate, monthly chart data, form validation, normalization.
- `src/lib/__tests__/report.test.js` — Excel workbook structure: sheet names, per-class/month/year sheets, summary totals, sheet-name sanitization, row contents.
- `src/lib/__tests__/quoteMapping.test.js` — camelCase (JS) <-> snake_case (DB row) field mapping.
- `src/lib/__tests__/quotesApi.test.js` — client-side fetch wrapper: request shape and error handling.
- `src/components/App.test.jsx` — integration: loading quotes, adding one through the form, validation errors, class and month filters, status toggling, inline comment editing, deletion, and recovering from a failed load. The backend is mocked (`src/lib/quotesApi.js`), not a real Supabase instance.

## Building for production

```bash
npm run build      # next build
npm run start      # serve the production build locally
```

## Deploying to Vercel

1. Push this folder to a GitHub/GitLab/Bitbucket repository.
2. In Vercel, click "Add New Project" and import the repository. Vercel auto-detects Next.js.
3. Add the same two environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in the Vercel project settings.
4. Deploy. Every push to the main branch redeploys automatically.

## Project structure

```
src/
  app/
    layout.jsx               Root layout (fonts, metadata)
    globals.css               Tailwind + global styles
    page.jsx                   Renders ErrorBoundary > App
    api/quotes/
      route.js                 GET (list), POST (create), DELETE (clear all)
      [id]/route.js             PATCH (update one), DELETE (remove one)
  components/
    App.jsx                    UI (dashboard, table, form, charts)
    App.test.jsx
    ErrorBoundary.jsx
  lib/
    constants.js               Risk classes, months, colors, form defaults
    format.js                   Naira formatters
    quotes.js                    Filtering, totals, validation (pure logic)
    report.js                    Excel workbook builder
    quoteMapping.js              camelCase <-> snake_case row mapping
    quotesApi.js                 Client-side fetch wrapper for /api/quotes
    supabaseServer.js            Server-only Supabase client (service-role key)
    __tests__/                   Unit tests
  test/setup.js                 Vitest setup (jest-dom, ResizeObserver shim)
supabase/
  schema.sql                    Table, RLS, and grants - run once per project
```

## Known limitation

No live-refresh across tabs or users - each browser only sees new data on its own reload or its own actions (no polling or Supabase Realtime yet).
