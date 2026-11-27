import type {
  EraktkoshCell,
  EraktkoshCenter,
  EraktkoshDistrictData,
  EraktkoshGroup,
} from './blood-availability';

const DEFAULT_PROVIDER_BASE_URL = 'https://eraktkosh.mohfw.gov.in/eraktkoshPortal';
const STATE_CODE = '10';
const STATE_NAME = 'Bihar';
const DISTRICT_ID = '209';
const DISTRICT_NAME = 'Araria';

export const LIVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const REFRESH_COOLDOWN_MS = 15 * 1000; // 15 seconds

export interface RawEraktkoshCenter {
  hospitalCode: string | number;
  hospitalName: string;
  mobileNo?: string | number | null;
}

export interface RawEraktkoshAvailabilityRecord {
  hospitalname: string;
  hospitaladd?: string | null;
  hospitalcontact?: string | null;
  hospitalCode: string | number;
  hospitalType?: string | null;
  entrydate?: string | null;
  offline?: string | number | null;
  components?: Record<
    string,
    {
      available_WithQty?: string | null;
      not_available_WithQty?: string | null;
    }
  > | null;
}

export const ARARIA_REGISTERED_CENTRES: ReadonlyArray<{ code: string; name: string }> = [
  { code: '284908', name: 'Ms Lions Blood Centre Forbesganj Araria' },
  { code: '10140', name: 'Sadar Hospital Araria' },
  { code: '284905', name: 'Ms Lions Blood Centre' },
];

interface CatalogGroup {
  code: string;
  label: string;
  providerName: string;
}

interface CatalogComponent {
  code: string;
  name: string;
  shortName: string;
  providerName: string;
}

const BLOOD_GROUPS: readonly CatalogGroup[] = [
  { code: 'A+', label: 'A+', providerName: 'A+Ve' },
  { code: 'A-', label: 'A−', providerName: 'A-Ve' },
  { code: 'B+', label: 'B+', providerName: 'B+Ve' },
  { code: 'B-', label: 'B−', providerName: 'B-Ve' },
  { code: 'O+', label: 'O+', providerName: 'O+Ve' },
  { code: 'O-', label: 'O−', providerName: 'O-Ve' },
  { code: 'AB+', label: 'AB+', providerName: 'AB+Ve' },
  { code: 'AB-', label: 'AB−', providerName: 'AB-Ve' },
  { code: 'Oh+', label: 'Oh+', providerName: 'Oh+VE' },
  { code: 'Oh-', label: 'Oh−', providerName: 'Oh-VE' },
];

const BLOOD_COMPONENTS: readonly CatalogComponent[] = [
  { code: 'whole_blood', name: 'Whole Blood', shortName: 'WB', providerName: 'Whole Blood' },
  {
    code: 'packed_red_blood_cells',
    name: 'Packed Red Blood Cells',
    shortName: 'PRBC',
    providerName: 'Packed Red Blood Cells',
  },
  {
    code: 'fresh_frozen_plasma',
    name: 'Fresh Frozen Plasma',
    shortName: 'FFP',
    providerName: 'Fresh Frozen Plasma',
  },
  {
    code: 'random_donor_platelets',
    name: 'Random Donor Platelets',
    shortName: 'RPLA',
    providerName: 'Random Donor Platelets',
  },
  {
    code: 'single_donor_platelet',
    name: 'Single Donor Platelet',
    shortName: 'PLA',
    providerName: 'Single Donor Platelet',
  },
  {
    code: 'platelet_concentrate',
    name: 'Platelet Concentrate',
    shortName: 'PC',
    providerName: 'Platelet Concentrate',
  },
  {
    code: 'platelet_rich_plasma',
    name: 'Platelet Rich Plasma',
    shortName: 'PRP',
    providerName: 'Platelet Rich Plasma',
  },
  {
    code: 'cryoprecipitate',
    name: 'Cryoprecipitate',
    shortName: 'CRYO',
    providerName: 'Cryoprecipitate',
  },
  {
    code: 'cryo_poor_plasma',
    name: 'Cryo Poor Plasma',
    shortName: 'CPP',
    providerName: 'Cryo Poor Plasma',
  },
  { code: 'plasma', name: 'Plasma', shortName: 'PLS', providerName: 'Plasma' },
  {
    code: 'single_donor_plasma',
    name: 'Single Donor Plasma',
    shortName: 'SDP',
    providerName: 'Single Donor Plasma',
  },
  {
    code: 'irradiated_rbc',
    name: 'Irradiated RBC',
    shortName: 'IRBC',
    providerName: 'Irradiated RBC',
  },
  {
    code: 'leukoreduced_rbc',
    name: 'Leukoreduced RBC',
    shortName: 'LRBC',
    providerName: 'Leukoreduced Rbc',
  },
  {
    code: 'sagm_packed_red_blood_cells',
    name: 'SAGM Packed Red Blood Cells',
    shortName: 'SPRBC',
    providerName: 'Sagm Packed Red Blood Cells',
  },
];

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

const GROUP_BY_PROVIDER_NAME = new Map<string, CatalogGroup>(
  BLOOD_GROUPS.map((g) => [normalizeName(g.providerName), g])
);

const COMPONENT_BY_PROVIDER_NAME = new Map<string, CatalogComponent>(
  BLOOD_COMPONENTS.map((c) => [normalizeName(c.providerName), c])
);

export function resolveProviderGroupCode(raw: string): string | null {
  const direct = GROUP_BY_PROVIDER_NAME.get(normalizeName(raw));
  if (direct) return direct.code;

  const compact = raw.replace(/\s+/g, '');
  const oh = /^Oh([+-])(?:ve)?$/i.exec(compact);
  if (oh?.[1]) return `Oh${oh[1]}`;

  const abo = /^(A|B|O|AB)([+-])(?:ve)?$/i.exec(compact);
  if (abo?.[1] && abo[2]) return `${abo[1].toUpperCase()}${abo[2]}`;

  return null;
}

export function parseProviderQtyPairs(
  raw: string | null | undefined
): Array<{ label: string; units: number }> {
  const pairs: Array<{ label: string; units: number }> = [];
  if (!raw) return pairs;

  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const at = trimmed.lastIndexOf(':');
    if (at === -1) continue;
    const label = trimmed.slice(0, at).trim();
    const text = trimmed.slice(at + 1).trim();
    if (!label || !/^\d+$/.test(text)) continue;
    const units = Number.parseInt(text, 10);
    if (!Number.isFinite(units)) continue;
    pairs.push({ label, units });
  }

  return pairs;
}

export function parseIstEntryTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(trimmed);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+05:30`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

export function extractIndianPhone(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text || text === '0') return null;
  const match = /(?:\+?91[\s-]?)?([6-9]\d{9})/.exec(text.replace(/[^\d+\s-]/g, ' '));
  return match?.[1] ?? null;
}

export function computeFreshness(
  asOfIso: string | null,
  now: Date = new Date()
): 'fresh' | 'aging' | 'stale' | 'none' {
  if (!asOfIso) return 'none';
  const minutes = (now.getTime() - new Date(asOfIso).getTime()) / 60_000;
  if (!Number.isFinite(minutes)) return 'none';
  if (minutes <= 360) return 'fresh';
  if (minutes <= 1440) return 'aging';
  return 'stale';
}

/**
 * Pure transformation: turns raw e-RaktKosh `/bloodbanks` and `/blood-availability`
 * payloads into the normalized Araria district read model used by the frontend.
 */
export function buildLiveArariaAvailability(
  banksInput: RawEraktkoshCenter[],
  availabilityInput: RawEraktkoshAvailabilityRecord[],
  now: Date = new Date()
): EraktkoshDistrictData {
  const fetchedAtIso = now.toISOString();
  const bankMap = new Map<string, { code: string; name: string; mobileNo: string | number | null }>();

  for (const bank of banksInput) {
    const code = String(bank.hospitalCode).trim();
    if (!code) continue;
    bankMap.set(code, {
      code,
      name: bank.hospitalName.trim(),
      mobileNo: bank.mobileNo ?? null,
    });
  }

  for (const registered of ARARIA_REGISTERED_CENTRES) {
    if (!bankMap.has(registered.code)) {
      bankMap.set(registered.code, {
        code: registered.code,
        name: registered.name,
        mobileNo: null,
      });
    }
  }

  const recordByCode = new Map<string, RawEraktkoshAvailabilityRecord>();
  for (const record of availabilityInput) {
    const code = String(record.hospitalCode).trim();
    if (!code) continue;
    recordByCode.set(code, record);
    if (!bankMap.has(code)) {
      bankMap.set(code, {
        code,
        name: record.hospitalname.trim(),
        mobileNo: null,
      });
    }
  }

  const centers: EraktkoshCenter[] = [];
  let newestSourceMs: number | null = null;

  for (const bank of bankMap.values()) {
    const record = recordByCode.get(bank.code);
    const name = record?.hospitalname?.trim() || bank.name;
    const category = record?.hospitalType?.trim() || null;
    const address = record?.hospitaladd?.trim() || null;
    const phone = extractIndianPhone(record?.hospitalcontact) ?? extractIndianPhone(bank.mobileNo);
    const hasReport = Boolean(record?.components && Object.keys(record.components).length > 0);

    if (!record || !hasReport) {
      centers.push({
        id: bank.code,
        name,
        category,
        address,
        phone,
        reportStatus: 'no_report',
        dataMode: null,
        sourceEntryAt: null,
        fetchedAt: fetchedAtIso,
        totalUnits: null,
        groupsWithStock: [],
        groups: [],
      });
      continue;
    }

    const sourceEntryAt = parseIstEntryTimestamp(record.entrydate);
    if (sourceEntryAt) {
      const ms = new Date(sourceEntryAt).getTime();
      if (newestSourceMs === null || ms > newestSourceMs) {
        newestSourceMs = ms;
      }
    }

    const cellsByGroup = new Map<string, Map<string, number>>();
    const seenKeys = new Set<string>();

    for (const [rawCompName, entry] of Object.entries(record.components ?? {})) {
      if (normalizeName(rawCompName) === 'unknown') continue;
      const component = COMPONENT_BY_PROVIDER_NAME.get(normalizeName(rawCompName));
      if (!component) continue;

      for (const { label, units } of parseProviderQtyPairs(entry?.available_WithQty)) {
        const groupCode = resolveProviderGroupCode(label);
        if (!groupCode) continue;
        const key = `${component.code}|${groupCode}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        let groupMap = cellsByGroup.get(groupCode);
        if (!groupMap) {
          groupMap = new Map();
          cellsByGroup.set(groupCode, groupMap);
        }
        groupMap.set(component.code, units);
      }

      for (const { label } of parseProviderQtyPairs(entry?.not_available_WithQty)) {
        const groupCode = resolveProviderGroupCode(label);
        if (!groupCode) continue;
        const key = `${component.code}|${groupCode}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        let groupMap = cellsByGroup.get(groupCode);
        if (!groupMap) {
          groupMap = new Map();
          cellsByGroup.set(groupCode, groupMap);
        }
        groupMap.set(component.code, 0);
      }
    }

    const groups: EraktkoshGroup[] = BLOOD_GROUPS.filter((group) => cellsByGroup.has(group.code)).map(
      (group) => {
        const groupCells = cellsByGroup.get(group.code)!;
        const components: EraktkoshCell[] = BLOOD_COMPONENTS.map((comp) => {
          const units = groupCells.get(comp.code);
          if (units === undefined) {
            return {
              code: comp.code,
              name: comp.name,
              shortName: comp.shortName,
              units: null,
              status: 'not_reported',
            };
          }
          return {
            code: comp.code,
            name: comp.name,
            shortName: comp.shortName,
            units,
            status: units > 0 ? 'in_stock' : 'nil',
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

    const centerTotal = groups.reduce((sum, g) => sum + g.totalUnits, 0);
    const groupsWithStock = groups.filter((g) => g.hasStock).map((g) => g.code);

    centers.push({
      id: bank.code,
      name,
      category,
      address,
      phone,
      reportStatus: 'reporting',
      dataMode: String(record.offline) === '0' ? 'live' : 'snapshot',
      sourceEntryAt,
      fetchedAt: fetchedAtIso,
      totalUnits: centerTotal,
      groupsWithStock,
      groups,
    });
  }

  // Reporting centres first, then alphabetical
  centers.sort((a, b) => {
    if (a.reportStatus !== b.reportStatus) {
      return a.reportStatus === 'reporting' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const reportingCenters = centers.filter((c) => c.reportStatus === 'reporting');
  const allStockGroups = new Set<string>();
  for (const center of reportingCenters) {
    for (const g of center.groupsWithStock) allStockGroups.add(g);
  }

  const totalUnits =
    reportingCenters.length > 0
      ? reportingCenters.reduce((sum, c) => sum + (c.totalUnits ?? 0), 0)
      : null;

  return {
    district: { name: DISTRICT_NAME, state: STATE_NAME },
    asOf: fetchedAtIso,
    sourceAsOf: newestSourceMs !== null ? new Date(newestSourceMs).toISOString() : null,
    freshness: computeFreshness(fetchedAtIso, now),
    counts: {
      centersListed: centers.length,
      centersReporting: reportingCenters.length,
      centersNoReport: centers.length - reportingCenters.length,
      totalUnits,
      groupsWithStock: allStockGroups.size,
    },
    centers,
  };
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0 (compatible; DHArariaBloodAvailability/1.0)',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`e-RaktKosh responded with HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

interface CacheState {
  data: EraktkoshDistrictData;
  fetchedAtMs: number;
}

let cachedSnapshot: CacheState | null = null;
let inFlightFetch: Promise<EraktkoshDistrictData> | null = null;

/**
 * Fetches live blood availability for Araria district directly from the official
 * MoHFW e-RaktKosh public API, with short TTL caching, refresh cooldown, and
 * in-flight request deduplication.
 */
export async function fetchLiveArariaAvailability(
  options: { forceRefresh?: boolean } = {}
): Promise<EraktkoshDistrictData> {
  const nowMs = Date.now();
  const forceRefresh = Boolean(options.forceRefresh);

  if (cachedSnapshot) {
    const ageMs = nowMs - cachedSnapshot.fetchedAtMs;
    if (!forceRefresh && ageMs < LIVE_CACHE_TTL_MS) {
      return cachedSnapshot.data;
    }
    if (forceRefresh && ageMs < REFRESH_COOLDOWN_MS) {
      return cachedSnapshot.data;
    }
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  const baseUrl = DEFAULT_PROVIDER_BASE_URL;

  inFlightFetch = (async () => {
    try {
      const banksUrl = `${baseUrl}/eraktkosh/bloodbanks?stateCode=${STATE_CODE}&districtCode=${DISTRICT_ID}`;
      const availUrl = `${baseUrl}/eraktkosh/blood-availability?stateCode=${STATE_CODE}&districtId=${DISTRICT_ID}`;

      const [banksRaw, availRaw] = await Promise.all([
        fetchJsonWithTimeout<RawEraktkoshCenter[]>(banksUrl),
        fetchJsonWithTimeout<RawEraktkoshAvailabilityRecord[]>(availUrl),
      ]);

      const banks = Array.isArray(banksRaw) ? banksRaw : [];
      const availability = Array.isArray(availRaw) ? [...availRaw] : [];

      // Explicitly probe any registered Araria centre absent from the district feed
      const seenCodes = new Set(availability.map((r) => String(r.hospitalCode)));
      const missingCodes = ARARIA_REGISTERED_CENTRES.map((c) => c.code).filter(
        (code) => !seenCodes.has(code)
      );

      if (missingCodes.length > 0) {
        const extraResults = await Promise.allSettled(
          missingCodes.map((code) =>
            fetchJsonWithTimeout<RawEraktkoshAvailabilityRecord[]>(
              `${baseUrl}/eraktkosh/blood-availability?stateCode=${STATE_CODE}&districtId=${DISTRICT_ID}&hospitalCodes=${encodeURIComponent(code)}`,
              8_000
            )
          )
        );
        for (const result of extraResults) {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            for (const record of result.value) {
              if (record && !seenCodes.has(String(record.hospitalCode))) {
                availability.push(record);
                seenCodes.add(String(record.hospitalCode));
              }
            }
          }
        }
      }

      const data = buildLiveArariaAvailability(banks, availability, new Date());
      cachedSnapshot = { data, fetchedAtMs: Date.now() };
      return data;
    } catch (error) {
      // Return last known good snapshot instead of blanking the UI during transient outages
      if (cachedSnapshot) {
        return {
          ...cachedSnapshot.data,
          freshness: computeFreshness(cachedSnapshot.data.asOf, new Date()),
        };
      }
      throw error;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}
