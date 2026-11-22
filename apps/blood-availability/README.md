# Blood availability — Araria

Production-ready data pipeline and UI reference for showing e-RaktKosh blood
availability on a website.

**Scope locked with the product team**

| Decision | Value |
|---|---|
| Geography | Bihar → Araria only |
| Database | PostgreSQL (existing instance) |
| Refresh | every 240 minutes (4 hours), plus admin-triggered |
| History | 30 days |
| Clients | responsive web (desktop + mobile browsers), no native app |
| Centres | all 3 always listed; silent ones shown as “No current report” |
| Manual refresh | admin only |

---

## What it does

```
e-RaktKosh  →  sync worker  →  PostgreSQL  →  GET /api/blood/araria  →  web page
```

- Pulls `/bloodbanks` and `/blood-availability` for district `209`.
- Re-checks each registered centre individually when the district feed omits it.
- Stores the centre's own update time **and** our fetch time.
- Deduplicates: an unchanged report inserts no new snapshot.
- Returns the hierarchy **centre → blood group → every component**.
- Never renders “no report” as zero stock.

## Try it now (no database needed)

```bash
npm install
npm run dev
# http://localhost:8788
```

The demo server runs an in-memory Postgres (PGlite), seeds it from recorded
provider fixtures, and serves the page and API.

```bash
npm test          # 24 tests: parsing, timezone, sync, idempotency, API, retention
npm run typecheck
```

## Use it against your Postgres

```bash
cp .env.example .env          # set DATABASE_URL
npm run migrate               # creates the ek_* tables and views
npm run sync                  # one live pull
npm run sync -- --manual      # same, recorded as a manual run
npm run retention             # delete history older than 30 days
```

### Schedule

Linux cron:

```cron
# every 4 hours
0 */4 * * * cd /srv/blood-availability && /usr/bin/npm run sync >> /var/log/blood-sync.log 2>&1
# retention at 03:30
30 3 * * * cd /srv/blood-availability && /usr/bin/npm run retention >> /var/log/blood-sync.log 2>&1
```

Vercel / serverless: point a cron at a route that calls `runSync()` (see below).
The worker is small enough for a serverless cron, but make sure only one runs at
a time — use a Postgres advisory lock if you deploy more than one instance.

Alternatively, run the built-in scheduler, which loops every
`SYNC_INTERVAL_MINUTES` minutes and prunes history once a day:

```bash
npm run schedule
```

---

## Schema

Five tables plus two views. All prefixed `ek_` so they can live in your existing
database without collisions.

| Table | Purpose |
|---|---|
| `ek_centers` | 3 registered centres, metadata refreshed each run |
| `ek_sync_runs` | one row per sync attempt (status, counts, trigger, who) |
| `ek_stock_snapshots` | one row per distinct centre report; unique on `(center_id, content_hash)` |
| `ek_stock_cells` | one row per component × blood group (units + `available`/`nil`) |
| `ek_center_state` | current pointer per centre + `reporting` / `no_report` |
| `v_ek_center_current` | current snapshot per centre |
| `v_ek_summary` | district counters and freshest timestamps |

Key semantics:

- `reported_state = 'nil'` → the centre explicitly reported zero.
- **No row** → not reported. The API returns `status: "not_reported"` and `units: null`.
- `no_report` centre → no current snapshot; `totalUnits` is `null`, never `0`.

Timestamps:

- `source_entry_at` — the centre's own update time, parsed as `Asia/Kolkata`.
- `source_entry_raw` — the exact provider string, for audit.
- `fetched_at` — when our worker got the response (UTC).
- The API exposes `asOf` (our sync) and `sourceAsOf` (newest centre update).

Retention deletes snapshots older than 30 days **except** the one each centre
currently publishes.

---

## API

`GET /api/blood/araria`

```json
{
  "district": { "name": "Araria", "state": "Bihar" },
  "asOf": "2026-10-30T05:00:00.000Z",
  "sourceAsOf": "2026-10-30T03:12:20.000Z",
  "freshness": "fresh",
  "refreshIntervalMinutes": 240,
  "counts": {
    "centersListed": 3,
    "centersReporting": 2,
    "centersNoReport": 1,
    "totalUnits": 75,
    "groupsWithStock": 8
  },
  "centers": [
    {
      "id": "284908",
      "name": "Ms Lions Blood Centre Forbesganj Araria",
      "category": "Charitable/Vol",
      "address": "…",
      "phone": "9430882219",
      "reportStatus": "reporting",
      "dataMode": "snapshot",
      "sourceEntryAt": "2026-10-30T03:12:20.000Z",
      "fetchedAt": "2026-10-30T05:00:00.000Z",
      "totalUnits": 51,
      "groupsWithStock": ["A+", "B+", "O+", "AB+"],
      "groups": [
        {
          "code": "A+",
          "label": "A+",
          "totalUnits": 15,
          "hasStock": true,
          "components": [
            { "code": "whole_blood", "name": "Whole Blood", "shortName": "WB", "units": 15, "status": "in_stock" },
            { "code": "packed_red_blood_cells", "name": "Packed Red Blood Cells", "shortName": "PRBC", "units": 0, "status": "nil" },
            { "code": "fresh_frozen_plasma", "name": "Fresh Frozen Plasma", "shortName": "FFP", "units": null, "status": "not_reported" }
          ]
        }
      ]
    },
    {
      "id": "284905",
      "name": "Ms Lions Blood Centre",
      "reportStatus": "no_report",
      "totalUnits": null,
      "groups": []
    }
  ]
}
```

`POST /api/blood/sync` — admin only. `Authorization: Bearer $ADMIN_TOKEN`.

---

## Wiring into your site

The data layer is framework-agnostic. Your site only needs to call
`getArariaAvailability(db)`.

### Next.js (App Router)

```ts
// app/api/blood/araria/route.ts
import { Pool } from "pg";
import { getArariaAvailability } from "@/blood-availability/src/api/araria";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  const data = await getArariaAvailability(pool);
  return Response.json(data, {
    headers: {
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      "x-data-as-of": data.asOf ?? "",
    },
  });
}
```

```ts
// app/api/blood/sync/route.ts
import { Pool } from "pg";
import { runSync } from "@/blood-availability/src/sync/run";
import { EraktkoshSource } from "@/blood-availability/src/provider/eraktkosh";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// app/api/blood/sync/route.ts
import { Pool } from "pg";
import { runSync } from "@/blood-availability/src/sync/run";
import { EraktkoshSource } from "@/blood-availability/src/provider/eraktkosh";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  if (!process.env.ADMIN_TOKEN) {
    return new Response("admin route disabled", { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const client = await pool.connect();
  try {
    const result = await runSync({ db: client, source: new EraktkoshSource(), trigger: "manual" });
    return Response.json(result, { status: 202 });
  } finally {
    client.release();
  }
}
  const client = await pool.connect();
  try {
    const result = await runSync({ db: client, source: new EraktkoshSource(), trigger: "manual" });
    return Response.json(result, { status: 202 });
  } finally {
    client.release();
  }
}
```

Transactions require a single connection: pass `client`, not `pool`.

### Express

```ts
app.get("/api/blood/araria", async (_req, res) => {
  res.json(await getArariaAvailability(pool));
});
```

### Any other stack

Call the SQL views directly. `v_ek_center_current` gives one row per centre with
its current snapshot; `ek_stock_cells` gives the component × group cells.

---

## The page

`web/` is a dependency-free reference implementation: `index.html`, `styles.css`,
`app.js`, `sample-data.json`. It fetches `/api/blood/araria`, falls back to
`sample-data.json` when opened from disk, and is responsive down to small
phones.

`sample-data.json` is the single source for the offline preview:
`npm run web:sample` regenerates it from the live API (pass a URL) and rewrites
the embedded copy inside `app.js` (needed because browsers block `fetch()` on
`file://`). `test/web-sample.test.ts` fails if the two copies diverge.

Design tokens are CSS variables prefixed `--ba-`. Override them to match your
design system; the structure (cards, chips, tables, status pills) maps 1:1 to
common component libraries.

Behaviour worth preserving when you port it:

- group chips are accessible tabs (`role="tablist"`, arrow keys, `aria-selected`);
- `?group=A%2B` keeps the selection shareable;
- no-report centres appear in a muted section with a phone link;
- every timestamp is rendered in `Asia/Kolkata`, never the viewer's zone;
- `not_reported` renders as “—” and “Not reported”, never `0`.

---

## Operations

- **Freshness:** `fresh` ≤ 6h, `aging` ≤ 24h, `stale` beyond. The page shows the
  pill and both timestamps.
- **Failure:** a network or schema failure marks the run `failed` and changes no
  centre data. One bad centre marks the run `partial`; the others still commit.
- **Empty feed protection:** each centre is re-checked individually when the
  district feed omits it. If more than half of the previously reporting centres
  come back empty in the same run (minimum 2), the run is marked `partial` with
  `SUSPICIOUS_DROP` and the previous reports stay published. A provider outage
  cannot blank the page. See `runSync` in `src/sync/run.ts`.
- **Admin refresh:** `npm run sync -- --manual`, or the POST route above.
- **Monitoring:** query `ek_sync_runs` for the last successful run and its counts.
  Alert if `now() - finished_at > 6 hours`.

---

## Attribution

The page footer credits e-RaktKosh, Ministry of Health & Family Welfare. Keep it.
The disclaimer (“self-reported, may be out of date, call before travelling, not
medical advice”) should stay in both web and mobile layouts.

---

## Files

```
db/migrations/001_init.sql     tables, indexes, views
src/domain/catalog.ts          canonical groups + components
src/provider/                  HTTP source, Zod schemas, normalizer
src/sync/run.ts                the sync transaction
src/sync/retention.ts          30-day prune
src/api/araria.ts              read model for the page
src/cli/                       migrate, sync, retention, demo server
test/                          fixtures + 24 tests
web/                           responsive reference page
```
