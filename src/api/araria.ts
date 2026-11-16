import { CONFIG } from "../config";
import type { Queryable } from "../db/types";
import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  COMPONENT_BY_CODE,
  GROUP_BY_CODE,
} from "../domain/catalog";

export type CellStatus = "in_stock" | "nil" | "not_reported";

export interface ComponentView {
  code: string;
  name: string;
  shortName: string;
  units: number | null;
  status: CellStatus;
}

export interface GroupView {
  code: string;
  label: string;
  totalUnits: number;
  hasStock: boolean;
  components: ComponentView[];
}

export interface CenterView {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  reportStatus: "reporting" | "no_report";
  dataMode: "live" | "snapshot" | null;
  sourceEntryAt: string | null;
  fetchedAt: string | null;
  totalUnits: number | null;
  groupsWithStock: string[];
  groups: GroupView[];
}

export interface ArariaAvailability {
  district: { name: string; state: string };
  asOf: string | null;
  sourceAsOf: string | null;
  freshness: "fresh" | "aging" | "stale" | "none";
  refreshIntervalMinutes: number;
  counts: {
    centersListed: number;
    centersReporting: number;
    centersNoReport: number;
    totalUnits: number | null;
    groupsWithStock: number;
  };
  centers: CenterView[];
}

interface CenterRow {
  center_id: string | number;
  provider_code: string;
  name: string;
  address: string | null;
  phone: string | null;
  category: string | null;
  last_report_status: "unknown" | "reporting" | "no_report";
  last_source_entry_at: Date | string | null;
  last_fetched_at: Date | string | null;
  snapshot_id: string | number | null;
  source_entry_at: Date | string | null;
  data_mode: "live" | "snapshot" | null;
  total_units: number | null;
}

interface CellRow {
  snapshot_id: string | number;
  component_code: string;
  group_code: string;
  units: number;
  reported_state: "available" | "nil";
}

interface SummaryRow {
  centers_listed: number | string | null;
  centers_reporting: number | string | null;
  centers_no_report: number | string | null;
  as_of: Date | string | null;
  source_as_of: Date | string | null;
  total_units: number | string | null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function freshnessOf(asOf: string | null, now: Date): ArariaAvailability["freshness"] {
  if (!asOf) return "none";
  const minutes = (now.getTime() - new Date(asOf).getTime()) / 60_000;
  if (minutes <= CONFIG.freshMinutes) return "fresh";
  if (minutes <= CONFIG.agingMinutes) return "aging";
  return "stale";
}

/**
 * Read model for the Araria page. Reads only the current snapshot per centre;
 * `no_report` centres are returned with `totalUnits: null`, never zero.
 */
export async function getArariaAvailability(
  db: Queryable,
  options: { now?: Date } = {}
): Promise<ArariaAvailability> {
  const now = options.now ?? new Date();

  const [summaryResult, centersResult] = await Promise.all([
    db.query<SummaryRow>(`select * from v_ek_summary`),
    db.query<CenterRow>(
      `select * from v_ek_center_current
        order by case when last_report_status = 'reporting' then 0 else 1 end, name`
    ),
  ]);

  const summary = summaryResult.rows[0];
  const centers = centersResult.rows;

  const snapshotIds = centers
    .map((c) => (c.snapshot_id == null ? null : Number(c.snapshot_id)))
    .filter((id): id is number => id != null);

  let cellsBySnapshot = new Map<number, CellRow[]>();
  if (snapshotIds.length) {
    const placeholders = snapshotIds.map((_, index) => `$${index + 1}`).join(", ");
    const cells = await db.query<CellRow>(
      `select snapshot_id, component_code, group_code, units, reported_state
         from ek_stock_cells
        where snapshot_id in (${placeholders})`,
      snapshotIds
    );
    cellsBySnapshot = new Map();
    for (const cell of cells.rows) {
      const key = Number(cell.snapshot_id);
      const list = cellsBySnapshot.get(key) ?? [];
      list.push(cell);
      cellsBySnapshot.set(key, list);
    }
  }

  const centerViews: CenterView[] = centers.map((row) => {
    const base = {
      id: row.provider_code,
      name: row.name,
      category: row.category,
      address: row.address,
      phone: row.phone,
      dataMode: row.data_mode ?? null,
      sourceEntryAt: toIso(row.source_entry_at),
      fetchedAt: toIso(row.last_fetched_at),
    };

    const isReporting = row.last_report_status === "reporting" && row.snapshot_id != null;

    if (!isReporting) {
      return {
        ...base,
        reportStatus: "no_report",
        sourceEntryAt: null,
        dataMode: null,
        totalUnits: null,
        groupsWithStock: [],
        groups: [],
      };
    }

    const cells = cellsBySnapshot.get(Number(row.snapshot_id)) ?? [];
    const byGroup = new Map<string, CellRow[]>();
    for (const cell of cells) {
      const list = byGroup.get(cell.group_code) ?? [];
      list.push(cell);
      byGroup.set(cell.group_code, list);
    }

    const groups: GroupView[] = BLOOD_GROUPS.filter((group) => byGroup.has(group.code)).map(
      (group) => {
        const groupCells = new Map(byGroup.get(group.code)!.map((c) => [c.component_code, c]));
        const components: ComponentView[] = BLOOD_COMPONENTS.map((component) => {
          const cell = groupCells.get(component.code);
          if (!cell) {
            return {
              code: component.code,
              name: component.name,
              shortName: component.shortName,
              units: null,
              status: "not_reported",
            };
          }
          return {
            code: component.code,
            name: component.name,
            shortName: component.shortName,
            units: cell.units,
            status: cell.units > 0 ? "in_stock" : "nil",
          };
        });

        const totalUnits = components.reduce((sum, c) => sum + (c.units ?? 0), 0);

        return {
          code: group.code,
          label: group.label,
          totalUnits,
          hasStock: totalUnits > 0,
          components,
        };
      }
    );

    return {
      ...base,
      reportStatus: "reporting",
      totalUnits: row.total_units ?? 0,
      groupsWithStock: groups.filter((g) => g.hasStock).map((g) => g.code),
      groups,
    };
  });

  const asOf = toIso(summary?.as_of ?? null);
  const sourceAsOf = toIso(summary?.source_as_of ?? null);

  const allStockGroups = new Set<string>();
  for (const center of centerViews) {
    for (const group of center.groupsWithStock) allStockGroups.add(group);
  }

  return {
    district: { name: CONFIG.districtName, state: CONFIG.stateName },
    asOf,
    sourceAsOf,
    freshness: freshnessOf(asOf, now),
    refreshIntervalMinutes: CONFIG.syncIntervalMinutes,
    counts: {
      centersListed: Number(summary?.centers_listed ?? 0),
      centersReporting: Number(summary?.centers_reporting ?? 0),
      centersNoReport: Number(summary?.centers_no_report ?? 0),
      totalUnits: summary?.total_units == null ? null : Number(summary.total_units),
      groupsWithStock: allStockGroups.size,
    },
    centers: centerViews,
  };
}

/** Exposed for tests and for the UI contract docs. */
export function describeGroup(code: string): string | null {
  return GROUP_BY_CODE.get(code)?.label ?? null;
}

export function describeComponent(code: string): string | null {
  return COMPONENT_BY_CODE.get(code)?.name ?? null;
}
