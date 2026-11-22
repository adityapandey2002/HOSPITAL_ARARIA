import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { asDb, count, createTestDb, makeSource } from "./helpers";
import { runSync } from "../src/sync/run";
import { getArariaAvailability } from "../src/api/araria";
import { pruneHistory } from "../src/sync/retention";
import { parseIstTimestamp } from "../src/provider/normalize";

const NOW = new Date("2026-10-30T05:00:00.000Z");

let db: PGlite;

beforeEach(async () => {
  db = await createTestDb();
});

describe("sync", () => {
  it("lists every registered centre and marks the silent one no_report", async () => {
    const result = await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    expect(result.status).toBe("succeeded");
    expect(result.centersSeen).toBe(3);
    expect(result.centersReporting).toBe(2);
    expect(result.snapshotsInserted).toBe(2);

    expect(await count(db, "ek_centers")).toBe(3);
    expect(await count(db, "ek_stock_snapshots")).toBe(2);

    const silent = await db.query<{ last_report_status: string; last_snapshot_id: string | null }>(
      `select s.last_report_status, s.last_snapshot_id
         from ek_center_state s
         join ek_centers c on c.id = s.center_id
        where c.provider_center_code = '284905'`
    );
    expect(silent.rows[0]).toEqual({ last_report_status: "no_report", last_snapshot_id: null });
  });

  it("is idempotent: an unchanged run inserts nothing", async () => {
    const source = makeSource();
    await runSync({ db: asDb(db), source, now: NOW });

    const second = await runSync({
      db: asDb(db),
      source,
      now: new Date("2026-10-30T06:00:00.000Z"),
    });

    expect(second.snapshotsInserted).toBe(0);
    expect(second.snapshotsUnchanged).toBe(2);
    expect(await count(db, "ek_stock_snapshots")).toBe(2);
  });

  it("stores the centre's own time and our fetch time separately", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    const fixture = JSON.parse(
      readFileSync(new URL("./fixtures/availability.json", import.meta.url), "utf8")
    ) as Array<{ hospitalCode: string; entrydate?: string }>;
    const record = fixture.find((r) => r.hospitalCode === "284908")!;
    const expectedEntry = parseIstTimestamp(record.entrydate)!.toISOString();

    const row = await db.query<{
      source_entry_at: Date | null;
      fetched_at: Date;
      data_mode: string;
    }>(
      `select snap.source_entry_at, snap.fetched_at, snap.data_mode
         from ek_stock_snapshots snap
         join ek_centers c on c.id = snap.center_id
        where c.provider_center_code = '284908'`
    );

    expect(new Date(row.rows[0]!.source_entry_at!).toISOString()).toBe(expectedEntry);
    expect(new Date(row.rows[0]!.fetched_at).toISOString()).toBe(NOW.toISOString());
    expect(row.rows[0]!.data_mode).toBe("snapshot");
  });

  it("creates a new snapshot when the centre re-submits with a later entry time", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    const changed = makeSource((records) =>
      records.map((record) =>
        record.hospitalCode === "284908"
          ? { ...record, entrydate: "2027-01-01 09:15:00" }
          : record
      )
    );

    const second = await runSync({
      db: asDb(db),
      source: changed,
      now: new Date("2026-10-30T06:00:00.000Z"),
    });

    expect(second.snapshotsInserted).toBe(1);
    expect(second.snapshotsUnchanged).toBe(1);
    expect(await count(db, "ek_stock_snapshots")).toBe(3);
  });

  it("keeps published data when the provider suddenly returns nothing", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    const empty = makeSource(() => []);
    const second = await runSync({
      db: asDb(db),
      source: empty,
      now: new Date("2026-10-30T09:00:00.000Z"),
    });

    expect(second.status).toBe("partial");
    expect(second.errors.some((error) => error.includes("SUSPICIOUS_DROP"))).toBe(true);
    expect(second.centersReporting).toBe(0);
    expect(await count(db, "ek_stock_snapshots")).toBe(2);

    // The public page must still serve the last good reports.
    const data = await getArariaAvailability(asDb(db), {
      now: new Date("2026-10-30T09:00:00.000Z"),
    });
    expect(data.counts.centersReporting).toBe(2);
    expect(data.counts.centersNoReport).toBe(1);
    expect(data.counts.totalUnits).toBe(75);
    expect(data.centers.find((c) => c.id === "284908")!.totalUnits).toBe(51);
    expect(data.centers.find((c) => c.id === "10140")!.totalUnits).toBe(24);
  });

  it("still demotes a centre when only one of two stops reporting", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    const oneSilent = makeSource((records) =>
      records.filter((record) => record.hospitalCode !== "10140")
    );
    const second = await runSync({
      db: asDb(db),
      source: oneSilent,
      now: new Date("2026-10-30T09:00:00.000Z"),
    });

    expect(second.status).toBe("succeeded");
    expect(second.centersReporting).toBe(1);

    const data = await getArariaAvailability(asDb(db), {
      now: new Date("2026-10-30T09:00:00.000Z"),
    });
    const silent = data.centers.find((c) => c.id === "10140")!;
    expect(silent.reportStatus).toBe("no_report");
    expect(silent.totalUnits).toBeNull();
  });
});

describe("api", () => {
  it("returns the centre -> blood group -> component hierarchy", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });
    const data = await getArariaAvailability(asDb(db), { now: NOW });

    expect(data.district).toEqual({ name: "Araria", state: "Bihar" });
    expect(data.counts).toMatchObject({
      centersListed: 3,
      centersReporting: 2,
      centersNoReport: 1,
    });
    expect(data.freshness).toBe("fresh");

    const reporting = data.centers.find((c) => c.id === "284908")!;
    expect(reporting.reportStatus).toBe("reporting");
    expect(reporting.groups).toHaveLength(10);
    expect(reporting.groups[0]!.components).toHaveLength(14);
    expect(reporting.groupsWithStock.length).toBeGreaterThan(0);

    const totalFromGroups = reporting.groups.reduce((sum, g) => sum + g.totalUnits, 0);
    expect(reporting.totalUnits).toBe(totalFromGroups);
  });

  it("never renders a no-report centre as zero", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });
    const data = await getArariaAvailability(asDb(db), { now: NOW });

    const silent = data.centers.find((c) => c.id === "284905")!;
    expect(silent.reportStatus).toBe("no_report");
    expect(silent.totalUnits).toBeNull();
    expect(silent.groups).toEqual([]);
    expect(silent.groupsWithStock).toEqual([]);
  });

  it("distinguishes nil from not_reported inside a reporting centre", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });
    const data = await getArariaAvailability(asDb(db), { now: NOW });

    const center = data.centers.find((c) => c.id === "284908")!;
    const statuses = new Set(
      center.groups.flatMap((g) => g.components.map((c) => c.status))
    );

    expect(statuses.has("in_stock") || statuses.has("nil")).toBe(true);
    for (const group of center.groups) {
      for (const component of group.components) {
        if (component.status === "not_reported") expect(component.units).toBeNull();
        if (component.status === "nil") expect(component.units).toBe(0);
      }
    }
  });
});

describe("retention", () => {
  it("removes old history but never the published snapshot", async () => {
    await runSync({ db: asDb(db), source: makeSource(), now: NOW });

    const changed = makeSource((records) =>
      records.map((record) =>
        record.hospitalCode === "284908"
          ? { ...record, entrydate: "2027-01-01 09:15:00" }
          : record
      )
    );
    await runSync({
      db: asDb(db),
      source: changed,
      now: new Date("2026-10-30T06:00:00.000Z"),
    });

    expect(await count(db, "ek_stock_snapshots")).toBe(3);

    await db.query(
      `update ek_stock_snapshots
          set fetched_at = now() - interval '40 days'
        where id not in (
          select last_snapshot_id from ek_center_state where last_snapshot_id is not null
        )`
    );

    expect(await pruneHistory(asDb(db), { days: 30 })).toBe(1);
    expect(await count(db, "ek_stock_snapshots")).toBe(2);
    expect(await pruneHistory(asDb(db), { days: 30 })).toBe(0);
  });
});
