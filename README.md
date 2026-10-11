# GradedCalls Analysts

Banks make the calls. We grade them.

GradedCalls Analysts is the GradedCalls scorecard for sell-side recommendations. It ranks analysts and bank desks by how their ratings and price targets lined up with later prices, and it shows the arithmetic on every call.

The calls in this ledger come from public news sources. Each call links to that page. This repository does not scrape ranking sites, it is not affiliated with any bank or ratings publisher, and it is not investment advice. Past accuracy does not predict future results.

Brand rules: read BRAND.md before any UI change; deviations are an automatic MUST-FIX.

## Run locally

Requires Node.js 20 or newer. `npm test` passes on Node 20+ without a browser.

The grade-pill contrast check is optional. It runs inside `npm test` only when Node provides a global `WebSocket` (Node 22 or newer), Google Chrome, and ffmpeg are all installed. If any of those are missing, that one test skips with a message and the rest of the suite still passes. Screenshots from the check are written under `artifacts/` (gitignored).

```bash
npm install
npm run db:reset
npm run dev
```

`npm run dev` also creates the SQLite database if it is missing. Open [http://localhost:3000](http://localhost:3000).

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Scoring, 90-day supersession, and CSV-parser checks. The pill-contrast check runs only when Node 22, Chrome, and ffmpeg are available |
| `npm run db:seed` | Reload the ledger into SQLite |
| `npm run db:reset` | Recreate the SQLite file and seed it |
| `npm run build` | Generate the client, push the schema, seed, and build Next.js |
| `npm start` | Serve the production build |
| `npm run import:calls -- data/your-feed.csv` | Upsert a CSV feed |
| `npm run import:calls -- data/your-feed.csv --replace` | Replace the database contents with that CSV |
| `npm run calls:validate` | Check the call ledger against the grade rules |
| `npm run calls:export` | Rewrite `data/calls/calls.json` from the CSV |
| `npx tsx scripts/scan-supersession-report.ts` | Recount 90-day same-ticker pairs in the current database |

`npm install && npm run build` is enough for a production build. The `prebuild` step creates `prisma/banktruth.db` (gitignored) before `next build`.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Hero, leaderboards, a best and worst followed call |
| `/leaderboards` | Top analysts, top banks, worst offenders. Filter by 2W / 30D / 60D / 90D / 1Y and sector |
| `/analysts` and `/analysts/[slug]` | Directory and a scorecard: overall factor, active book, superseded history |
| `/banks` and `/banks/[slug]` | Firm rollup, sector mix, roster |
| `/tickers` and `/tickers/[symbol]` | Direction for grading versus who was right on that name |
| `/calls` and `/calls/[id]` | The call book, then one call: recommendation, desk rating, direction for grading, target, prices, source link, and the grade at each horizon |
| `/about` | What the ledger is: public news sources, historical prices, and a formula that is not advice |
| `/methodology` | The formula, read from the same constants the scorer uses |
| `/search` | Analyst, bank, or ticker |
| `/watchlist` | Saved in this browser only (`localStorage`). No account |
| `/disclaimer` | Not advice, no client relationship, sourced calls, historical prices |
| `/terms` | Draft terms: license, scraping, IP, DMCA, liability, governing law |
| `/donate` | Draft donations page: gifts do not buy grades; no checkout in this build |

## Methodology (summary)

The full write-up is the Methodology page at `/methodology`. In short:

- The visible label is the **recommendation** (Initiate Buy, Upgrade to Overweight, Target raise, Target cut, Reiterate Outperform, Maintain Neutral). A target raise is not shown as Sell.
- **Direction for grading** collapses the desk rating to Buy, Hold, or Sell and is what the score uses. It is labeled as such and is not the headline.
- **Up** ratings (Buy, Strong Buy, Overweight, Outperform) hit when the forward return is at least T.
- **Down** ratings (Sell, Underperform, Underweight) hit when the forward return is at most −T.
- **Flat** ratings (Hold, Neutral, Equal-Weight) hit when the absolute return is at most T.
- T is 1% at 2 weeks, 2% at 30 days, 4% at 60 days, 5% at 90 days, and 8% at 1 year. Windows are calendar days, not trading days.
- A near-miss earns half of the 70 direction points and does **not** count as a hit.
- Target error is `|price at horizon − target| / price at call`. Inside a tight band it adds 30 points; past a wide band it adds none; in between it fades linearly. No target means the direction score is scaled to 100.
- Every card shows both grades. The full grade is the **0–100** score. The **GC Scale** places that score as an integer **GC score from 1–10**: 1 is a poor track record, 10 is an excellent one. The cut is absolute. 70+ is STRONG, 40–69 PROVISIONAL, under 40 WEAK; a graded 0 is EXIT LIQUIDITY. A graded score of exactly 0 is an empty glass at 0% and reads EXIT LIQUIDITY. An open horizon stays ungraded and reads Not graded yet. Peer rank does not set the badge. Leaderboards show both columns and sort by the 100-point score by default. A GC score sort breaks ties with the 100-point score. Hit rate stays as a supporting stat.
- The **overall factor** is that 0–100 average of active graded calls at the selected horizon (`src/lib/overall-factor.ts`). The GC score is the same factor placed on the GC Scale. Superseded calls do not enter it. Leaderboards sort on this factor. The tube grades are STRONG, WEAK, PROVISIONAL, and EXIT LIQUIDITY.
- “If followed” averages the stock return on buys and the inverse return on sells. Holds are excluded.
- Leaderboards hide thin books (8 graded calls for an analyst, 20 for a bank; lower inside a sector filter). A name below that minimum stays off the board. Its page still shows the calls that exist.
- A later call by the same analyst on the same ticker within 90 calendar days nullifies the earlier call for scoring. Only the latest call in an unbroken 90-day streak counts toward the overall factor. The earlier call stays visible in a superseded section, with a note on both sides of the chain. A longer gap leaves both calls active. BRK.B and BRK-B are the same ticker.

The score is not market-adjusted. A buy in a rising tape can hit without insight. That limit is stated on the methodology page.

## Data model

SQLite via Prisma, file at `prisma/banktruth.db`.

- `Bank`, `Analyst`, `Ticker`, `Coverage`, `Call`
- A call stores the action, rating change, targets, price at the call, prices 14, 30, 60, 90, and 365 calendar days later, and the source URL
- Grades are computed when pages render (`src/lib/scoring.ts`). They are not baked into the row, so a formula change does not require a reseed
- The 90-day same-ticker rule is computed the same way (`src/lib/supersession.ts`) for every call in the database, including the seeded ledger and CSV imports. Nullified rows are not stored as a separate flag

`prisma/seed.ts` loads `data/calls/calls.json`. Prices are Yahoo Finance adjusted closes (adjusted for splits and dividends). A missing quote aborts the seed. A horizon that runs past 9 Oct 2026 is stored blank and left ungraded. Notes restate the rating and target from the public source. They are not a quotation of a research report.

## Call ledger

`data/calls/calls.csv` is the source of truth for analyst calls. `npm run calls:export` rewrites `data/calls/calls.json`, and the seed loads that file into SQLite. Pages still compute each grade at render time, so the JSON carries the call, the rating, the target, the prices, and the source URL, not a stored GC score.

Rows in the live ledger use `data_source=public`. That value means a public news source, not a licensed feed. A public row needs a routable `source_url`, must match the analyst and firm registry, must match `pricesForCall`, cannot be dated after the price history, and cannot be labelled `verified`. `data_source=licensed` stays available for a later feed you have the rights to. Only a licensed row may be labelled `verified`, and it needs a `source_url`. The validator rejects any row that is not `public` or `licensed`. Do not scrape TipRanks, Bloomberg, or X, and do not call a paid market-data or rankings API.

Grades use the same rules as the board. 70 and above is STRONG, 40 up to 70 is PROVISIONAL (69.9 stays PROVISIONAL), under 40 is WEAK, and a graded 0 is EXIT LIQUIDITY. A horizon with no price reads "Not graded yet". The label is exactly GC Scale.

Each week:

1. Edit `data/calls/calls.csv`. One row per call. Leave a horizon price blank until that window has closed. Prices must match the adjusted closes already in the repo. Do not invent a price.
2. Run `npm run calls:validate`. A failure stops the export.
3. Run `npm run calls:export`. An unchanged CSV produces a byte-identical JSON file.
4. Open a pull request with the CSV and the generated JSON. Tests assert invariants (unique ids, public rows are not verified, grades match `gradeCall`) and do not hard-code a row count.

`npm run import:calls` remains a separate adapter for a one-off feed. It is not the ledger the site seeds.

## Add another sourced feed

Do not scrape a rankings site. Use a price history and a call archive you have the rights to.

1. Produce a CSV with one row per call. Required columns:

   `call_id,date,bank_slug,bank_name,analyst_slug,analyst_name,ticker,company,sector,action,rating_to,price_at_call`

   Optional columns:

   `bank_short,headquarters,analyst_title,industry,exchange,rating_from,price_target_from,price_target_to,price_14d,price_30d,price_60d,price_90d,price_1y,note`

   Dates are `YYYY-MM-DD`. `rating_to` is the desk rating, not the headline: `strong_buy`, `buy`, `overweight`, `outperform`, `hold`, `neutral`, `equal_weight`, `underperform`, `underweight`, `sell`. `action` is `initiate`, `upgrade`, `downgrade`, `reiterate`, `target_raise`, or `target_cut`. The screen builds the recommendation from those two fields: Initiate Buy, Upgrade to Overweight, Downgrade to Neutral, Reiterate Outperform, Maintain Hold (a reiteration of Hold, Neutral, or Equal-Weight), Target raise, Target cut. A `target_raise` with `rating_to=sell` is labeled Target raise. Sell appears only as the direction for grading. Outcome prices are the print 14, 30, 60, 90, and 365 **calendar** days after the call. Leave an outcome blank when that window has not elapsed.

2. A two-row example lives at `data/import-example.csv`. It is not loaded by the seed.

3. Import:

   ```bash
   npm run import:calls -- data/your-feed.csv --replace
   ```

   `--replace` deletes the banks, analysts, tickers, and calls first. Without it, rows upsert by `call_id` and can sit beside the ledger, which you usually do not want.

4. The import path is the adapter boundary:

   - `src/lib/imports/types.ts` — `RawCallRecord` and `CallFeedAdapter`
   - `src/lib/imports/csv-feed.ts` — `CsvCallFeed` and `JsonCallFeed`
   - `src/lib/imports/apply.ts` — `applyCallFeed()`, which upserts into Prisma
   - `scripts/import-calls.ts` — CLI

   A future licensed API is another class with `pull(): Promise<RawCallRecord[]>`, passed to `applyCallFeed`. The pages do not care where the rows came from. Keep `source` on the call so a public row and a licensed row stay distinguishable.

5. Postgres, if you outgrow the file: point `DATABASE_URL` at a `postgresql://` URL, change the Prisma datasource provider to `postgresql`, and run `prisma db push`. `src/lib/db.ts` already uses a Postgres URL when it sees one, and falls back to the SQLite file otherwise. Outcome prices still have to be supplied by your feed; this app does not call a market-data vendor.

## Deploy on Vercel

Import the GitHub repository. No environment variables and no secrets. The database is created during the build and does not call a market-data API.

Use these settings. The defaults already match; do not override the build command.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `./` (repository root) |
| Node.js version | 22.x |
| Install command | `npm install` (leave the default) |
| Build command | `npm run build` (leave the default) |
| Output directory | leave the Next.js default |
| Environment variables | none |

`npm run build` runs `prebuild` first: Prisma generates the client, creates `prisma/banktruth.db`, and seeds it. That file is traced into the server bundle. On Vercel the filesystem is read-only except `/tmp`, so each instance copies the seed to `/tmp/banktruth.db` before reading it. Do not change the build command to bare `next build` — that skips the seed and the live routes will have no database.

Do not set `DATABASE_URL` for this deploy. Do not commit a `.env`. When that variable is unset and no `.env` file is present, the build scripts pass Prisma the local SQLite path (`file:./banktruth.db`, resolved beside `schema.prisma`). Copy `.env.example` to `.env` only if you want a different path. Do not set `NODE_ENV` yourself. A `postgresql://` `DATABASE_URL` is only for a later hosted database, and it also requires changing the Prisma datasource provider to `postgresql`.

This deploy is read-only. A writable production feed should use Postgres rather than SQLite on serverless disk.

## Disclaimer

GradedCalls Analysts is independent. It is not investment advice. Past accuracy does not predict future results. Figures in this ledger are the sourced calls and the adjusted closes used to grade them. GradedCalls Analysts is not affiliated with those firms or with any rankings publisher.
