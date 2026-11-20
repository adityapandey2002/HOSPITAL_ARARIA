import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOOD_COMPONENTS, BLOOD_GROUPS } from "../src/domain/catalog";

const read = (name: string) => readFileSync(new URL(`../web/${name}`, import.meta.url), "utf8");

/** The page ships two copies of the sample snapshot; drift is a bug. */
function embeddedSample(): unknown {
  const match = /const EMBEDDED_SAMPLE = (\{.*\});?$/m.exec(read("app.js"));
  if (!match) throw new Error("EMBEDDED_SAMPLE not found in web/app.js");
  return JSON.parse(match[1]!);
}

describe("web sample snapshot", () => {
  it("keeps the embedded fallback identical to sample-data.json", () => {
    const file = JSON.parse(read("sample-data.json"));
    expect(embeddedSample()).toEqual(file);
  });

  it("uses only component codes the API can actually emit", () => {
    const known = new Set(BLOOD_COMPONENTS.map((component) => component.code));
    const groups = new Set(BLOOD_GROUPS.map((group) => group.code));
    const data = JSON.parse(read("sample-data.json"));

    for (const center of data.centers) {
      for (const group of center.groups) {
        expect(groups.has(group.code)).toBe(true);
        expect(group.components).toHaveLength(BLOOD_COMPONENTS.length);
        for (const component of group.components) {
          expect(known.has(component.code)).toBe(true);
          if (component.status === "not_reported") expect(component.units).toBeNull();
        }
      }
    }
  });

  it("never claims units for a centre that has no report", () => {
    const data = JSON.parse(read("sample-data.json"));
    for (const center of data.centers) {
      if (center.reportStatus === "no_report") {
        expect(center.totalUnits).toBeNull();
        expect(center.groups).toEqual([]);
      }
    }
  });
});
