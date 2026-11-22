/** Runtime configuration. Everything has a safe Araria default. */

export const CONFIG = {
  providerBaseUrl:
    process.env.PROVIDER_BASE_URL ?? "https://eraktkosh.mohfw.gov.in/eraktkoshPortal",

  stateCode: process.env.STATE_CODE ?? "10",
  stateName: process.env.STATE_NAME ?? "Bihar",
  districtId: process.env.DISTRICT_ID ?? "209",
  districtName: process.env.DISTRICT_NAME ?? "Araria",

  /** Every 4 hours. */
  syncIntervalMinutes: Number(process.env.SYNC_INTERVAL_MINUTES ?? 240),
  retentionDays: Number(process.env.RETENTION_DAYS ?? 30),

  /** Freshness thresholds used by the API. */
  freshMinutes: Number(process.env.FRESH_MINUTES ?? 360),
  agingMinutes: Number(process.env.AGING_MINUTES ?? 1440),

  /** Shared secret for POST /api/blood/sync. Empty means the route is disabled. */
  adminToken: process.env.ADMIN_TOKEN ?? "",

  databaseUrl: process.env.DATABASE_URL ?? "",
} as const;

export type Config = typeof CONFIG;
