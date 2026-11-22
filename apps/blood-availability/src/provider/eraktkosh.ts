import { CONFIG } from "../config";
import {
  parseAvailability,
  parseCenters,
  type RawAvailabilityRecord,
  type RawCenter,
} from "./schema";

/** The sync worker depends on this, never on the concrete provider. */
export interface BloodSource {
  listCenters(): Promise<RawCenter[]>;
  fetchAvailability(hospitalCodes?: string[]): Promise<RawAvailabilityRecord[]>;
}

export class ProviderHttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`Provider responded ${status} for ${url}`);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url: string, attempts = 3): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json, text/plain, */*",
          "user-agent":
            "Mozilla/5.0 (compatible; BloodAvailabilitySync/1.0; +https://example.org/contact)",
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new ProviderHttpError(response.status, url);
      }

      // A provider error page can still return 200; parsing catches that.
      return await response.json();
    } catch (error) {
      lastError = error;
      const status = error instanceof ProviderHttpError ? error.status : 0;
      const retryable = status === 0 || RETRYABLE.has(status);
      if (!retryable || attempt === attempts) break;
      await sleep(1000 * 4 ** (attempt - 1) + Math.floor(Math.random() * 250));
    }
  }

  throw lastError;
}

/**
 * Live e-RaktKosh source. Only this file knows the provider's URLs and shapes.
 */
export class EraktkoshSource implements BloodSource {
  constructor(
    private readonly baseUrl: string = CONFIG.providerBaseUrl,
    private readonly stateCode: string = CONFIG.stateCode,
    private readonly districtId: string = CONFIG.districtId
  ) {}

  async listCenters(): Promise<RawCenter[]> {
    const url =
      `${this.baseUrl}/eraktkosh/bloodbanks` +
      `?stateCode=${encodeURIComponent(this.stateCode)}` +
      `&districtCode=${encodeURIComponent(this.districtId)}`;
    return parseCenters(await fetchJson(url));
  }

  async fetchAvailability(hospitalCodes?: string[]): Promise<RawAvailabilityRecord[]> {
    const params = new URLSearchParams({
      stateCode: this.stateCode,
      districtId: this.districtId,
    });
    if (hospitalCodes?.length) params.set("hospitalCodes", hospitalCodes.join(","));

    const url = `${this.baseUrl}/eraktkosh/blood-availability?${params.toString()}`;
    return parseAvailability(await fetchJson(url));
  }
}
