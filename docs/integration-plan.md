# Blood Availability — Araria (implementation record)

**Status:** built in `blood-availability/`. This file records the decisions; the
implementation and run instructions live in `blood-availability/README.md`.

## Locked decisions

| Topic | Decision |
|---|---|
| Stack | Next.js-compatible core; plain TypeScript + Node worker; no framework lock-in |
| Database | PostgreSQL (existing instance), tables prefixed `ek_` |
| Geography | Bihar → Araria only (district `209`) |
| Centres | all 3 listed; silent ones shown as "No current report" |
| Refresh | every 240 minutes + admin-triggered |
| History | 30 days |
| Clients | responsive web only (desktop + mobile browsers) |
| Manual refresh | admin |
| Permissions | product team confirmed no external sign-off required |

## Architecture

```
e-RaktKosh API
   ↓  (2 calls + per-centre re-checks)
Sync worker  ── every 4h, or POST /api/blood/sync
   ↓
PostgreSQL: ek_centers, ek_sync_runs, ek_stock_snapshots,
            ek_stock_cells, ek_center_state (+ 2 views)
   ↓
GET /api/blood/araria
   ↓
Responsive web page (centre → blood group → component)
```

## Storage rules

- `ek_stock_snapshots` holds one row per distinct report; unique on
  `(center_id, content_hash)`, so an unchanged sync inserts nothing.
- `ek_stock_cells` holds one row per component × group; missing row means
  "not reported", never zero.
- `ek_center_state` points at the published snapshot and holds
  `reporting` / `no_report`.
- Two timestamps everywhere: `source_entry_at` (centre) and `fetched_at` (us).

## Why not one table

A single flat table was considered. It would work at this volume, but the
snapshot/line split gives idempotent upserts, clean 30-day history and a
single-row current pointer. `v_ek_center_current` is the "one table" view if a
consumer wants it.

## Delivered

- `db/migrations/001_init.sql`
- `src/provider/*` — HTTP source, Zod validation, normalisation
- `src/sync/*` — transactional sync, dedupe, retention
- `src/api/araria.ts` — read model
- `src/cli/*` — migrate, sync, retention, demo server
- `test/*` - 24 passing tests
- `web/*` — responsive reference page

## Verification

- `npm test` - 24 tests
- `npm run typecheck` — clean
- Araria fixtures captured from the live portal in `test/fixtures/`

## Open items for the site team

1. Point `DATABASE_URL` at the existing Postgres and run `npm run migrate`.
2. Add the two routes (or call the functions from the existing controllers).
3. Port `web/` into the site's design system; override the `--ba-*` tokens.
4. Schedule `npm run sync` every 4 hours and `npm run retention` nightly.
