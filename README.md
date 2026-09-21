# BankTruth

Banks make the calls. We grade them.

BankTruth is a public scorecard for sell-side recommendations. It ranks fictional demo analysts and sample bank desks by how their ratings and price targets lined up with later prices, and it shows the arithmetic on every call.

This repository ships a complete demo. It does not scrape ranking sites, it is not affiliated with any bank or ratings publisher, and it is not investment advice. Past accuracy does not predict future results.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run db:reset
npm run dev
```

`npm run dev` also creates the SQLite database if it is missing. Open [http://localhost:3000](http://localhost:3000).

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Scoring and CSV-parser checks |
| `npm run db:seed` | Rebuild the demo rows in place |
| `npm run db:reset` | Recreate the SQLite file and seed it |
| `npm run build` | Generate the client, push the schema, seed, and build Next.js |
| `npm start` | Serve the production build |
| `npm run import:calls -- data/your-feed.csv` | Upsert a CSV feed |
| `npm run import:calls -- data/your-feed.csv --replace` | Replace the database contents with that CSV |

`npm install && npm run build` is enough for a production build. The `prebuild` step creates `prisma/banktruth.db` (gitignored) before `next build`.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Hero, sample leaderboards, a best and worst followed call, controversial moves |
| `/leaderboards` | Top analysts, top banks, worst offenders. Filter by 30D / 90D / 1Y and sector |
| `/analysts` and `/analysts/[slug]` | Directory and a scorecard: firm, coverage, hit rate, return if followed, calls |
| `/banks` and `/banks/[slug]` | Firm rollup, sector mix, roster |
| `/tickers` and `/tickers/[symbol]` | Sample consensus versus who was right on that name |
| `/calls/[id]` | Rating change, target, prices, and the grade at each horizon |
| `/methodology` | The formula, read from the same constants the scorer uses |
| `/search` | Analyst, bank, or ticker |
| `/watchlist` | Saved in this browser only (`localStorage`). No account |

## Methodology (summary)

The full write-up is the Methodology page at `/methodology`. In short:

- **Up** ratings (Buy, Strong Buy, Overweight, Outperform) hit when the forward return is at least T.
- **Down** ratings (Sell, Underperform, Underweight) hit when the forward return is at most −T.
- **Flat** ratings (Hold, Neutral, Equal-Weight) hit when the absolute return is at most T.
- T is 2% at 30 days, 5% at 90 days, and 8% at 1 year. Windows are calendar days.
- A near-miss earns half of the 70 direction points and does **not** count as a hit.
- Target error is `|price at horizon − target| / price at call`. Inside a tight band it adds 30 points; past a wide band it adds none; in between it fades linearly. No target means the direction score is scaled to 100.
- Analyst and bank scores are the average call score. Banks are weighted by calls, not by headcount.
- “If followed” averages the stock return on buys and the inverse return on sells. Holds are excluded.
- Leaderboards hide thin samples (8 graded calls for an analyst, 20 for a bank; lower inside a sector filter).

The score is not market-adjusted. A buy in a rising tape can hit without insight. That limit is stated on the methodology page.

## Data model

SQLite via Prisma, file at `prisma/banktruth.db`.

- `Bank`, `Analyst`, `Ticker`, `Coverage`, `Call`
- A call stores the action, rating change, targets, price at the call, and prices 30, 90, and 365 days later
- Grades are computed when pages render (`src/lib/scoring.ts`). They are not baked into the row, so a formula change does not require a reseed

The demo generator (`prisma/seed.ts`) builds a seeded price path per ticker and lets each fictional analyst be “right” on the 90-day move with a fixed probability. That is why the 90-day board has a spread. It is a demonstration of the product, not a reconstruction of anyone’s research.

Firm names are recognizable labels so search behaves the way a reader expects. The people, notes, prices, and hit rates are synthetic.

## Replace the demo with a real feed

Do not scrape a rankings site. Use a licensed price history and a call archive you have the rights to.

1. Produce a CSV with one row per call. Required columns:

   `call_id,date,bank_slug,bank_name,analyst_slug,analyst_name,ticker,company,sector,action,rating_to,price_at_call`

   Optional columns:

   `bank_short,headquarters,analyst_title,industry,exchange,rating_from,price_target_from,price_target_to,price_30d,price_90d,price_1y,note`

   Dates are `YYYY-MM-DD`. Ratings: `strong_buy`, `buy`, `overweight`, `outperform`, `hold`, `neutral`, `equal_weight`, `underperform`, `underweight`, `sell`. Actions: `initiate`, `upgrade`, `downgrade`, `reiterate`, `target_raise`, `target_cut`. Outcome prices are the print 30, 90, and 365 **calendar** days after the call. Leave an outcome blank when that window has not elapsed.

2. A two-row example lives at `data/sample-import.csv`. It is not loaded by the seed.

3. Import:

   ```bash
   npm run import:calls -- data/your-feed.csv --replace
   ```

   `--replace` deletes the demo banks, analysts, tickers, and calls first. Without it, rows upsert by `call_id` and can sit beside the demo, which you usually do not want.

4. The import path is the adapter boundary:

   - `src/lib/imports/types.ts` — `RawCallRecord` and `CallFeedAdapter`
   - `src/lib/imports/csv-feed.ts` — `CsvCallFeed` and `JsonCallFeed`
   - `src/lib/imports/apply.ts` — `applyCallFeed()`, which upserts into Prisma
   - `scripts/import-calls.ts` — CLI

   A future licensed API is another class with `pull(): Promise<RawCallRecord[]>`, passed to `applyCallFeed`. The pages do not care where the rows came from. Keep `source` on the call so a demo row and a licensed row stay distinguishable.

5. Postgres, if you outgrow the file: point `DATABASE_URL` at a `postgresql://` URL, change the Prisma datasource provider to `postgresql`, and run `prisma db push`. `src/lib/db.ts` already uses a Postgres URL when it sees one, and falls back to the SQLite file otherwise. Outcome prices still have to be supplied by your feed; this app does not call a market-data vendor.

## Deploy

The app is a Next.js App Router project and can be deployed as a Node server (including Vercel).

- Build command: `npm run build` (this seeds SQLite during `prebuild`)
- No environment variables are required for the demo
- On Vercel the seeded file is copied to `/tmp` at runtime because the serverless filesystem is read-only outside that directory
- Treat that deploy as a **read-only demo**. A writable production feed should use Postgres (or another hosted database) rather than SQLite on serverless disk
- Set the framework preset to Next.js. Node 20 or newer

## Disclaimer

BankTruth is an independent demonstration. It is not investment advice. Past accuracy does not predict future results. Sample figures are not the actual recommendations or performance of any bank, analyst, or issuer. BankTruth is not affiliated with those firms or with any rankings publisher.
