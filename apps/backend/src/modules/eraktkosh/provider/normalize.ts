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

export interface QtyPair {
  label: string;
  units: number;
}

/**
 * "A+Ve : 15, B+Ve : 16" -> pairs, with anything unparseable collected
 * separately. A quantity we cannot read is *not* a reported zero: the centre
 * said something we failed to understand, so the cell must stay
 * "not reported" and the caller must warn.
 *
 * Splits on the last colon so an unexpected label containing a colon does not
 * break the quantity.
 */
export function parseQtyPairsDetailed(raw: string | null | undefined): {
  pairs: QtyPair[];
  rejected: string[];
} {
  const pairs: QtyPair[] = [];
  const rejected: string[] = [];
  if (!raw) return { pairs, rejected };

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const at = trimmed.lastIndexOf(":");
    const label = at === -1 ? trimmed : trimmed.slice(0, at).trim();
    const text = at === -1 ? "" : trimmed.slice(at + 1).trim();
    const value = Number.parseInt(text, 10);

    if (at === -1 || !label || !/^\d+$/.test(text) || !Number.isFinite(value)) {
      rejected.push(trimmed);
      continue;
    }

    pairs.push({ label, units: value });
  }

  return { pairs, rejected };
}

/** Tuple form kept for readability at call sites and tests. */
export function parseQtyPairs(raw: string | null | undefined): Array<[string, number]> {
  return parseQtyPairsDetailed(raw).pairs.map((pair) => [pair.label, pair.units]);
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
    const available = parseQtyPairsDetailed(entry.available_WithQty);
    for (const rejected of available.rejected) {
      warnings.push(`Unreadable quantity "${rejected}" in ${rawName}`);
    }
    for (const { label, units } of available.pairs) {
      const groupCode = resolveGroupCode(label);
      if (!groupCode) {
        warnings.push(`Unknown blood group "${label}" in ${rawName}`);
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

    const notAvailable = parseQtyPairsDetailed(entry.not_available_WithQty);
    for (const rejected of notAvailable.rejected) {
      warnings.push(`Unreadable quantity "${rejected}" in ${rawName}`);
    }
    for (const { label } of notAvailable.pairs) {
      const groupCode = resolveGroupCode(label);
      if (!groupCode) {
        warnings.push(`Unknown blood group "${label}" in ${rawName}`);
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

