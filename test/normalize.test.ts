import { describe, expect, it } from "vitest";
import {
  parseIstTimestamp,
  parseQtyPairs,
  normalizeReport,
} from "../src/provider/normalize";
import type { RawAvailabilityRecord } from "../src/provider/schema";

const record: RawAvailabilityRecord = {
  hospitalname: "Test Blood Centre",
  hospitalCode: "1",
  entrydate: "2026-10-29 08:06:52",
  offline: "1",
  components: {
    "Whole Blood": {
      available_WithQty: "A+Ve : 15, B+Ve : 16",
      not_available_WithQty: "O+Ve : 0, O-Ve : 0",
    },
    Unknown: { available_WithQty: "A+Ve : 99" },
    "Made Up Component": { available_WithQty: "A+Ve : 5" },
  },
};

describe("parseQtyPairs", () => {
  it("parses group and quantity pairs", () => {
    expect(parseQtyPairs("A+Ve : 15, B+Ve : 16")).toEqual([
      ["A+Ve", 15],
      ["B+Ve", 16],
    ]);
  });

  it("treats missing or invalid quantities as zero", () => {
    expect(parseQtyPairs("A+Ve : , B+Ve : nope, O+Ve : -3")).toEqual([
      ["A+Ve", 0],
      ["B+Ve", 0],
      ["O+Ve", 0],
    ]);
  });

  it("returns nothing for empty input", () => {
    expect(parseQtyPairs("")).toEqual([]);
    expect(parseQtyPairs(null)).toEqual([]);
  });
});

describe("parseIstTimestamp", () => {
  it("interprets provider timestamps as Asia/Kolkata", () => {
    expect(parseIstTimestamp("2026-10-29 08:06:52")?.toISOString()).toBe(
      "2026-10-29T02:36:52.000Z"
    );
  });

  it("handles the IST midnight boundary", () => {
    expect(parseIstTimestamp("2026-10-29 00:30:00")?.toISOString()).toBe(
      "2026-10-28T19:00:00.000Z"
    );
  });

  it("returns null for empty input", () => {
    expect(parseIstTimestamp(null)).toBeNull();
  });
});

describe("normalizeReport", () => {
  it("maps groups and components, skipping Unknown", () => {
    const report = normalizeReport(record);
    const key = (c: string, g: string) => `${c}|${g}`;
    const cells = new Map(report.cells.map((c) => [key(c.componentCode, c.groupCode), c]));

    expect(cells.get(key("whole_blood", "A+"))).toMatchObject({
      units: 15,
      reportedState: "available",
    });
    expect(cells.get(key("whole_blood", "B+"))).toMatchObject({
      units: 16,
      reportedState: "available",
    });
    expect(cells.get(key("whole_blood", "O+"))).toMatchObject({
      units: 0,
      reportedState: "nil",
    });
    expect(cells.has(key("whole_blood", "AB+"))).toBe(false);
    expect(report.componentCount).toBe(1);
    expect(report.totalUnits).toBe(31);
  });

  it("records a warning for an unmapped component", () => {
    const report = normalizeReport(record);
    expect(report.warnings.some((w) => w.includes("Made Up Component"))).toBe(true);
  });

  it("uses the offline flag to derive data mode", () => {
    expect(normalizeReport(record).dataMode).toBe("snapshot");
    expect(normalizeReport({ ...record, offline: "0" }).dataMode).toBe("live");
  });

  it("produces a stable hash and changes it with the entry time", () => {
    const a = normalizeReport(record);
    const b = normalizeReport(record);
    expect(a.contentHash).toBe(b.contentHash);

    const later = normalizeReport({ ...record, entrydate: "2026-10-30 09:00:00" });
    expect(later.contentHash).not.toBe(a.contentHash);
  });

  it("accepts a missing entry date without inventing one", () => {
    const report = normalizeReport({ ...record, entrydate: undefined });
    expect(report.sourceEntryAt).toBeNull();
    expect(report.sourceEntryRaw).toBeNull();
  });
});
