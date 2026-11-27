import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLiveArariaAvailability,
  computeFreshness,
  extractIndianPhone,
  parseIstEntryTimestamp,
  parseProviderQtyPairs,
  resolveProviderGroupCode,
} from './eraktkosh-live';

test('parses IST entry timestamps with explicit +05:30 offset', () => {
  const iso = parseIstEntryTimestamp('2026-11-26 08:45:17');
  assert.equal(iso, '2026-11-26T03:15:17.000Z');
  assert.equal(parseIstEntryTimestamp(null), null);
});

test('parses e-RaktKosh quantity pairs and resolves blood group labels', () => {
  assert.deepEqual(parseProviderQtyPairs('A+Ve : 15, B+Ve : 1, BadEntry'), [
    { label: 'A+Ve', units: 15 },
    { label: 'B+Ve', units: 1 },
  ]);
  assert.equal(resolveProviderGroupCode('B+Ve'), 'B+');
  assert.equal(resolveProviderGroupCode('ab - ve'), 'AB-');
  assert.equal(resolveProviderGroupCode('Oh+VE'), 'Oh+');
  assert.equal(resolveProviderGroupCode('Invalid'), null);
});

test('extracts valid Indian mobile numbers and ignores placeholder zeros', () => {
  assert.equal(extractIndianPhone('Phone: 9031838109 ,Fax: 1234567890'), '9031838109');
  assert.equal(extractIndianPhone('0'), null);
  assert.equal(extractIndianPhone(null), null);
});

test('builds Araria district availability preserving registered centres and no_report semantics', () => {
  const now = new Date('2026-11-27T10:00:00.000Z');
  const result = buildLiveArariaAvailability(
    [
      { hospitalCode: 284908, hospitalName: 'Ms Lions Blood Centre Forbesganj Araria', mobileNo: '9430882219' },
      { hospitalCode: 10140, hospitalName: 'Sadar Hospital Araria', mobileNo: '9708467206' },
    ],
    [
      {
        hospitalCode: '284908',
        hospitalname: 'Ms Lions Blood Centre Forbesganj Araria',
        hospitaladd: 'Forbesganj, Araria, Bihar',
        hospitalcontact: 'Phone: 9031838109',
        hospitalType: 'Charitable/Vol',
        entrydate: '2026-11-26 08:45:17',
        offline: '1',
        components: {
          'Whole Blood': {
            available_WithQty: 'B+Ve : 3',
            not_available_WithQty: 'A+Ve : 0, O+Ve : 0',
          },
          'Packed Red Blood Cells': {
            available_WithQty: '',
            not_available_WithQty: 'B+Ve : 0',
          },
        },
      },
    ],
    now
  );

  assert.equal(result.district.name, 'Araria');
  assert.equal(result.freshness, 'fresh');
  assert.equal(result.asOf, '2026-11-27T10:00:00.000Z');
  assert.equal(result.sourceAsOf, '2026-11-26T03:15:17.000Z');
  assert.equal(result.counts.centersListed, 3); // Includes 284905 from ARARIA_REGISTERED_CENTRES
  assert.equal(result.counts.centersReporting, 1);
  assert.equal(result.counts.centersNoReport, 2);
  assert.equal(result.counts.totalUnits, 3);
  assert.equal(result.counts.groupsWithStock, 1);

  const reporting = result.centers[0];
  assert.equal(reporting?.id, '284908');
  assert.equal(reporting?.reportStatus, 'reporting');
  assert.equal(reporting?.phone, '9031838109');
  assert.equal(reporting?.totalUnits, 3);

  const sadar = result.centers.find((c) => c.id === '10140');
  assert.equal(sadar?.reportStatus, 'no_report');
  assert.equal(sadar?.totalUnits, null);
  assert.equal(sadar?.phone, '9708467206');
});

test('computes freshness bands accurately', () => {
  const now = new Date('2026-11-27T12:00:00.000Z');
  assert.equal(computeFreshness('2026-11-27T11:30:00.000Z', now), 'fresh');
  assert.equal(computeFreshness('2026-11-27T02:00:00.000Z', now), 'aging');
  assert.equal(computeFreshness('2026-11-25T12:00:00.000Z', now), 'stale');
  assert.equal(computeFreshness(null, now), 'none');
});
