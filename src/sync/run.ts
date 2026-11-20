import type { Queryable } from "../db/types";
import { normalizeReport } from "../provider/normalize";
import type { BloodSource } from "../provider/eraktkosh";
import type { RawAvailabilityRecord, RawCenter } from "../provider/schema";

export type SyncTrigger = "schedule" | "manual" | "backfill";

export interface SyncOptions {
  db: Queryable;
  source: BloodSource;
  trigger?: SyncTrigger;
  requestedBy?: string | null;
  now?: Date;
  logger?: (message: string) => void;
}

export interface SyncResult {
  runId: number;
  status: "succeeded" | "partial" | "failed";
  centersSeen: number;
  centersReporting: number;
  snapshotsInserted: number;
  snapshotsUnchanged: number;
  errors: string[];
}

interface IdRow {
  id: string | number;
}

interface StateRow {
  center_id: string | number;
  last_report_status: "unknown" | "reporting" | "no_report";
  last_snapshot_id: string | number | null;
}

/**
 * Pull one district and persist it.
 *
 * All three registered centres are upserted on every run. A centre that returns
 * no report keeps its previous snapshot pointer and is marked `no_report`;
 * it is never written as zero stock.
 *
 * If most of the district suddenly stops reporting, the run is treated as an
 * upstream fault rather than fresh truth: previous states are left untouched
 * and the run is recorded as `partial` with `SUSPICIOUS_DROP`. A district-wide
 * outage of the provider should never blank the public page.
 */
export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { db, source } = options;
  const now = options.now ?? new Date();
  const trigger = options.trigger ?? "schedule";
  const log = options.logger ?? (() => {});

  const run = await db.query<IdRow>(
    `insert into ek_sync_runs (trigger_kind, status, requested_by, started_at)
     values ($1, 'running', $2, $3) returning id`,
    [trigger, options.requestedBy ?? null, now]
  );
  const runId = Number(run.rows[0]!.id);

  const errors: string[] = [];
  let centersSeen = 0;
  let centersReporting = 0;
  let snapshotsInserted = 0;
  let snapshotsUnchanged = 0;

  const finish = async (
    status: "succeeded" | "partial" | "failed",
    error: string | null
  ): Promise<SyncResult> => {
    await db.query(
      `update ek_sync_runs
          set status = $2, finished_at = $3, centers_seen = $4,
              centers_reporting = $5, snapshots_inserted = $6,
              snapshots_unchanged = $7, error = $8
        where id = $1`,
      [runId, status, new Date(), centersSeen, centersReporting, snapshotsInserted, snapshotsUnchanged, error]
    );
    return {
      runId,
      status,
      centersSeen,
      centersReporting,
      snapshotsInserted,
      snapshotsUnchanged,
      errors,
    };
  };

  let banks: RawCenter[];
  let availability: RawAvailabilityRecord[];

  try {
    banks = await source.listCenters();
    availability = await source.fetchAvailability();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finish("failed", message);
    throw error;
  }

  const byCode = new Map(availability.map((record) => [record.hospitalCode, record]));
  centersSeen = banks.length;

  // A centre can appear in the availability feed without being listed by
  // /bloodbanks. Union both sources so it is never dropped.
  for (const record of availability) {
    if (!banks.some((bank) => bank.hospitalCode === record.hospitalCode)) {
      banks.push({
        hospitalCode: record.hospitalCode,
        hospitalName: record.hospitalname,
        mobileNo: null,
      });
    }
  }

  await db.query("begin");

  let suspiciousDrop = false;

  try {
    // Snapshot of what the public page is showing before this run touches it.
    const priorStates = await db.query<StateRow>(
      `select center_id, last_report_status, last_snapshot_id from ek_center_state`
    );
    const previouslyReporting = new Set<number>();
    for (const row of priorStates.rows) {
      if (row.last_report_status === "reporting" && row.last_snapshot_id != null) {
        previouslyReporting.add(Number(row.center_id));
      }
    }

    // Centres that came back empty. They are only demoted after the whole
    // district has been checked, so one silent centre cannot mask an outage.
    const pendingNoReport: number[] = [];

    for (const bank of banks) {
      await db.query("savepoint center_row");
      try {
        let record = byCode.get(bank.hospitalCode);

        // "Every time go for data": if the district feed did not include this
        // centre, ask for it explicitly before deciding it has no report.
        if (!record || !record.components || Object.keys(record.components).length === 0) {
          const single = await source.fetchAvailability([bank.hospitalCode]);
          record = single.find((r) => r.hospitalCode === bank.hospitalCode) ?? record;
        }

        const centerId = await upsertCenter(db, bank, record, now);
        await ensureState(db, centerId);

        const hasReport = Boolean(record?.components && Object.keys(record.components).length > 0);

        if (record && hasReport) {
          const report = normalizeReport(record);
          for (const warning of report.warnings) log(`center ${bank.hospitalCode}: ${warning}`);

          const snapshotId = await insertSnapshot(db, centerId, runId, report, now);
          if (snapshotId.inserted) {
            await insertCells(db, snapshotId.id, report);
            snapshotsInserted++;
          } else {
            snapshotsUnchanged++;
          }

          await db.query(
            `update ek_center_state
                set last_snapshot_id = $2,
                    last_report_status = 'reporting',
                    last_source_entry_at = $3,
                    last_fetched_at = $4,
                    updated_at = now()
              where center_id = $1`,
            [centerId, snapshotId.id, report.sourceEntryAt, now]
          );
          centersReporting++;
        } else {
          pendingNoReport.push(centerId);
        }

        await db.query("release savepoint center_row");
      } catch (error) {
        await db.query("rollback to savepoint center_row");
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${bank.hospitalCode}: ${message}`);
        log(`center ${bank.hospitalCode} failed: ${message}`);
      }
    }

    // A centre that reported before and is silent now is only demoted when the
    // drop is plausible. Losing most of the district at once is not.
    const lostReporting = pendingNoReport.filter((centerId) => previouslyReporting.has(centerId));
    suspiciousDrop =
      previouslyReporting.size >= MASS_DROP_MIN_CENTRES &&
      lostReporting.length * 2 > previouslyReporting.size;

    if (suspiciousDrop) {
      const message =
        `SUSPICIOUS_DROP: ${lostReporting.length} of ${previouslyReporting.size} reporting ` +
        `centres returned no data; previous reports kept`;
      errors.push(message);
      log(message);
    } else {
      for (const centerId of pendingNoReport) {
        await db.query(
          `update ek_center_state
              set last_report_status = 'no_report',
                  last_fetched_at = $2,
                  updated_at = now()
            where center_id = $1`,
          [centerId, now]
        );
      }
    }

    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    const message = error instanceof Error ? error.message : String(error);
    await finish("failed", message);
    throw error;
  }

  if (suspiciousDrop && !errors.length) errors.push("SUSPICIOUS_DROP");
  return finish(errors.length ? "partial" : "succeeded", errors.length ? errors.join("; ") : null);
}

/** Never call a district-wide silence from a two-centre district a drop. */
const MASS_DROP_MIN_CENTRES = 2;

async function upsertCenter(
  db: Queryable,
  bank: RawCenter,
  record: RawAvailabilityRecord | undefined,
  now: Date
): Promise<number> {
  const name = record?.hospitalname?.trim() || bank.hospitalName.trim();
  const address = record?.hospitaladd?.trim() || null;
  const category = record?.hospitalType?.trim() || null;
  const phone = extractPhone(record?.hospitalcontact) ?? extractPhone(bank.mobileNo);

  const result = await db.query<IdRow>(
    `insert into ek_centers (provider_center_code, name, address, phone, category, last_seen_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (provider_center_code) do update set
       name         = excluded.name,
       address      = coalesce(excluded.address, ek_centers.address),
       phone        = coalesce(excluded.phone, ek_centers.phone),
       category     = coalesce(excluded.category, ek_centers.category),
       is_active    = true,
       last_seen_at = excluded.last_seen_at
     returning id`,
    [bank.hospitalCode, name, address, phone, category, now]
  );

  return Number(result.rows[0]!.id);
}

async function ensureState(db: Queryable, centerId: number): Promise<void> {
  await db.query(
    `insert into ek_center_state (center_id) values ($1) on conflict (center_id) do nothing`,
    [centerId]
  );
}

async function insertSnapshot(
  db: Queryable,
  centerId: number,
  runId: number,
  report: ReturnType<typeof normalizeReport>,
  now: Date
): Promise<{ id: number; inserted: boolean }> {
  const inserted = await db.query<IdRow>(
    `insert into ek_stock_snapshots
       (center_id, sync_run_id, source_entry_at, source_entry_raw, fetched_at, data_mode, total_units, content_hash)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (center_id, content_hash) do nothing
     returning id`,
    [
      centerId,
      runId,
      report.sourceEntryAt,
      report.sourceEntryRaw,
      now,
      report.dataMode,
      report.totalUnits,
      report.contentHash,
    ]
  );

  if (inserted.rows[0]) {
    return { id: Number(inserted.rows[0].id), inserted: true };
  }

  const existing = await db.query<IdRow>(
    `select id from ek_stock_snapshots where center_id = $1 and content_hash = $2`,
    [centerId, report.contentHash]
  );
  return { id: Number(existing.rows[0]!.id), inserted: false };
}

async function insertCells(
  db: Queryable,
  snapshotId: number,
  report: ReturnType<typeof normalizeReport>
): Promise<void> {
  if (!report.cells.length) return;

  await db.query(
    `insert into ek_stock_cells (snapshot_id, component_code, group_code, units, reported_state)
     select $1::bigint, component_code, group_code, units, reported_state
       from unnest($2::text[], $3::text[], $4::int[], $5::text[])
            as t(component_code, group_code, units, reported_state)`,
    [
      snapshotId,
      report.cells.map((c) => c.componentCode),
      report.cells.map((c) => c.groupCode),
      report.cells.map((c) => c.units),
      report.cells.map((c) => c.reportedState),
    ]
  );
}

/** Extract an Indian mobile number from a free-text contact string. */
export function extractPhone(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const text = String(raw);
  if (!text.trim() || text.trim() === "0") return null;

  const match = /(?:\+?91[\s-]?)?([6-9]\d{9})/.exec(text.replace(/[^\d+\s-]/g, " "));
  return match?.[1] ?? null;
}
