/**
 * e-RaktKosh schema, embedded as TypeScript.
 *
 * Why not a `.sql` file read at runtime?
 * The API runs as a Vercel serverless function. `nest build` only emits `.js`,
 * and Vercel's output-file tracer cannot see a dynamic `readdir()` of a data
 * directory, so the migration files were absent from the deployed bundle and
 * every request failed at boot with:
 *
 *   ENOENT: no such file or directory, scandir '.../dist/modules/eraktkosh/db/migrations'
 *
 * Keeping the DDL in a compiled module removes all runtime filesystem access,
 * so the same code works locally, in tests, and in the serverless bundle.
 *
 * The DDL is idempotent (`create table if not exists`, `create or replace
 * view`), so running it on every cold start is safe.
 */
export interface Migration {
  readonly id: string;
  readonly sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    id: "001_init",
    sql: `
-- e-RaktKosh blood availability — Araria district
-- PostgreSQL 14+. Safe to re-run (idempotent DDL).
--
-- Scope: one district (Bihar / Araria). Three centres, one of which usually
-- reports. History is kept for 30 days; \`ek_center_state\` points at the
-- current report so reads never scan history.

create table if not exists ek_centers (
  id                   bigint generated always as identity primary key,
  provider_center_code text        not null unique,
  name                 text        not null,
  address              text,
  phone                text,
  category             text,
  is_active            boolean     not null default true,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  constraint ek_centers_name_ck check (btrim(name) <> '')
);

create table if not exists ek_sync_runs (
  id                   bigint generated always as identity primary key,
  trigger_kind         text        not null check (trigger_kind in ('schedule', 'manual', 'backfill')),
  status               text        not null default 'running'
                                   check (status in ('running', 'succeeded', 'partial', 'failed')),
  requested_by         text,
  started_at           timestamptz not null default now(),
  finished_at          timestamptz,
  centers_seen         integer     not null default 0 check (centers_seen >= 0),
  centers_reporting    integer     not null default 0 check (centers_reporting >= 0),
  snapshots_inserted   integer     not null default 0 check (snapshots_inserted >= 0),
  snapshots_unchanged  integer     not null default 0 check (snapshots_unchanged >= 0),
  error                text
);

create index if not exists ek_sync_runs_started_idx
  on ek_sync_runs (started_at desc);

-- One row per distinct report from a centre. \`content_hash\` covers the
-- centre's entry time plus every cell, so re-syncing unchanged data inserts
-- nothing and only moves ek_center_state.last_fetched_at.
create table if not exists ek_stock_snapshots (
  id                bigint generated always as identity primary key,
  center_id         bigint      not null references ek_centers(id) on delete cascade,
  sync_run_id       bigint      references ek_sync_runs(id) on delete set null,
  source_entry_at   timestamptz,
  source_entry_raw  text,
  fetched_at        timestamptz not null,
  data_mode         text        not null check (data_mode in ('live', 'snapshot')),
  total_units       integer     not null default 0 check (total_units >= 0),
  content_hash      text        not null check (content_hash ~ '^[0-9a-f]{64}$'),
  inserted_at       timestamptz not null default now(),
  unique (center_id, content_hash),
  constraint ek_snapshots_entry_ck check (source_entry_at is null or source_entry_raw is not null)
);

create index if not exists ek_snapshots_center_entry_idx
  on ek_stock_snapshots (center_id, source_entry_at desc nulls last);

create index if not exists ek_snapshots_fetched_idx
  on ek_stock_snapshots (fetched_at);

-- One row per component x blood group for a snapshot.
-- reported_state='nil' means the centre explicitly reported zero;
-- a missing row means "not reported" and must never be rendered as zero.
create table if not exists ek_stock_cells (
  snapshot_id     bigint  not null references ek_stock_snapshots(id) on delete cascade,
  component_code  text    not null,
  group_code      text    not null,
  units           integer not null check (units >= 0),
  reported_state  text    not null check (reported_state in ('available', 'nil')),
  primary key (snapshot_id, component_code, group_code),
  constraint ek_cells_nil_ck check (
    (reported_state = 'nil' and units = 0) or
    (reported_state = 'available' and units >= 0)
  )
);

create index if not exists ek_cells_group_idx
  on ek_stock_cells (group_code, component_code, snapshot_id);

-- Current pointer + reporting status per centre.
create table if not exists ek_center_state (
  center_id            bigint primary key references ek_centers(id) on delete cascade,
  last_snapshot_id     bigint references ek_stock_snapshots(id) on delete set null,
  last_report_status   text        not null default 'unknown'
                                   check (last_report_status in ('unknown', 'reporting', 'no_report')),
  last_source_entry_at timestamptz,
  last_fetched_at      timestamptz,
  updated_at           timestamptz not null default now()
);

create index if not exists ek_center_state_status_idx
  on ek_center_state (last_report_status, last_fetched_at);

-- ---------------------------------------------------------------------------
-- Read models
-- ---------------------------------------------------------------------------

create or replace view v_ek_center_current as
select
  c.id                   as center_id,
  c.provider_center_code as provider_code,
  c.name,
  c.address,
  c.phone,
  c.category,
  c.is_active,
  s.last_report_status,
  s.last_source_entry_at,
  s.last_fetched_at,
  snap.id                as snapshot_id,
  snap.source_entry_at,
  snap.data_mode,
  snap.total_units
from ek_centers c
join ek_center_state s on s.center_id = c.id
left join ek_stock_snapshots snap on snap.id = s.last_snapshot_id;

create or replace view v_ek_summary as
select
  count(*) filter (where c.is_active)                                  as centers_listed,
  count(*) filter (where c.is_active and s.last_report_status = 'reporting') as centers_reporting,
  count(*) filter (where c.is_active and s.last_report_status = 'no_report') as centers_no_report,
  max(s.last_fetched_at)                                              as as_of,
  max(s.last_source_entry_at)                                         as source_as_of,
  sum(case when s.last_report_status = 'reporting'
          then snap.total_units end)::int                          as total_units
from ek_centers c
join ek_center_state s on s.center_id = c.id
left join ek_stock_snapshots snap on snap.id = s.last_snapshot_id;
`,
  },
];
