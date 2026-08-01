# General Business Underwriting Department

An umbrella platform for the department's underwriting units, each with its own quotation and risk register: log quotes, track conversion (Incepted / Pending), filter by risk class and month, monitor total premium and sum insured, and export a full multi-sheet Excel report.

The department landing page (`/`) lists every unit; each unit gets its own workspace at `/units/{slug}` with an identical interface, differing only in its Risk Class list. Adding a fifth unit later is a one-entry addition to `src/lib/units.js` — no other code changes needed.

## Units

| Unit | Slug | Risk classes |
|---|---|---|
| Commercial Property Underwriting Unit | `commercial-property` | 16 classes: All Risks, Art Works All Risk, Boiler, Burglary, Business Interruption, CAR, Combined Policy, Delay In Start Up, EAR, Electronic Equipment, Fire and Special Perils, Fire only, Householder, IAR, Plant All Risk, Others |
| Marine and Transportation Unit | `marine-transportation` | GIT, Marine Insurance, Motor Insurance, Others |
| Financial Exposure, Casualty and Liability Unit | `financial-casualty-liability` | Group Personal Accident (GPA), Employer's Liability (EL), Money Insurance, Public Liability, Fidelity Guarantee, Cyber Liability, Corporate Protection Plan, Bond, Professional Indemnity, Healthcare Professional Indemnity, Occupiers Liability, Builders Liablity, General Third Party Liability (GTPA), Bailee, Product Liability, Others |
| Retail Unit | `retail` | Commercial Property's 16 classes plus Motor and Public Liabilty |

## Features (per unit)

- Quote submission form capturing insured/risk name, broker or source, the officer in charge, risk class (from that unit's list), month, year, sum insured, premium, conversion status, and the Relationship Officer's comment. The officer in charge is required - every quote documents who owns it.
- Filters by risk class, month (Jan–Dec), conversion status, officer, and free-text search across insured and broker names. All totals, charts, and the register table respond together.
- Stat strip showing quotes in view, total premium, total sum insured, conversion rate, and incepted premium.
- Comparison and trend charts: a donut of converted vs unconverted risks, a premium-progress pie, a stacked premium-by-month bar chart, a stacked premium-by-risk-class bar chart (every risk class the unit offers, side by side), and an officer-activity pie chart (quotes logged per officer, using a fixed, colorblind-safe categorical palette - each officer keeps the same color across filters; beyond 8 officers the rest fold into a single "Other" slice rather than generating new colors).
- One-click Excel report scoped to that unit: an "All Risks" full-detail sheet, Summary by Officer / Class / Month / Year, plus a full-detail sheet per active risk class, per active month, and per year.
- Inline status toggling and RO comment editing directly in the register table.
- Every unit's register is shared: it lives in a Postgres database (Supabase), not the browser, so everyone sees the same data. There is no login yet - anyone with the app URL can view and edit any unit.

## Stack

Next.js 14 (App Router) + React 18, Tailwind CSS, Recharts, and a Supabase Postgres database. The browser never talks to Supabase directly - all reads/writes go through the app's own Next.js Route Handlers under `src/app/api/units/[unit]/quotes/`, which use a server-only Supabase service-role key. The `quotes` table has row-level security enabled with no policies, so that key is the only way in. All units' quotes live in that one table, tagged by a `unit` column and scoped on every read/write - a request against one unit's routes can never see or touch another unit's rows.

## Getting started

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql` for a brand-new project (creates the `quotes` table with its `unit` and `officer` columns, enables RLS, and grants the service role access). If you already have the table from an earlier version of this app, run the files in `supabase/migrations/` instead, in order - each is safe to run against a table that already has data, and defaults existing rows sensibly (`unit` to `commercial-property`, `officer` to blank, shown as "Unassigned").
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

- `src/lib/__tests__/format.test.js` — Naira/date formatting.
- `src/lib/__tests__/quotes.test.js` — filtering, totals, conversion rate, monthly chart data, form validation, normalization.
- `src/lib/__tests__/report.test.js` — Excel workbook structure: sheet names, per-class/month/year sheets, summary totals, sheet-name sanitization, row contents.
- `src/lib/__tests__/quoteMapping.test.js` — camelCase (JS) <-> snake_case (DB row) field mapping.
- `src/lib/__tests__/quotesApi.test.js` — client-side fetch wrapper: request shape, unit scoping, error handling.
- `src/lib/__tests__/units.test.js` — unit registry: unique slugs, non-empty/duplicate-free risk class lists, expected class lists per unit.
- `src/components/UnitRegister.test.jsx` — integration: loading quotes, adding one through the form, validation errors, class and month filters, status toggling, inline comment editing, deletion, and recovering from a failed load. The backend is mocked (`src/lib/quotesApi.js`), not a real Supabase instance.

## Building for production

```bash
npm run build      # next build
npm run start      # serve the production build locally
```

Don't run `next build` while `next dev` is running against the same folder - both write to `.next` and will corrupt each other's build cache. Stop the dev server first.

## Deploying to Vercel

1. Push this folder to a GitHub/GitLab/Bitbucket repository.
2. In Vercel, click "Add New Project" and import the repository. Vercel auto-detects Next.js.
3. Add the same two environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in the Vercel project settings.
4. Deploy. Every push to the main branch redeploys automatically.

## Project structure

```
src/
  app/
    layout.jsx                    Root layout (fonts, metadata)
    globals.css                    Tailwind + global styles
    page.jsx                        Renders ErrorBoundary > DepartmentHome
    units/[unit]/
      page.jsx                      Renders ErrorBoundary > UnitRegister for a known slug, 404s otherwise
    api/units/[unit]/quotes/
      route.js                      GET (list), POST (create), DELETE (clear all) - scoped to :unit
      [id]/route.js                  PATCH (update one), DELETE (remove one) - scoped to :unit + :id
  components/
    DepartmentHome.jsx              Landing page: unit dropdown + unit cards
    UnitRegister.jsx                One unit's register UI (dashboard, table, form, charts)
    UnitRegister.test.jsx
    ErrorBoundary.jsx
  lib/
    units.js                        Unit registry: slug, name, risk classes - the source of truth for the platform
    constants.js                    Shared design tokens, months, current year, form defaults
    format.js                       Naira/date formatters
    quotes.js                        Filtering, totals, validation (pure logic)
    report.js                        Excel workbook builder (takes a unit's risk classes)
    quoteMapping.js                  camelCase <-> snake_case row mapping
    quotesApi.js                     makeQuotesApi(unitSlug) - client-side fetch wrapper
    supabaseServer.js                Server-only Supabase client (service-role key)
    __tests__/                       Unit tests
  test/setup.js                     Vitest setup (jest-dom, ResizeObserver shim)
supabase/
  schema.sql                        Table (unit + officer columns), RLS, and grants - run once for a new project
  migrations/
    002_add_unit_column.sql          Adds the unit column to an existing pre-multi-unit table
    003_add_officer_column.sql       Adds the officer column to an existing table
```

## Known limitations

- No live-refresh across tabs or users - each browser only sees new data on its own reload or its own actions (no polling or Supabase Realtime yet).
- No authentication - the platform is open access across all units. Real login and centralized user management is a planned follow-up, not yet built.
