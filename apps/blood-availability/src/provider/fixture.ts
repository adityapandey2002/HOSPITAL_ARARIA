import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { BloodSource } from "./eraktkosh";
import {
  parseAvailability,
  parseCenters,
  type RawAvailabilityRecord,
  type RawCenter,
} from "./schema";

const DEFAULT_DIR = fileURLToPath(new URL("../../test/fixtures/", import.meta.url));

/**
 * Recorded provider responses, used by the demo server and tests.
 * Never calls the network.
 */
export class FixtureSource implements BloodSource {
  constructor(private readonly directory: string = DEFAULT_DIR) {}

  async listCenters(): Promise<RawCenter[]> {
    const raw = JSON.parse(await readFile(path.join(this.directory, "centers.json"), "utf8"));
    return parseCenters(raw);
  }

  async fetchAvailability(hospitalCodes?: string[]): Promise<RawAvailabilityRecord[]> {
    const raw = JSON.parse(await readFile(path.join(this.directory, "availability.json"), "utf8"));
    const all = parseAvailability(raw);
    if (!hospitalCodes?.length) return all;
    return all.filter((record) => hospitalCodes.includes(record.hospitalCode));
  }
}
