import {
  BLOOD_COMPONENT_LABELS,
  BLOOD_GROUP_LABELS,
  BloodComponentType,
  BloodGroup,
} from '@dh-araria/shared/types';

export const ALL_FILTER = 'All';
export const HOSPITAL_FACILITY_ID = 'dh-araria-hospital';
export const HOSPITAL_FACILITY_NAME = 'District Hospital Araria (Blood Bank)';

export const LOW_STOCK_THRESHOLD = 20;
export const CRITICAL_STOCK_THRESHOLD = 10;

export type StockStatus = 'available' | 'low' | 'critical';

export interface LocalBloodStockItem {
  id: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsAvailable: number;
  lastUpdated: string;
}

export interface EraktkoshCell {
  code: string;
  name: string;
  shortName: string;
  units: number | null;
  status: 'in_stock' | 'nil' | 'not_reported';
}

export interface EraktkoshGroup {
  code: string;
  label: string;
  totalUnits: number;
  hasStock: boolean;
  components: EraktkoshCell[];
}

export interface EraktkoshCenter {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  reportStatus: 'reporting' | 'no_report';
  dataMode: 'live' | 'snapshot' | null;
  sourceEntryAt: string | null;
  fetchedAt: string | null;
  totalUnits: number | null;
  groupsWithStock: string[];
  groups: EraktkoshGroup[];
}

export interface EraktkoshDistrictData {
  district: { name: string; state: string };
  asOf: string | null;
  sourceAsOf: string | null;
  freshness: string;
  counts: {
    centersListed: number;
    centersReporting: number;
    centersNoReport: number;
    totalUnits: number | null;
    groupsWithStock: number;
  };
  centers: EraktkoshCenter[];
}

export interface BloodFacilityOption {
  id: string;
  name: string;
  source: 'hospital' | 'eraktkosh';
  category: string | null;
  reportStatus: 'reporting' | 'no_report';
  totalUnits: number | null;
}

export interface UnifiedBloodStockRow {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCategory: string | null;
  facilityPhone: string | null;
  source: 'hospital' | 'eraktkosh';
  bloodGroup: BloodGroup;
  groupLabel: string;
  componentType: BloodComponentType;
  componentLabel: string;
  unitsAvailable: number;
  status: StockStatus;
  lastUpdated: string | null;
}

export interface BloodGroupSummaryCard {
  group: BloodGroup;
  label: string;
  totalUnits: number;
  status: StockStatus;
  count: number;
  facilityCount: number;
}

export interface BloodStockFilters {
  facilityId: string;
  bloodGroup: string;
  componentType: string;
  searchQuery: string;
}

export function statusForUnits(units: number): StockStatus {
  if (units <= CRITICAL_STOCK_THRESHOLD) return 'critical';
  if (units <= LOW_STOCK_THRESHOLD) return 'low';
  return 'available';
}

const ERAKTKOSH_GROUP_MAP: Record<string, BloodGroup> = {
  'A+': BloodGroup.A_POSITIVE,
  'A-': BloodGroup.A_NEGATIVE,
  'A−': BloodGroup.A_NEGATIVE,
  'B+': BloodGroup.B_POSITIVE,
  'B-': BloodGroup.B_NEGATIVE,
  'B−': BloodGroup.B_NEGATIVE,
  'AB+': BloodGroup.AB_POSITIVE,
  'AB-': BloodGroup.AB_NEGATIVE,
  'AB−': BloodGroup.AB_NEGATIVE,
  'O+': BloodGroup.O_POSITIVE,
  'O-': BloodGroup.O_NEGATIVE,
  'O−': BloodGroup.O_NEGATIVE,
};

export function mapEraktkoshGroup(code: string): BloodGroup | null {
  const normalized = code.trim().replace(/\s+/g, '');
  return ERAKTKOSH_GROUP_MAP[normalized] ?? null;
}

const ERAKTKOSH_COMPONENT_MAP: Record<string, BloodComponentType> = {
  whole_blood: BloodComponentType.WHOLE_BLOOD,
  packed_red_blood_cells: BloodComponentType.PACKED_RED_CELLS,
  irradiated_rbc: BloodComponentType.PACKED_RED_CELLS,
  leukoreduced_rbc: BloodComponentType.PACKED_RED_CELLS,
  sagm_packed_red_blood_cells: BloodComponentType.PACKED_RED_CELLS,
  random_donor_platelets: BloodComponentType.PLATELETS,
  single_donor_platelet: BloodComponentType.PLATELETS,
  platelet_concentrate: BloodComponentType.PLATELETS,
  platelet_rich_plasma: BloodComponentType.PLATELETS,
  fresh_frozen_plasma: BloodComponentType.PLASMA,
  cryo_poor_plasma: BloodComponentType.PLASMA,
  plasma: BloodComponentType.PLASMA,
  single_donor_plasma: BloodComponentType.PLASMA,
  cryoprecipitate: BloodComponentType.CRYOPRECIPITATE,
};

export function mapEraktkoshComponent(code: string): BloodComponentType {
  return ERAKTKOSH_COMPONENT_MAP[code.trim().toLowerCase()] ?? BloodComponentType.WHOLE_BLOOD;
}

export function eraktkoshFacilityId(centerId: string): string {
  return `ek:${centerId}`;
}

/**
 * Merges District Hospital Araria blood bank rows and e-RaktKosh Araria
 * district facilities into one unified stock table and facility filter list.
 */
export function buildUnifiedBloodData(
  localStock: LocalBloodStockItem[],
  districtData: EraktkoshDistrictData | null
): {
  facilities: BloodFacilityOption[];
  rows: UnifiedBloodStockRow[];
} {
  const facilities: BloodFacilityOption[] = [];
  const rows: UnifiedBloodStockRow[] = [];

  if (localStock.length > 0) {
    const localTotal = localStock.reduce((sum, item) => sum + item.unitsAvailable, 0);
    facilities.push({
      id: HOSPITAL_FACILITY_ID,
      name: HOSPITAL_FACILITY_NAME,
      source: 'hospital',
      category: 'Government Hospital',
      reportStatus: 'reporting',
      totalUnits: localTotal,
    });

    for (const item of localStock) {
      const normalizedGroup = mapEraktkoshGroup(String(item.bloodGroup)) ?? item.bloodGroup;
      rows.push({
        id: `local:${item.id}`,
        facilityId: HOSPITAL_FACILITY_ID,
        facilityName: HOSPITAL_FACILITY_NAME,
        facilityCategory: 'Government Hospital',
        facilityPhone: '+91-6453-222102',
        source: 'hospital',
        bloodGroup: normalizedGroup,
        groupLabel: BLOOD_GROUP_LABELS[normalizedGroup] ?? String(item.bloodGroup),
        componentType: item.componentType,
        componentLabel: BLOOD_COMPONENT_LABELS[item.componentType] ?? item.componentType,
        unitsAvailable: item.unitsAvailable,
        status: statusForUnits(item.unitsAvailable),
        lastUpdated: item.lastUpdated,
      });
    }
  }

  if (districtData?.centers) {
    for (const center of districtData.centers) {
      const facilityId = eraktkoshFacilityId(center.id);
      facilities.push({
        id: facilityId,
        name: center.name,
        source: 'eraktkosh',
        category: center.category,
        reportStatus: center.reportStatus,
        totalUnits: center.totalUnits,
      });

      if (center.reportStatus !== 'reporting') continue;

      for (const group of center.groups) {
        const mappedGroup = mapEraktkoshGroup(group.code);
        if (!mappedGroup) continue;

        for (const comp of group.components) {
          if (comp.status === 'not_reported' || comp.units === null) continue;
          const mappedComponent = mapEraktkoshComponent(comp.code);

          rows.push({
            id: `ek:${center.id}:${group.code}:${comp.code}`,
            facilityId,
            facilityName: center.name,
            facilityCategory: center.category,
            facilityPhone: center.phone,
            source: 'eraktkosh',
            bloodGroup: mappedGroup,
            groupLabel: BLOOD_GROUP_LABELS[mappedGroup] ?? group.label,
            componentType: mappedComponent,
            componentLabel: comp.name || BLOOD_COMPONENT_LABELS[mappedComponent],
            unitsAvailable: comp.units,
            status: statusForUnits(comp.units),
            lastUpdated: center.sourceEntryAt ?? center.fetchedAt,
          });
        }
      }
    }
  }

  return { facilities, rows };
}

export function filterUnifiedBloodRows(
  rows: UnifiedBloodStockRow[],
  filters: BloodStockFilters
): UnifiedBloodStockRow[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return rows.filter((item) => {
    const matchesFacility =
      filters.facilityId === ALL_FILTER || item.facilityId === filters.facilityId;
    const matchesGroup =
      filters.bloodGroup === ALL_FILTER || item.bloodGroup === filters.bloodGroup;
    const matchesComponent =
      filters.componentType === ALL_FILTER || item.componentType === filters.componentType;
    const matchesSearch =
      !query ||
      item.facilityName.toLowerCase().includes(query) ||
      item.groupLabel.toLowerCase().includes(query) ||
      item.componentLabel.toLowerCase().includes(query);

    return matchesFacility && matchesGroup && matchesComponent && matchesSearch;
  });
}

export function summarizeByBloodGroup(
  rows: UnifiedBloodStockRow[]
): BloodGroupSummaryCard[] {
  return Object.values(BloodGroup).map((group) => {
    const groupRows = rows.filter((item) => item.bloodGroup === group);
    const totalUnits = groupRows.reduce((sum, item) => sum + item.unitsAvailable, 0);
    const facilityIds = new Set(groupRows.map((item) => item.facilityId));
    const status: StockStatus =
      groupRows.length === 0
        ? 'critical'
        : totalUnits <= CRITICAL_STOCK_THRESHOLD
          ? 'critical'
          : totalUnits <= LOW_STOCK_THRESHOLD
            ? 'low'
            : 'available';

    return {
      group,
      label: BLOOD_GROUP_LABELS[group],
      totalUnits,
      status,
      count: groupRows.length,
      facilityCount: facilityIds.size,
    };
  });
}
