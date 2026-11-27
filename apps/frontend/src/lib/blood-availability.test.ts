import test from 'node:test';
import assert from 'node:assert/strict';
import { BloodComponentType, BloodGroup } from '@dh-araria/shared/types';
import {
  ALL_FILTER,
  HOSPITAL_FACILITY_ID,
  buildUnifiedBloodData,
  eraktkoshFacilityId,
  filterUnifiedBloodRows,
  mapEraktkoshComponent,
  mapEraktkoshGroup,
  summarizeByBloodGroup,
  type EraktkoshDistrictData,
  type LocalBloodStockItem,
} from './blood-availability';

const localStock: LocalBloodStockItem[] = [
  {
    id: 's1',
    bloodGroup: BloodGroup.O_POSITIVE,
    componentType: BloodComponentType.WHOLE_BLOOD,
    unitsAvailable: 25,
    lastUpdated: '2026-11-27T10:00:00.000Z',
  },
  {
    id: 's2',
    bloodGroup: BloodGroup.A_NEGATIVE,
    componentType: BloodComponentType.PLATELETS,
    unitsAvailable: 6,
    lastUpdated: '2026-11-27T10:00:00.000Z',
  },
];

const districtData: EraktkoshDistrictData = {
  district: { name: 'Araria', state: 'Bihar' },
  asOf: '2026-11-27T10:15:00.000Z',
  sourceAsOf: '2026-11-27T09:50:00.000Z',
  freshness: 'fresh',
  counts: {
    centersListed: 2,
    centersReporting: 1,
    centersNoReport: 1,
    totalUnits: 14,
    groupsWithStock: 1,
  },
  centers: [
    {
      id: 'center-101',
      name: 'Sadar Hospital Araria Blood Centre',
      category: 'Government',
      address: 'Araria, Bihar',
      phone: '06453222102',
      reportStatus: 'reporting',
      dataMode: 'live',
      sourceEntryAt: '2026-11-27T09:50:00.000Z',
      fetchedAt: '2026-11-27T10:15:00.000Z',
      totalUnits: 14,
      groupsWithStock: ['O+'],
      groups: [
        {
          code: 'O+',
          label: 'O+',
          totalUnits: 14,
          hasStock: true,
          components: [
            {
              code: 'packed_red_blood_cells',
              name: 'Packed Red Blood Cells',
              shortName: 'PRBC',
              units: 14,
              status: 'in_stock',
            },
            {
              code: 'fresh_frozen_plasma',
              name: 'Fresh Frozen Plasma',
              shortName: 'FFP',
              units: null,
              status: 'not_reported',
            },
          ],
        },
      ],
    },
    {
      id: 'center-102',
      name: 'Forbesganj Blood Storage Unit',
      category: 'Government',
      address: 'Forbesganj, Araria',
      phone: null,
      reportStatus: 'no_report',
      dataMode: null,
      sourceEntryAt: null,
      fetchedAt: '2026-11-27T10:15:00.000Z',
      totalUnits: null,
      groupsWithStock: [],
      groups: [],
    },
  ],
};

test('maps e-RaktKosh group and component codes accurately', () => {
  assert.equal(mapEraktkoshGroup('O+'), BloodGroup.O_POSITIVE);
  assert.equal(mapEraktkoshGroup('AB−'), BloodGroup.AB_NEGATIVE);
  assert.equal(mapEraktkoshGroup('Oh+'), null);
  assert.equal(mapEraktkoshComponent('packed_red_blood_cells'), BloodComponentType.PACKED_RED_CELLS);
  assert.equal(mapEraktkoshComponent('fresh_frozen_plasma'), BloodComponentType.PLASMA);
  assert.equal(mapEraktkoshComponent('platelet_concentrate'), BloodComponentType.PLATELETS);
});

test('merges hospital blood bank stock and district e-RaktKosh centres', () => {
  const { facilities, rows } = buildUnifiedBloodData(localStock, districtData);
  assert.equal(facilities.length, 3);
  assert.equal(rows.length, 3); // 2 local + 1 reported e-RaktKosh cell (not_reported skipped)
  assert.equal(facilities[0]?.id, HOSPITAL_FACILITY_ID);
  assert.equal(facilities[1]?.id, eraktkoshFacilityId('center-101'));
  assert.equal(facilities[2]?.reportStatus, 'no_report');
});

test('filters unified stock by facility, blood group, component, and search query', () => {
  const { rows } = buildUnifiedBloodData(localStock, districtData);

  const onlyCenter101 = filterUnifiedBloodRows(rows, {
    facilityId: eraktkoshFacilityId('center-101'),
    bloodGroup: ALL_FILTER,
    componentType: ALL_FILTER,
    searchQuery: '',
  });
  assert.equal(onlyCenter101.length, 1);
  assert.equal(onlyCenter101[0]?.facilityName, 'Sadar Hospital Araria Blood Centre');

  const onlyOPlusAllFacilities = filterUnifiedBloodRows(rows, {
    facilityId: ALL_FILTER,
    bloodGroup: BloodGroup.O_POSITIVE,
    componentType: ALL_FILTER,
    searchQuery: '',
  });
  assert.equal(onlyOPlusAllFacilities.length, 2);

  const oPlusPrbc = filterUnifiedBloodRows(rows, {
    facilityId: ALL_FILTER,
    bloodGroup: BloodGroup.O_POSITIVE,
    componentType: BloodComponentType.PACKED_RED_CELLS,
    searchQuery: '',
  });
  assert.equal(oPlusPrbc.length, 1);
  assert.equal(oPlusPrbc[0]?.unitsAvailable, 14);

  const searchFacility = filterUnifiedBloodRows(rows, {
    facilityId: ALL_FILTER,
    bloodGroup: ALL_FILTER,
    componentType: ALL_FILTER,
    searchQuery: 'sadar',
  });
  assert.equal(searchFacility.length, 1);
});

test('summarizes units and facility counts per blood group based on filtered rows', () => {
  const { rows } = buildUnifiedBloodData(localStock, districtData);
  const allSummary = summarizeByBloodGroup(rows);
  const oPlus = allSummary.find((c) => c.group === BloodGroup.O_POSITIVE);
  assert.equal(oPlus?.totalUnits, 39);
  assert.equal(oPlus?.facilityCount, 2);
  assert.equal(oPlus?.status, 'available');

  const hospitalOnlySummary = summarizeByBloodGroup(
    filterUnifiedBloodRows(rows, {
      facilityId: HOSPITAL_FACILITY_ID,
      bloodGroup: ALL_FILTER,
      componentType: ALL_FILTER,
      searchQuery: '',
    })
  );
  const oPlusHospital = hospitalOnlySummary.find((c) => c.group === BloodGroup.O_POSITIVE);
  assert.equal(oPlusHospital?.totalUnits, 25);
  assert.equal(oPlusHospital?.facilityCount, 1);
});
