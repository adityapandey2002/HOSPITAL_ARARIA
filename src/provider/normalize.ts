import { createHash } from "node:crypto";
import {
  BLOOD_COMPONENTS,
  COMPONENT_BY_PROVIDER_NAME,
  normalizeName,
  resolveGroupCode,
} from "../domain/catalog";
import type { RawAvailabilityRecord } from "./schema";

export type DataMode = "live" | "snapshot";
export type ReportedState = "available" | "nil";

export interface NormalizedCell {
  componentCode: string;
  componentName: string;
  groupCode: string;
  units: number;
  reportedState: ReportedState;
}

export interface NormalizedReport {
  dataMode: DataMode;
  sourceEntryRaw: string | null;
  sourceEntryAt: Date | null;
  cells: NormalizedCell[];
  totalUnits: number;
  componentCount: number;
  contentHash: string;
  warnings: string[];
}

/**
 * "A+Ve : 15, B+Ve : 16" -> [["A+Ve", 15], ["B+Ve", 16]]
 *
 * Splits on the last colon so an unexpected label containing a colon does not
 * break the quantity. Unparseable quantities become 0 rather than NaN.
 */
export function parseQtyPairs(raw: string | null | undefined): Array<[string, number]> {
  if (!raw) return [];
  const out: Array<[string, number]> = [];

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const at = trimmed.lastIndexOf(":");
    if (at === -1) {
      const label = trimmed.trim();
      if (label) out.push([label, 0]);
      continue;
    }

    const label = trimmed.slice(0, at).trim();
    const value = Number.parseInt(trimmed.slice(at + 1).trim(), 10);
    if (!label) continue;
    out.push([label, Number.isFinite(value) && value > 0 ? value : 0]);
  }

  return out;
}

/**
 * Provider timestamps are IST without an offset ("2026-10-29 08:06:52").
 * Parsing them as local time is the classic bug this guards against.
 */
export function parseIstTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, mo, d, h, mi, s] = match;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+05:30`);
}

export function deriveDataMode(offline: string | number | null | undefined): DataMode {
  return String(offline) === "0" ? "live" : "snapshot";
}

export function normalizeReport(record: RawAvailabilityRecord): NormalizedReport {
  const warnings: string[] = [];
  const cells: NormalizedCell[] = [];
  const seen = new Set<string>();

  const components = record.components ?? {};
  for (const [rawName, entry] of Object.entries(components)) {
    if (normalizeName(rawName) === "unknown") continue;

    const component = COMPONENT_BY_PROVIDER_NAME.get(normalizeName(rawName));
    if (!component) {
      warnings.push(`Unknown component "${rawName}"`);
      continue;
    }

    // Explicitly available groups win over the nil list.
    for (const [rawGroup, units] of parseQtyPairs(entry.available_WithQty)) {
      const groupCode = resolveGroupCode(rawGroup);
      if (!groupCode) {
        warnings.push(`Unknown blood group "${rawGroup}" in ${rawName}`);
        continue;
      }
      const key = `${component.code}|${groupCode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({
        componentCode: component.code,
        componentName: component.name,
        groupCode,
        units,
        reportedState: units > 0 ? "available" : "nil",
      });
    }

    for (const [rawGroup] of parseQtyPairs(entry.not_available_WithQty)) {
      const groupCode = resolveGroupCode(rawGroup);
      if (!groupCode) {
        warnings.push(`Unknown blood group "${rawGroup}" in ${rawName}`);
        continue;
      }
      const key = `${component.code}|${groupCode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({
        componentCode: component.code,
        componentName: component.name,
        groupCode,
        units: 0,
        reportedState: "nil",
      });
    }
  }

  cells.sort(
    (a, b) => a.componentCode.localeCompare(b.componentCode) || a.groupCode.localeCompare(b.groupCode)
  );

  const componentCount = new Set(cells.map((c) => c.componentCode)).size;
  const totalUnits = cells.reduce((sum, c) => sum + c.units, 0);

  return {
    dataMode: deriveDataMode(record.offline),
    sourceEntryRaw: record.entrydate ?? null,
    sourceEntryAt: parseIstTimestamp(record.entrydate),
    cells,
    totalUnits,
    componentCount,
    contentHash: hashReport(record.entrydate ?? null, deriveDataMode(record.offline), cells),
    warnings,
  };
}

/**
 * Hash covers the centre's entry time, the data mode and every cell. A centre
 * that re-submits identical stock with a new entry time is a genuinely new
 * report and should create a snapshot.
 */
export function hashReport(
  sourceEntryRaw: string | null,
  dataMode: DataMode,
  cells: NormalizedCell[]
): string {
  const canonical = JSON.stringify({
    e: sourceEntryRaw,
    m: dataMode,
    c: cells
      .slice()
      .sort(
        (a, b) =>
          a.componentCode.localeCompare(b.componentCode) || a.groupCode.localeCompare(b.groupCode)
      )
      .map((c) => [c.componentCode, c.groupCode, c.units, c.reportedState]),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Every component is present in the API response, even when not reported. */
export const ALL_COMPONENT_CODES = BLOOD_COMPONENTS.map((c) => c.code);
